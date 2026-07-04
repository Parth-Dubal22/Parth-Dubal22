import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { rateLimit, tooMany, userKey } from "@/lib/rate-limit";

/**
 * PUT /api/exposure — tradie/builder.
 * { companyId, amountCents, kind:'owed'|'deposit', note? } → { ok, entry }
 * Upsert on (userId, companyId, kind). Money in cents.
 */

const putSchema = z.object({
  companyId: z.number().int().positive(),
  amountCents: z.number().int().min(0).max(100_000_000_000), // up to $1b, keeps bigint sane
  kind: z.enum(["owed", "deposit"]),
  note: z.string().trim().max(300).optional(),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function PUT(req: Request) {
  const user = await apiUser("tradie", "builder");
  if (!user) return bad("Sign in as a tradie or builder to track exposure.", 401);

  const rl = await rateLimit(userKey("exposure", user, req), { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = putSchema.safeParse(raw);
  if (!parsed.success) {
    return bad(parsed.error.issues[0]?.message ?? "Invalid exposure entry.");
  }
  const { companyId, amountCents, kind, note } = parsed.data;

  const company = await db.query.companies.findFirst({
    where: eq(tables.companies.id, companyId),
  });
  if (!company) return bad("No matching company record — try the ABN", 404);

  const [entry] = await db
    .insert(tables.exposureEntries)
    .values({ userId: user.id, companyId, amountCents, kind, note: note || null })
    .onConflictDoUpdate({
      target: [
        tables.exposureEntries.userId,
        tables.exposureEntries.companyId,
        tables.exposureEntries.kind,
      ],
      set: { amountCents, note: note || null, updatedAt: new Date() },
    })
    .returning();

  return NextResponse.json({ ok: true, entry });
}
