import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { rateLimit, tooMany, userKey } from "@/lib/rate-limit";

/**
 * POST /api/jobs — builder only.
 * { title, type:'subcontract'|'day_hire', rate, location, startText, duration, requirement?, trade? } → { ok, job }
 *
 * Job board = noticeboard, not labour hire: the builder states the rate — the
 * platform never sets pay and never directs work. Posting is free in v1
 * (flat fee per post at launch — never per lead). Tradies always apply free:
 * zero lead fees, no credits, ever.
 */

const postSchema = z.object({
  title: z.string().trim().min(4, "Give the job a title.").max(240),
  type: z.enum(["subcontract", "day_hire"]),
  rate: z.string().trim().min(1, "State a rate / value (builder-stated — we never set pay).").max(80),
  location: z.string().trim().min(2, "Where is the job?").max(160),
  startText: z.string().trim().min(1, "When does it start?").max(80),
  duration: z.string().trim().min(1, "How long will it run?").max(80),
  requirement: z.string().trim().max(200).optional(),
  trade: z.string().trim().max(120).optional(),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  const user = await apiUser("builder");
  if (!user) return bad("Sign in as a builder to post a job.", 401);

  const rl = await rateLimit(userKey("jobs-post", user, req), { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return bad(parsed.error.issues[0]?.message ?? "Invalid job details.");
  }

  // companyId always comes from the poster's own builder profile.
  const profile = await db.query.builderProfiles.findFirst({
    where: eq(tables.builderProfiles.userId, user.id),
  });
  if (!profile) return bad("No builder profile found for your account.", 404);

  const d = parsed.data;
  const [job] = await db
    .insert(tables.jobs)
    .values({
      builderUserId: user.id,
      companyId: profile.companyId,
      title: d.title,
      type: d.type,
      rate: d.rate, // builder-stated; platform never sets pay
      location: d.location,
      startText: d.startText,
      duration: d.duration,
      requirement: d.requirement || null,
      trade: d.trade || null,
    })
    .returning();

  return NextResponse.json({ ok: true, job });
}
