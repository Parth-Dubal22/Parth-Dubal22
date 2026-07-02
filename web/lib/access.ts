/** Subscription gating — risk detail is PRIVATE to paying subscribers
 *  (defamation design: Master Plan §4.1.3). Public pages show positive/neutral only. */
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";

export async function hasActiveSubscription(userId: number): Promise<boolean> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(tables.subscriptions.userId, userId),
  });
  return sub?.status === "active" || sub?.status === "past_due";
}

/** Admins always see risk detail (they run the review queues). */
export async function canSeeRiskDetail(user: { id: number; role: string } | null): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin") return true;
  return hasActiveSubscription(user.id);
}
