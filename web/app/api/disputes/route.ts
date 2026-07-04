/** POST /api/disputes — anyone signed in can dispute a signal, review, check
 *  or profile. 48-hour correction SLA (defamation discipline: fast, documented
 *  dispute/correction process). Body: { targetType, targetId, reason } → { ok, slaDueAt } */
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { rateLimit, tooMany, userKey } from "@/lib/rate-limit";

const schema = z.object({
  targetType: z.enum(["signal", "review", "check", "profile"]),
  targetId: z.number().int().positive(),
  reason: z.string().trim().min(10, "Please describe what's wrong (10+ characters)").max(2000),
});

const SLA_HOURS = 48;

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Validate the disputed record actually exists. */
async function targetExists(type: "signal" | "review" | "check" | "profile", id: number): Promise<boolean> {
  switch (type) {
    case "signal":
      return !!(await db.query.signals.findFirst({ where: eq(tables.signals.id, id) }));
    case "review":
      return !!(await db.query.reviews.findFirst({ where: eq(tables.reviews.id, id) }));
    case "check":
      return !!(await db.query.builderChecks.findFirst({ where: eq(tables.builderChecks.id, id) }));
    case "profile":
      return !!(await db.query.companies.findFirst({ where: eq(tables.companies.id, id) }));
  }
}

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return bad("Sign in to raise a dispute.", 401);

  const rl = await rateLimit(userKey("disputes", user, req), { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid dispute.");
  const { targetType, targetId, reason } = parsed.data;

  if (!(await targetExists(targetType, targetId))) {
    return bad(`No ${targetType} found with that id.`, 404);
  }

  const slaDueAt = new Date(Date.now() + SLA_HOURS * 3600 * 1000);
  await db.insert(tables.disputes).values({
    raisedByUserId: user.id,
    targetType,
    targetId,
    reason,
    status: "open",
    slaDueAt,
  });

  return NextResponse.json({ ok: true, slaDueAt: slaDueAt.toISOString() });
}
