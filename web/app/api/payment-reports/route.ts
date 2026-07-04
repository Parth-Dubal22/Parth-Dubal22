/** POST /api/payment-reports — tradie logs a late-payment report against a
 *  builder company. Body: { companyId, daysLate:1..365, hasInvoiceEvidence } → { ok }
 *  Reports are only ever DISPLAYED aggregated & anonymised
 *  (e.g. "3 verified reports of 60+ day delays") — never verbatim, never attributed.
 *  Upsert on (companyId, reporterUserId); verified=false until admin verifies. */
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { rateLimit, tooMany, userKey } from "@/lib/rate-limit";

const schema = z.object({
  companyId: z.number().int().positive(),
  daysLate: z.number().int().min(1).max(365),
  hasInvoiceEvidence: z.boolean(),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  const user = await apiUser("tradie");
  if (!user) return bad("Sign in as a tradie to report payment behaviour.", 401);

  const rl = await rateLimit(userKey("payment-reports", user, req), { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid payment report.");
  const { companyId, daysLate, hasInvoiceEvidence } = parsed.data;

  const company = await db.query.companies.findFirst({ where: eq(tables.companies.id, companyId) });
  if (!company) return bad("Company not found.", 404);

  // One report per reporter per company — updating replaces the previous one
  // and resets verification (admin re-verifies the new figures).
  await db
    .insert(tables.paymentReports)
    .values({ companyId, reporterUserId: user.id, daysLate, hasInvoiceEvidence, verified: false })
    .onConflictDoUpdate({
      target: [tables.paymentReports.companyId, tables.paymentReports.reporterUserId],
      set: { daysLate, hasInvoiceEvidence, verified: false, createdAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
