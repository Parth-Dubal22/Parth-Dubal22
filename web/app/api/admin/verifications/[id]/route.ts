/** POST /api/admin/verifications/[id] — verification badge decisions.
 *  Body: { action:'approve'|'reject'|'revoke', note? } → { ok }
 *  Approve ⇒ company gets the requested tier (tierGrantedAt = now).
 *  Reject ⇒ request closed, tier unchanged.
 *  Revoke ⇒ INSTANT: tier back to none; a note explaining why is required
 *  (published criteria, monthly re-checks, instant revocation). */
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { rateLimit, tooMany, userKey } from "@/lib/rate-limit";

const schema = z.object({
  action: z.enum(["approve", "reject", "revoke"]),
  note: z.string().trim().max(2000).optional(),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser("admin");
  if (!user) return bad("Admin only.", 401);

  // Admins are trusted, but cap runaway loops.
  const rl = await rateLimit(userKey("admin-verifications", user, req), { limit: 120, windowMs: 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { id } = await ctx.params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) return bad("Invalid verification request id.");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return bad("action must be 'approve', 'reject' or 'revoke'.");
  const { action, note } = parsed.data;

  const request = await db.query.verificationRequests.findFirst({
    where: eq(tables.verificationRequests.id, requestId),
  });
  if (!request) return bad("Verification request not found.", 404);

  if (action === "revoke") {
    // Instant revocation always requires a documented reason, and only a
    // granted (approved) badge can be revoked.
    if (!note) return bad("A note explaining the revocation is required.");
    if (request.status !== "approved") return bad(`Only granted badges can be revoked (request is ${request.status}).`, 409);
    await db
      .update(tables.verificationRequests)
      .set({ status: "revoked", decidedByUserId: user.id, decidedAt: new Date(), note })
      .where(eq(tables.verificationRequests.id, requestId));
    await db
      .update(tables.companies)
      .set({ tier: "none", tierGrantedAt: null })
      .where(eq(tables.companies.id, request.companyId));
    return NextResponse.json({ ok: true });
  }

  if (request.status !== "pending") return bad(`Request already ${request.status}.`, 409);

  await db
    .update(tables.verificationRequests)
    .set({
      status: action === "approve" ? "approved" : "rejected",
      decidedByUserId: user.id,
      decidedAt: new Date(),
      note: note ?? null,
    })
    .where(eq(tables.verificationRequests.id, requestId));

  if (action === "approve") {
    await db
      .update(tables.companies)
      .set({ tier: request.tier, tierGrantedAt: new Date() })
      .where(eq(tables.companies.id, request.companyId));
  }

  return NextResponse.json({ ok: true });
}
