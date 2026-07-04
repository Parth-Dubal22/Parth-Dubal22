import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { rateLimit, tooMany, userKey } from "@/lib/rate-limit";

/**
 * POST /api/applications/[id] — builder (job owner) only.
 * { action:'accept'|'decline' } → { ok }
 *
 * accept  ⇒ application status 'contacted' AND the tradie is added to the
 *           builder's subbie panel (downward watch: licence/insurance expiry
 *           tracking), so accepting an applicant really wires up requirement #6.
 * decline ⇒ application status 'declined'.
 * We never invoice for labour or set pay — the parties contract directly.
 */

const schema = z.object({ action: z.enum(["accept", "decline"]) });

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await apiUser("builder");
  if (!user) return bad("Sign in as a builder.", 401);

  const rl = await rateLimit(userKey("applications", user, req), { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { id } = await ctx.params;
  const appId = Number(id);
  if (!Number.isInteger(appId) || appId <= 0) return bad("Invalid application id.", 404);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid action.");
  const { action } = parsed.data;

  // Load the application + its job, and confirm this builder owns the job.
  const application = await db.query.jobApplications.findFirst({
    where: eq(tables.jobApplications.id, appId),
    with: { job: true, tradie: { with: { tradieProfile: true } } },
  });
  if (!application) return bad("Application not found.", 404);
  if (application.job.builderUserId !== user.id && user.role !== "admin") {
    return bad("That application isn't on one of your jobs.", 403);
  }

  if (action === "decline") {
    await db
      .update(tables.jobApplications)
      .set({ status: "declined" })
      .where(eq(tables.jobApplications.id, appId));
    return NextResponse.json({ ok: true });
  }

  // accept
  await db
    .update(tables.jobApplications)
    .set({ status: "contacted" })
    .where(eq(tables.jobApplications.id, appId));

  // Add the tradie to the subbie panel if not already there.
  const tp = application.tradie.tradieProfile;
  const existing = await db.query.subbiePanelItems.findFirst({
    where: and(
      eq(tables.subbiePanelItems.builderUserId, user.id),
      eq(tables.subbiePanelItems.tradieUserId, application.tradieUserId),
    ),
  });
  if (!existing) {
    await db.insert(tables.subbiePanelItems).values({
      builderUserId: user.id,
      tradieUserId: application.tradieUserId,
      name: tp?.businessName || application.tradie.name,
      trade: tp?.trades?.[0] ?? application.job.trade ?? null,
      licenceNumber: tp?.licenceNumber ?? null,
      insuranceExpiry: tp?.insuranceExpiry ?? null,
    });
  }

  return NextResponse.json({ ok: true });
}
