import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";

/**
 * PATCH /api/jobs/[id] — job owner (builder) or admin.
 * { status:'open'|'closed' } → { ok }
 */

const patchSchema = z.object({
  status: z.enum(["open", "closed"]),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await apiUser("builder");
  if (!user) return bad("Sign in as a builder to manage your jobs.", 401);

  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) return bad("Invalid job id.", 404);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return bad(parsed.error.issues[0]?.message ?? "status must be 'open' or 'closed'.");
  }

  const job = await db.query.jobs.findFirst({ where: eq(tables.jobs.id, jobId) });
  if (!job) return bad("Job not found.", 404);
  if (user.role !== "admin" && job.builderUserId !== user.id) {
    return bad("Only the poster can update this job.", 403);
  }

  await db
    .update(tables.jobs)
    .set({ status: parsed.data.status })
    .where(eq(tables.jobs.id, jobId));

  return NextResponse.json({ ok: true });
}
