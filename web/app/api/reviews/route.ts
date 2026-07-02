/** POST /api/reviews — two-way, verified reviews (never suppressed).
 *  Body: { subjectCompanyId? | subjectUserId?, rating:1..5, text, paidOnTime?, authorRole } → { ok, review }
 *  - authorRole must match the author's actual account role
 *    (customer→homeowner, tradie→subcontractor, builder→builder).
 *  - Builder-authored reviews target users (tradies); customer/tradie-authored target companies.
 *  - verified=true only when a matching job link exists (builder↔tradie via job_applications).
 *  - One review per author per subject (409 on duplicate).
 *  - Recomputes company ratingAvg (x10) / reviewCount after insert. */
import { NextResponse } from "next/server";
import { z } from "zod";
import { and, avg, count, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";

const schema = z.object({
  subjectCompanyId: z.number().int().positive().optional(),
  subjectUserId: z.number().int().positive().optional(),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(10, "Review text must be at least 10 characters").max(2000),
  paidOnTime: z.boolean().optional(),
  authorRole: z.enum(["homeowner", "subcontractor", "builder"]),
});

/** Account role → the reviewer role it writes as. */
const ROLE_MAP: Record<string, "homeowner" | "subcontractor" | "builder"> = {
  customer: "homeowner",
  tradie: "subcontractor",
  builder: "builder",
};

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Recompute ratingAvg (x10 int) and reviewCount from published reviews. */
async function recomputeCompanyRating(companyId: number) {
  const [agg] = await db
    .select({ avg: avg(tables.reviews.rating), n: count() })
    .from(tables.reviews)
    .where(and(eq(tables.reviews.subjectCompanyId, companyId), eq(tables.reviews.status, "published")));
  const n = Number(agg?.n ?? 0);
  const ratingAvg = n > 0 && agg?.avg != null ? Math.round(Number(agg.avg) * 10) : null;
  await db.update(tables.companies).set({ ratingAvg, reviewCount: n }).where(eq(tables.companies.id, companyId));
}

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return bad("Sign in to write a review.", 401);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid review.");
  const { subjectCompanyId, subjectUserId, rating, text, paidOnTime, authorRole } = parsed.data;

  // Exactly one subject.
  if ((subjectCompanyId ? 1 : 0) + (subjectUserId ? 1 : 0) !== 1) {
    return bad("Provide exactly one of subjectCompanyId or subjectUserId.");
  }

  // authorRole must match the account's actual role.
  const expected = ROLE_MAP[user.role];
  if (!expected) return bad("Admins moderate reviews — they don't write them.", 403);
  if (authorRole !== expected) {
    return bad(`Your account writes reviews as "${expected}".`, 403);
  }

  // Direction rules: builders review tradies (users); customers & tradies review builders (companies).
  if (authorRole === "builder" && !subjectUserId) {
    return bad("Builders review tradies — provide subjectUserId.");
  }
  if (authorRole !== "builder" && !subjectCompanyId) {
    return bad("Provide subjectCompanyId — customers and subbies review builder companies.");
  }

  let verified = false;
  let jobId: number | null = null;

  if (subjectCompanyId) {
    const company = await db.query.companies.findFirst({ where: eq(tables.companies.id, subjectCompanyId) });
    if (!company) return bad("Company not found.", 404);

    // Verified-transaction link (tradie → builder): the author applied to one of this company's jobs.
    if (authorRole === "subcontractor") {
      const [link] = await db
        .select({ jobId: tables.jobApplications.jobId })
        .from(tables.jobApplications)
        .innerJoin(tables.jobs, eq(tables.jobApplications.jobId, tables.jobs.id))
        .where(and(eq(tables.jobApplications.tradieUserId, user.id), eq(tables.jobs.companyId, subjectCompanyId)))
        .limit(1);
      if (link) {
        verified = true;
        jobId = link.jobId;
      }
    }
  } else if (subjectUserId) {
    const subject = await db.query.users.findFirst({ where: eq(tables.users.id, subjectUserId) });
    if (!subject) return bad("Tradie not found.", 404);
    if (subject.role !== "tradie") return bad("Builders review tradies — that account is not a tradie.");
    if (subject.id === user.id) return bad("You can't review yourself.");

    // Verified-transaction link (builder → tradie): the tradie applied to one of the builder's jobs.
    const [link] = await db
      .select({ jobId: tables.jobApplications.jobId })
      .from(tables.jobApplications)
      .innerJoin(tables.jobs, eq(tables.jobApplications.jobId, tables.jobs.id))
      .where(and(eq(tables.jobApplications.tradieUserId, subjectUserId), eq(tables.jobs.builderUserId, user.id)))
      .limit(1);
    if (link) {
      verified = true;
      jobId = link.jobId;
    }
  }

  // One review per author per subject.
  const duplicate = await db.query.reviews.findFirst({
    where: and(
      eq(tables.reviews.authorUserId, user.id),
      subjectCompanyId
        ? eq(tables.reviews.subjectCompanyId, subjectCompanyId)
        : eq(tables.reviews.subjectUserId, subjectUserId!),
    ),
  });
  if (duplicate) return bad("You've already reviewed them — one review per subject.", 409);

  const [review] = await db
    .insert(tables.reviews)
    .values({
      authorUserId: user.id,
      authorRole,
      subjectCompanyId: subjectCompanyId ?? null,
      subjectUserId: subjectUserId ?? null,
      rating,
      text,
      // paidOnTime is the subbie→builder payment-behaviour flag only.
      paidOnTime: authorRole === "subcontractor" ? (paidOnTime ?? null) : null,
      verified,
      jobId,
    })
    .returning();

  if (subjectCompanyId) await recomputeCompanyRating(subjectCompanyId);

  return NextResponse.json({ ok: true, review });
}
