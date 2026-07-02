import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, ilike } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { canSeeRiskDetail } from "@/lib/access";
import { cleanAbn } from "@/lib/format";

/**
 * /api/watchlist — tradie/builder (builders watch clients upward too).
 * POST { companyId?, abn?, name?, kind:'builder'|'client' } → { ok, item } (item includes company)
 * DELETE ?companyId= → { ok } (only own rows)
 */

const postSchema = z.object({
  companyId: z.number().int().positive().optional(),
  abn: z.string().trim().max(20).optional(),
  name: z.string().trim().max(240).optional(),
  kind: z.enum(["builder", "client"]),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Escape LIKE wildcards in user input. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

export async function POST(req: Request) {
  const user = await apiUser("tradie", "builder");
  if (!user) return bad("Sign in as a tradie or builder to use watchlists.", 401);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return bad(parsed.error.issues[0]?.message ?? "Invalid watchlist request.");
  }
  const { companyId, abn, name, kind } = parsed.data;

  // Resolve the company: by id, else exact ABN match, else case-insensitive name match.
  let company = companyId
    ? await db.query.companies.findFirst({ where: eq(tables.companies.id, companyId) })
    : undefined;
  if (!company && abn) {
    const digits = cleanAbn(abn);
    if (digits.length > 0) {
      company = await db.query.companies.findFirst({ where: eq(tables.companies.abn, digits) });
    }
  }
  if (!company && name) {
    company = await db.query.companies.findFirst({
      where: ilike(tables.companies.name, `%${escapeLike(name)}%`),
    });
  }
  if (!company) {
    return bad("No matching company record — try the ABN", 404);
  }

  // Upsert (unique on userId + companyId).
  await db
    .insert(tables.watchlistItems)
    .values({ userId: user.id, companyId: company.id, kind })
    .onConflictDoUpdate({
      target: [tables.watchlistItems.userId, tables.watchlistItems.companyId],
      set: { kind },
    });

  const item = await db.query.watchlistItems.findFirst({
    where: and(
      eq(tables.watchlistItems.userId, user.id),
      eq(tables.watchlistItems.companyId, company.id),
    ),
    with: { company: true },
  });
  if (!item) return bad("Could not save the watchlist item. Please try again.", 500);

  // Risk detail (riskLevel) is private to subscribers/admin.
  if (!(await canSeeRiskDetail(user))) {
    const { riskLevel: _riskLevel, ...companyPublic } = item.company;
    return NextResponse.json({ ok: true, item: { ...item, company: companyPublic } });
  }
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: Request) {
  const user = await apiUser("tradie", "builder");
  if (!user) return bad("Sign in as a tradie or builder to use watchlists.", 401);

  const companyId = Number(new URL(req.url).searchParams.get("companyId"));
  if (!Number.isInteger(companyId) || companyId <= 0) {
    return bad("A valid companyId query parameter is required.");
  }

  await db
    .delete(tables.watchlistItems)
    .where(
      and(
        eq(tables.watchlistItems.userId, user.id),
        eq(tables.watchlistItems.companyId, companyId),
      ),
    );

  return NextResponse.json({ ok: true });
}
