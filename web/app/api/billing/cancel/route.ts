import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { getStripe, isStripeLive } from "@/lib/stripe";

/**
 * POST /api/billing/cancel — subscriber. {} → { ok }
 * Cancel anytime — no lock-ins. Live: cancel_at_period_end (access continues
 * until the period ends). Demo: status set to 'canceled' immediately.
 */

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST() {
  const user = await apiUser();
  if (!user) return bad("Sign in to manage your subscription.", 401);

  const sub = await db.query.subscriptions.findFirst({
    where: (s, { eq: eqOp }) => eqOp(s.userId, user.id),
  });
  if (!sub) return bad("No subscription found for your account.", 404);

  if (isStripeLive() && sub.stripeSubscriptionId) {
    // No lock-in: subscription stays active until the end of the paid period.
    await getStripe().subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    await db
      .update(tables.subscriptions)
      .set({ status: "canceled" })
      .where(eq(tables.subscriptions.userId, user.id));
  }

  return NextResponse.json({ ok: true });
}
