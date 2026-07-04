import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { rateLimit, tooMany, userKey } from "@/lib/rate-limit";

/**
 * POST /api/jobs/[id]/apply — tradie only.
 * { note? } → { ok }  (unique per tradie — repeat applications get a friendly 409)
 *
 * Applying is ALWAYS free — zero lead fees, no credits, ever.
 */

const applySchema = z.object({
  note: z.string().trim().max(500, "Keep your note under 500 characters.").optional(),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await apiUser("tradie");
  if (!user) return bad("Sign in as a tradie to apply — it's always free.", 401);

  const rl = await rateLimit(userKey("jobs-apply", user, req), { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) return bad("Invalid job id.", 404);

  // Body is optional; treat an empty/absent body as {}.
  let raw: unknown = {};
  try {
    const text = await req.text();
    if (text.trim()) raw = JSON.parse(text);
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = applySchema.safeParse(raw);
  if (!parsed.success) {
    return bad(parsed.error.issues[0]?.message ?? "Invalid application.");
  }

  const job = await db.query.jobs.findFirst({ where: eq(tables.jobs.id, jobId) });
  if (!job) return bad("Job not found.", 404);
  if (job.status !== "open") return bad("This job is closed to new applications.", 409);

  // Unique per tradie: upsert-or-409.
  const inserted = await db
    .insert(tables.jobApplications)
    .values({
      jobId,
      tradieUserId: user.id,
      note: parsed.data.note || null,
    })
    .onConflictDoNothing()
    .returning({ id: tables.jobApplications.id });

  if (inserted.length === 0) return bad("Already applied", 409);
  return NextResponse.json({ ok: true });
}
