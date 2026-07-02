/**
 * Free builder check — shared resolution logic.
 *
 * Used by POST /api/check (client-side searches) and by /check?q=
 * (server-side auto-run from the landing hero). Builds a FACTS snapshot
 * only: registration status, licence standing, verification tier and a
 * COUNT of adverse public records in the last 24 months. A count is a
 * fact — no signal levels or titles are ever exposed publicly.
 * Never fabricates data: if nothing is found, the snapshot says so.
 */
import { randomBytes } from "crypto";
import { and, count, eq, gte, ilike, ne } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { cleanAbn, slugify } from "@/lib/format";
import { lookupAbn, ABR_SOURCE_URL } from "@/lib/sources/abr";
import { VBA_SOURCE_URL } from "@/lib/sources/vba";
import { ASIC_NOTICES_URL } from "@/lib/sources/asic";
import type { CompanyRecord } from "@/lib/sources/types";

type Company = typeof tables.companies.$inferSelect;
type Snapshot = typeof tables.builderChecks.$inferInsert["snapshot"];

/** The three public sources every check consults (each with a verify-at-source URL). */
export const CHECK_SOURCES = [
  { name: "ABN Lookup", url: ABR_SOURCE_URL },
  { name: "VBA register", url: VBA_SOURCE_URL },
  { name: "ASIC published notices", url: ASIC_NOTICES_URL },
];

const SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomSlug(len = 10): string {
  const bytes = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += SLUG_CHARS[bytes[i] % SLUG_CHARS.length];
  return s;
}

/** Count of APPROVED adverse signals (level != ok) in the last 24 months — a plain fact. */
async function adverseRecordCount(companyId: number): Promise<number> {
  const since = new Date();
  since.setMonth(since.getMonth() - 24);
  const [row] = await db
    .select({ n: count() })
    .from(tables.signals)
    .where(
      and(
        eq(tables.signals.companyId, companyId),
        eq(tables.signals.status, "approved"),
        ne(tables.signals.level, "ok"),
        gte(tables.signals.occurredOn, since),
      ),
    );
  return Number(row?.n ?? 0);
}

/** Upsert a company row from an ABR record (only ever real register data — never fabricated). */
async function upsertCompanyFromAbr(rec: CompanyRecord): Promise<Company | null> {
  const existing = await db.query.companies.findFirst({
    where: eq(tables.companies.abn, rec.abn),
  });
  if (existing) return existing;

  let slug = slugify(rec.name) || `company-${rec.abn}`;
  const clash = await db.query.companies.findFirst({
    where: eq(tables.companies.slug, slug),
  });
  if (clash) slug = `${slug}-${rec.abn.slice(-4)}`.slice(0, 260);

  const [inserted] = await db
    .insert(tables.companies)
    .values({
      abn: rec.abn,
      name: rec.name,
      slug,
      entityType: rec.entityType ?? null,
      gstRegistered: rec.gstRegistered ?? null,
      abnStatus: rec.abnStatus ?? null,
      location: rec.location ?? null,
      state: rec.state ?? "VIC",
      lastCheckedAt: new Date(),
    })
    .onConflictDoNothing({ target: tables.companies.abn })
    .returning();
  if (inserted) return inserted;
  // Concurrent insert won the race — read it back.
  return (
    (await db.query.companies.findFirst({
      where: eq(tables.companies.abn, rec.abn),
    })) ?? null
  );
}

/**
 * Resolve a name-or-ABN query, snapshot the facts, persist a builder_checks
 * row, and return its shareable slug.
 */
export async function runCheck(rawQuery: string): Promise<string> {
  const query = String(rawQuery ?? "").trim().slice(0, 240);
  if (!query) throw new Error("Empty query");

  const digits = cleanAbn(query);
  const isAbn = digits.length === 11;

  // 1) Resolve against our own ABN-anchored company records.
  let company: Company | null | undefined = isAbn
    ? await db.query.companies.findFirst({ where: eq(tables.companies.abn, digits) })
    : await db.query.companies.findFirst({
        where: ilike(tables.companies.name, `%${query.replace(/[%_\\]/g, "\\$&")}%`),
      });

  // 2) Unknown ABN → ask the ABN Lookup connector; upsert only if the register knows it.
  if (!company && isAbn) {
    let rec: CompanyRecord | null = null;
    try {
      rec = await lookupAbn(digits);
    } catch {
      rec = null; // source unavailable — treat as no record, never fabricate
    }
    if (rec) company = await upsertCompanyFromAbr(rec);
  }

  const checkedAt = new Date();
  let snapshot: Snapshot;
  let companyId: number | null = null;

  if (company) {
    companyId = company.id;
    const publicRecordCount = await adverseRecordCount(company.id);
    snapshot = {
      abn: company.abn,
      name: company.name,
      abnStatus: company.abnStatus ?? undefined,
      entityType: company.entityType ?? undefined,
      licenceNumber: company.licenceNumber ?? undefined,
      licenceStatus: company.licenceStatus ?? undefined,
      licenceSource: company.licenceSource ?? undefined,
      publicRecordCount,
      verifiedTier: company.tier !== "none" ? company.tier : undefined,
      checkedAt: checkedAt.toISOString(),
      sources: CHECK_SOURCES,
    };
    // Data-freshness discipline: record when we last checked this company.
    await db
      .update(tables.companies)
      .set({ lastCheckedAt: checkedAt })
      .where(eq(tables.companies.id, company.id));
  } else {
    // No record found — say so plainly. NEVER fabricate data.
    snapshot = {
      name: query,
      abn: isAbn ? digits : undefined,
      checkedAt: checkedAt.toISOString(),
      sources: CHECK_SOURCES,
    };
  }

  // Random 10-char shareable slug (retry on the astronomically unlikely collision).
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = randomSlug(10);
    const [row] = await db
      .insert(tables.builderChecks)
      .values({ slug, companyId, query, snapshot })
      .onConflictDoNothing({ target: tables.builderChecks.slug })
      .returning({ slug: tables.builderChecks.slug });
    if (row) return row.slug;
  }
  throw new Error("Could not allocate a check slug");
}
