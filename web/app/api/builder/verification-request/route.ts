/** POST /api/builder/verification-request — builder applies for a verification tier.
 *  Body: { tier: "id_verified" | "buildsafe_verified" | "track_record" } → { ok, request }
 *  Creates a pending verification_requests row for the builder's company.
 *  Admin decides via /api/admin/verifications/[id]; badges are re-checked monthly
 *  and revoked instantly if criteria stop being met. */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";

const TIERS = ["id_verified", "buildsafe_verified", "track_record"] as const;
type Tier = (typeof TIERS)[number];
const RANK: Record<string, number> = { none: 0, id_verified: 1, buildsafe_verified: 2, track_record: 3 };

export async function POST(req: Request) {
  const user = await apiUser("builder");
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authorised" }, { status: 401 });
  }

  let tier: string | undefined;
  try {
    const body = (await req.json()) as { tier?: string };
    tier = body?.tier;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (!tier || !TIERS.includes(tier as Tier)) {
    return NextResponse.json(
      { ok: false, error: "tier must be one of id_verified | buildsafe_verified | track_record" },
      { status: 400 },
    );
  }

  const profile = await db.query.builderProfiles.findFirst({
    where: eq(tables.builderProfiles.userId, user.id),
    with: { company: true },
  });
  if (!profile) {
    return NextResponse.json({ ok: false, error: "No builder profile found — complete onboarding first" }, { status: 404 });
  }
  const company = profile.company;

  if (RANK[company.tier] >= RANK[tier]) {
    return NextResponse.json({ ok: false, error: "Your company already holds this tier" }, { status: 409 });
  }

  const pending = await db.query.verificationRequests.findFirst({
    where: and(
      eq(tables.verificationRequests.companyId, company.id),
      eq(tables.verificationRequests.tier, tier as Tier),
      eq(tables.verificationRequests.status, "pending"),
    ),
  });
  if (pending) {
    return NextResponse.json({ ok: false, error: "A request for this tier is already pending review" }, { status: 409 });
  }

  // Snapshot of the published criteria we can pre-check from records on file.
  const criteria: Record<string, boolean> = {
    abnActive: company.abnStatus === "Active",
    licenceCurrent: company.licenceStatus === "current",
    insuranceSighted: false, // sighted by the verification team during review
    fiftyVerifiedReviews: (company.reviewCount ?? 0) >= 50,
  };

  const [request] = await db
    .insert(tables.verificationRequests)
    .values({
      companyId: company.id,
      requestedByUserId: user.id,
      tier: tier as Tier,
      status: "pending",
      criteria,
    })
    .returning();

  return NextResponse.json({ ok: true, request });
}
