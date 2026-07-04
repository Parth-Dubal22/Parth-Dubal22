import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { rateLimit, tooMany, userKey } from "@/lib/rate-limit";

/**
 * POST /api/alerts/read — any signed-in user.
 * { alertId } → { ok } (marks own alert as read; never touches other users' alerts)
 */

const postSchema = z.object({
  alertId: z.number().int().positive(),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return bad("Sign in to manage your alerts.", 401);

  const rl = await rateLimit(userKey("alerts-read", user, req), { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return bad(parsed.error.issues[0]?.message ?? "A valid alertId is required.");
  }

  const [updated] = await db
    .update(tables.alerts)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(tables.alerts.id, parsed.data.alertId),
        eq(tables.alerts.userId, user.id),
      ),
    )
    .returning({ id: tables.alerts.id });

  if (!updated) return bad("Alert not found.", 404);
  return NextResponse.json({ ok: true });
}
