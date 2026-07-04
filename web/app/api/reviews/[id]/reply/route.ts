/** POST /api/reviews/[id]/reply — builder replies publicly to a review of their
 *  company (or admin). Replies are public and permanent; reviews are never
 *  deleted or suppressed. Body: { reply } → { ok } */
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { rateLimit, tooMany, userKey } from "@/lib/rate-limit";

const schema = z.object({
  reply: z.string().trim().min(2, "Reply is too short").max(2000),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser("builder");
  if (!user) return bad("Sign in as a builder to reply.", 401);

  const rl = await rateLimit(userKey("reviews-reply", user, req), { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { id } = await ctx.params;
  const reviewId = Number(id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) return bad("Invalid review id.");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid reply.");

  const review = await db.query.reviews.findFirst({ where: eq(tables.reviews.id, reviewId) });
  if (!review) return bad("Review not found.", 404);
  if (!review.subjectCompanyId) return bad("Only reviews of a builder company can be replied to here.");

  // Only the builder whose company is the subject (or admin) may reply.
  if (user.role !== "admin") {
    const profile = await db.query.builderProfiles.findFirst({
      where: eq(tables.builderProfiles.userId, user.id),
    });
    if (!profile || profile.companyId !== review.subjectCompanyId) {
      return bad("You can only reply to reviews of your own company.", 403);
    }
  }

  if (review.reply) return bad("A public reply is already posted — replies are permanent.", 409);

  await db
    .update(tables.reviews)
    .set({ reply: parsed.data.reply, repliedAt: new Date() })
    .where(eq(tables.reviews.id, reviewId));

  return NextResponse.json({ ok: true });
}
