/**
 * Ingest pipeline v1 — one record per ABN, signal log per company.
 *
 * ingestAbn(abnOrName):
 *   1. Resolve the ABN (11 digits, or match an existing company by name).
 *   2. ABR lookup → upsert the companies row (slug from name; existing rows
 *      are freshened, lastCheckedAt always updated for data-freshness copy).
 *   3. VBA practitioner register → licence number/status/source.
 *   4. ASIC/source connectors → insert signals with status "pending",
 *      deduped by sourceRef + title. NEVER auto-approved — every signal goes
 *      through the human review queue (admin approve ⇒ alert fan-out).
 */
import { eq, ilike } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { slugify } from "@/lib/format";
import { lookupAbn } from "@/lib/sources/abr";
import { fetchNoticesForCompany } from "@/lib/sources/asic";
import { lookupLicence } from "@/lib/sources/vba";
import type { SourceSignal } from "@/lib/sources/types";

export interface IngestResult {
  companyId: number;
  slug: string;
  createdCompany: boolean;
  abn: string;
  name: string;
  abnStatus?: string;
  licenceNumber?: string;
  licenceStatus?: string;
  signalsFound: number;
  signalsInsertedPending: number;
  signalsSkippedDuplicate: number;
  fixture: boolean;
}

/** Resolve an input string to an 11-digit ABN (direct, or via existing company name). */
async function resolveAbn(abnOrName: string): Promise<string | null> {
  const digits = String(abnOrName ?? "").replace(/\D/g, "");
  if (digits.length === 11) return digits;
  const q = String(abnOrName ?? "").trim();
  if (!q) return null;
  const match = await db.query.companies.findFirst({
    where: ilike(tables.companies.name, `%${q}%`),
  });
  return match?.abn ?? null;
}

/** Pick a slug that is unique among companies (excluding the company itself). */
async function uniqueSlug(name: string, abn: string, ownCompanyId?: number): Promise<string> {
  const base = slugify(name) || `company-${abn}`;
  const clash = await db.query.companies.findFirst({
    where: eq(tables.companies.slug, base),
  });
  if (!clash || clash.id === ownCompanyId) return base;
  return `${base}-${abn.slice(-4)}`;
}

export async function ingestAbn(abnOrName: string): Promise<IngestResult | null> {
  const abn = await resolveAbn(abnOrName);
  if (!abn) return null;

  const record = await lookupAbn(abn);
  if (!record) return null;

  /* ---- upsert company (keep existing data fresh, never lose local fields) ---- */
  const existing = await db.query.companies.findFirst({
    where: eq(tables.companies.abn, record.abn),
  });

  let companyId: number;
  let slug: string;
  let createdCompany = false;

  if (existing) {
    slug = existing.slug; // slugs are shared URLs — keep them stable
    companyId = existing.id;
    await db.update(tables.companies).set({
      name: record.name,
      entityType: record.entityType ?? existing.entityType,
      gstRegistered: record.gstRegistered ?? existing.gstRegistered,
      abnStatus: record.abnStatus ?? existing.abnStatus,
      location: existing.location ?? record.location,
      state: existing.state ?? record.state,
      lastCheckedAt: new Date(),
    }).where(eq(tables.companies.id, existing.id));
  } else {
    slug = await uniqueSlug(record.name, record.abn);
    const [row] = await db.insert(tables.companies).values({
      abn: record.abn,
      name: record.name,
      slug,
      entityType: record.entityType,
      gstRegistered: record.gstRegistered,
      abnStatus: record.abnStatus,
      location: record.location,
      state: record.state ?? "VIC",
      lastCheckedAt: new Date(),
    }).returning();
    companyId = row.id;
    createdCompany = true;
  }

  /* ---- VBA licence status ---- */
  const licence = await lookupLicence(record.name, record.abn);
  if (licence) {
    await db.update(tables.companies).set({
      licenceNumber: licence.licenceNumber,
      licenceStatus: licence.licenceStatus,
      licenceSource: licence.sourceName,
      lastCheckedAt: new Date(),
    }).where(eq(tables.companies.id, companyId));
  }

  /* ---- source signals → pending review queue (dedupe by sourceRef + title) ---- */
  const found: SourceSignal[] = await fetchNoticesForCompany(record.name, record.abn);
  const existingSignals = await db.query.signals.findMany({
    where: eq(tables.signals.companyId, companyId),
    columns: { title: true, sourceRef: true },
  });

  let inserted = 0;
  let skipped = 0;
  for (const s of found) {
    const dupe = existingSignals.some(
      (e) =>
        e.title === s.title ||
        (s.sourceRef != null && e.sourceRef != null && e.sourceRef === s.sourceRef)
    );
    if (dupe) { skipped++; continue; }
    await db.insert(tables.signals).values({
      companyId,
      occurredOn: s.occurredOn,
      title: s.title, // FACT statement, never a verdict
      detail: s.detail,
      level: s.level,
      sourceName: s.sourceName,
      sourceUrl: s.sourceUrl,
      sourceRef: s.sourceRef,
      status: "pending", // NEVER auto-approve — human-in-the-loop review
    });
    existingSignals.push({ title: s.title, sourceRef: s.sourceRef ?? null });
    inserted++;
  }

  return {
    companyId,
    slug,
    createdCompany,
    abn: record.abn,
    name: record.name,
    abnStatus: record.abnStatus,
    licenceNumber: licence?.licenceNumber,
    licenceStatus: licence?.licenceStatus,
    signalsFound: found.length,
    signalsInsertedPending: inserted,
    signalsSkippedDuplicate: skipped,
    fixture: record.fixture === true,
  };
}
