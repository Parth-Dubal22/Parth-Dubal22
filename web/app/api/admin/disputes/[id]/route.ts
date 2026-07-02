/** POST /api/admin/disputes/[id] — resolve a dispute inside the 48h SLA.
 *  Body: { action:'corrected'|'rejected', resolution } → { ok }
 *  Corrected + targetType=signal ⇒ the signal is set to 'rejected' immediately
 *  (fast correction) and the company risk level is recomputed. */
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { recomputeCompanyRisk } from "@/lib/risk";

const schema = z.object({
  action: z.enum(["corrected", "rejected"]),
  resolution: z.string().trim().min(5, "Write a resolution note (5+ characters)").max(2000),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser("admin");
  if (!user) return bad("Admin only.", 401);

  const { id } = await ctx.params;
  const disputeId = Number(id);
  if (!Number.isInteger(disputeId) || disputeId <= 0) return bad("Invalid dispute id.");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid resolution.");
  const { action, resolution } = parsed.data;

  const dispute = await db.query.disputes.findFirst({ where: eq(tables.disputes.id, disputeId) });
  if (!dispute) return bad("Dispute not found.", 404);
  if (dispute.status !== "open") return bad(`Dispute already ${dispute.status}.`, 409);

  await db
    .update(tables.disputes)
    .set({ status: action, resolvedAt: new Date(), resolution })
    .where(eq(tables.disputes.id, disputeId));

  // Fast correction: a corrected signal comes down immediately.
  if (action === "corrected" && dispute.targetType === "signal") {
    const signal = await db.query.signals.findFirst({ where: eq(tables.signals.id, dispute.targetId) });
    if (signal) {
      await db
        .update(tables.signals)
        .set({ status: "rejected", reviewedBy: user.id, reviewedAt: new Date() })
        .where(eq(tables.signals.id, signal.id));
      await recomputeCompanyRisk(signal.companyId);
    }
  }

  return NextResponse.json({ ok: true });
}
