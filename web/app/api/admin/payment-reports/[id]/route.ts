/** POST /api/admin/payment-reports/[id] — mark a tradie payment report verified
 *  (invoice evidence sighted). Body: {} → { ok }
 *  Verified reports still only ever surface aggregated & anonymised. */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser("admin");
  if (!user) return bad("Admin only.", 401);

  const { id } = await ctx.params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) return bad("Invalid payment report id.");

  const report = await db.query.paymentReports.findFirst({ where: eq(tables.paymentReports.id, reportId) });
  if (!report) return bad("Payment report not found.", 404);
  if (report.verified) return bad("Report already verified.", 409);

  await db.update(tables.paymentReports).set({ verified: true }).where(eq(tables.paymentReports.id, reportId));

  return NextResponse.json({ ok: true });
}
