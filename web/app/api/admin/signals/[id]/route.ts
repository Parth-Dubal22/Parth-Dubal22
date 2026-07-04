/** POST /api/admin/signals/[id] — human-in-the-loop signal review.
 *  Body: { action:'approve'|'reject' } → { ok, alerted? }
 *  Approve ⇒ publish the fact, fan out alerts+emails to watchers
 *  (dispatchAlertsForSignal also recomputes the company riskLevel).
 *  Reject ⇒ the signal never reaches watchers.
 *  Accuracy discipline: we publish facts with cited sources, never verdicts. */
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { rateLimit, tooMany, userKey } from "@/lib/rate-limit";
import { dispatchAlertsForSignal } from "@/lib/alerts-engine";

const schema = z.object({ action: z.enum(["approve", "reject"]) });

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser("admin");
  if (!user) return bad("Admin only.", 401);

  // Admins are trusted, but cap runaway loops.
  const rl = await rateLimit(userKey("admin-signals", user, req), { limit: 120, windowMs: 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { id } = await ctx.params;
  const signalId = Number(id);
  if (!Number.isInteger(signalId) || signalId <= 0) return bad("Invalid signal id.");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return bad("action must be 'approve' or 'reject'.");

  const signal = await db.query.signals.findFirst({ where: eq(tables.signals.id, signalId) });
  if (!signal) return bad("Signal not found.", 404);
  if (signal.status !== "pending") return bad(`Signal already ${signal.status}.`, 409);

  const status = parsed.data.action === "approve" ? "approved" : "rejected";
  await db
    .update(tables.signals)
    .set({ status, reviewedBy: user.id, reviewedAt: new Date() })
    .where(eq(tables.signals.id, signalId));

  if (status === "approved") {
    const { alerted } = await dispatchAlertsForSignal(signalId);
    return NextResponse.json({ ok: true, alerted });
  }
  return NextResponse.json({ ok: true });
}
