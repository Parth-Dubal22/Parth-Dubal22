/** Builder app — ported 1:1 from site/app-builder.html.
 *  Server component: queries the DB directly, builds a serialisable view-model,
 *  hands it to the client shell. All mutations go through the API routes. */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { canSeeRiskDetail } from "@/lib/access";
import { centsToMoney, fmtDate, formatAbn, initials, ratingX10ToNumber, ST } from "@/lib/format";
import BuilderApp, { type BuilderVM, type Pill } from "./BuilderApp";

export const metadata: Metadata = {
  title: "Builder app — BuildSafe",
  description:
    "Post jobs, watch your clients and subbie panel, manage verification and reply to reviews — BuildSafe monitors public records and flags signals.",
};

const TIER_RANK: Record<string, number> = { none: 0, id_verified: 1, buildsafe_verified: 2, track_record: 3 };
const TIER_LABEL: Record<string, string> = {
  none: "Not verified",
  id_verified: "ID Verified",
  buildsafe_verified: "BuildSafe Verified",
  track_record: "Verified + Track Record",
};
const ROLE_LABEL: Record<string, string> = { homeowner: "Homeowner", subcontractor: "Subcontractor", builder: "Builder" };
/* avatar colours from the prototype: risk #E5484D · watch #E9950C · ok navy-blue */
const AV: Record<string, string> = { risk: "#E5484D", watch: "#E9950C", ok: "#2E5E8F" };
const KPI_CLS: Record<string, string> = { risk: "risk", watch: "or", ok: "ok" };

export default async function BuilderPage() {
  const user = await requireUser("builder");

  const profile = await db.query.builderProfiles.findFirst({
    where: eq(tables.builderProfiles.userId, user.id),
    with: { company: true },
  });
  if (!profile) redirect("/onboarding");
  const company = profile.company;

  const canSee = await canSeeRiskDetail(user);

  const [ownSignalRows, watchRows, subbieRows, jobRows, reviewRows, pendingReqs] = await Promise.all([
    db.query.signals.findMany({
      where: and(eq(tables.signals.companyId, company.id), eq(tables.signals.status, "approved")),
      orderBy: desc(tables.signals.occurredOn),
    }),
    db.query.watchlistItems.findMany({
      where: and(eq(tables.watchlistItems.userId, user.id), eq(tables.watchlistItems.kind, "client")),
      with: { company: true },
    }),
    db.select().from(tables.subbiePanelItems).where(eq(tables.subbiePanelItems.builderUserId, user.id)),
    db.query.jobs.findMany({
      where: eq(tables.jobs.builderUserId, user.id),
      orderBy: desc(tables.jobs.createdAt),
      with: { applications: { with: { tradie: { with: { tradieProfile: true } } } } },
    }),
    db.query.reviews.findMany({
      where: and(eq(tables.reviews.subjectCompanyId, company.id), eq(tables.reviews.status, "published")),
      orderBy: desc(tables.reviews.createdAt),
      with: { author: true },
    }),
    db.query.verificationRequests.findMany({
      where: and(eq(tables.verificationRequests.companyId, company.id), eq(tables.verificationRequests.status, "pending")),
    }),
  ]);

  /* --- upward watch (clients/developers): latest approved signal + logged exposure --- */
  const clientIds = watchRows.map((w) => w.companyId);
  const [clientSignals, exposures] =
    clientIds.length > 0
      ? await Promise.all([
          db.query.signals.findMany({
            where: and(inArray(tables.signals.companyId, clientIds), eq(tables.signals.status, "approved")),
            orderBy: desc(tables.signals.occurredOn),
          }),
          db
            .select()
            .from(tables.exposureEntries)
            .where(and(eq(tables.exposureEntries.userId, user.id), inArray(tables.exposureEntries.companyId, clientIds))),
        ])
      : [[], []];

  const clients: BuilderVM["clients"] = watchRows.map((w) => {
    const c = w.company;
    const latest = clientSignals.find((s) => s.companyId === c.id); // newest first
    const owedCents = exposures.filter((x) => x.companyId === c.id).reduce((a, x) => a + x.amountCents, 0);
    const st = ST[c.riskLevel];
    return {
      companyId: c.id,
      name: c.name,
      initials: initials(c.name),
      avatarBg: canSee ? AV[c.riskLevel] : AV.ok,
      sub2: owedCents > 0 ? `${centsToMoney(owedCents)} in progress claims outstanding` : (c.location ?? "VIC"),
      src:
        canSee && latest
          ? { title: latest.title, name: latest.sourceName, url: latest.sourceUrl, date: fmtDate(latest.occurredOn) }
          : null,
      pill: canSee ? { label: st[0], cls: st[1] } : null,
    };
  });
  const flagged = canSee ? watchRows.filter((w) => w.company.riskLevel === "risk").length : 0;
  const clientsIntro =
    flagged === 1
      ? "You're exposed to developers too. One flagged:"
      : flagged > 1
        ? `You're exposed to developers too. ${flagged} flagged:`
        : "You're exposed to developers too. Watch the companies you build for:";

  /* --- downward watch (subbie panel): flag insurance expiring within 60 days --- */
  // Server component rendered per-request (force-dynamic); reading the clock is intentional.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const subbies: BuilderVM["subbies"] = subbieRows.map((s) => {
    let sub2: string;
    let pill: Pill;
    let avatarBg: string;
    if (!s.insuranceExpiry) {
      sub2 = "Insurance expiry not on file — add it to track renewals";
      pill = { label: "CHECK", cls: "watch" };
      avatarBg = "#E9950C";
    } else {
      const days = Math.ceil((s.insuranceExpiry.getTime() - now) / 86400000);
      if (days < 0) {
        sub2 = `Insurance expired ${fmtDate(s.insuranceExpiry)}`;
        pill = { label: "EXPIRED", cls: "risk" };
        avatarBg = "#E5484D";
      } else if (days <= 60) {
        sub2 = `Insurance renewal due in ${days} days`;
        pill = { label: "RENEW", cls: "watch" };
        avatarBg = "#E9950C";
      } else {
        const mm = String(s.insuranceExpiry.getMonth() + 1).padStart(2, "0");
        sub2 = `Insurance current · exp ${mm}/${s.insuranceExpiry.getFullYear()}`;
        pill = { label: "OK", cls: "ok" };
        avatarBg = "var(--orange)";
      }
    }
    return {
      id: s.id,
      name: s.trade ? `${s.name} — ${s.trade}` : s.name,
      initials: initials(s.name),
      avatarBg,
      sub2,
      pill,
    };
  });

  /* --- my jobs & applicants (verified licence/insurance + reliability) --- */
  const jobs: BuilderVM["jobs"] = jobRows.map((j) => ({
    id: j.id,
    title: j.title,
    loc: j.location,
    start: j.startText,
    dur: j.duration,
    rate: j.rate,
    status: j.status,
    apps: j.applications
      .filter((a) => a.status !== "withdrawn")
      .map((a) => {
        const tp = a.tradie.tradieProfile;
        const name = tp?.businessName || a.tradie.name;
        const reliability = tp?.reliabilityScore != null ? `Reliability ${tp.reliabilityScore}/100` : "Reliability —";
        const verified =
          tp?.licenceVerified && tp?.insuranceVerified
            ? "licence & insurance verified"
            : tp?.insuranceVerified
              ? "insurance verified"
              : tp?.licenceVerified
                ? "licence verified"
                : "verification pending";
        return {
          id: a.id,
          name,
          initials: initials(name),
          sub2: [reliability, a.note, verified].filter(Boolean).join(" · "),
        };
      }),
  }));
  const openJobs = jobRows.filter((j) => j.status === "open").length;
  const newApplicants = jobRows.reduce((n, j) => n + j.applications.filter((a) => a.status === "applied").length, 0);

  /* --- reviews about my company (reply publicly, never delete) --- */
  const reviews: BuilderVM["reviews"] = reviewRows.map((r) => ({
    id: r.id,
    name: r.author.name,
    initials: initials(r.author.name),
    roleLabel: ROLE_LABEL[r.authorRole] ?? r.authorRole,
    rating: r.rating,
    text: r.text,
    reply: r.reply,
  }));

  /* pstats: on-time payment, aggregated & anonymised from verified subbie reviews */
  const payReviews = reviewRows.filter((r) => r.paidOnTime !== null && r.verified);
  const onTime = payReviews.filter((r) => r.paidOnTime).length;

  const rating = ratingX10ToNumber(company.ratingAvg);
  const st = ST[company.riskLevel];

  const vm: BuilderVM = {
    companyName: company.name,
    companyInitials: initials(company.name),
    slug: company.slug,
    abnFormatted: formatAbn(company.abn),
    licenceLine: [company.licenceSource, company.licenceNumber].filter(Boolean).join(" ") || "Licence pending",
    licenceStatus: company.licenceStatus ?? "status unknown",
    locationLine: (company.location ?? "").toUpperCase(),
    tier: company.tier,
    tierRank: TIER_RANK[company.tier],
    tierLabel: TIER_LABEL[company.tier],
    ratingText: rating != null ? rating.toFixed(1) : "—",
    reviewCount: company.reviewCount,
    tier3Pct: Math.min(99, Math.round((company.reviewCount / 50) * 100)),
    statusLabel: st[0],
    statusCls: st[1],
    kpiCls: KPI_CLS[company.riskLevel],
    lastChecked: company.lastCheckedAt ? fmtDate(company.lastCheckedAt) : "—",
    canSee,
    kpis: { openJobs, newApplicants },
    ownSignals: ownSignalRows.map((s) => ({
      id: s.id,
      date: fmtDate(s.occurredOn),
      title: s.title,
      pill: { label: ST[s.level][0], cls: ST[s.level][1] },
      sourceName: s.sourceName,
      sourceUrl: s.sourceUrl,
    })),
    clientsIntro,
    clients,
    subbies,
    jobs,
    reviews,
    paySummary:
      payReviews.length > 0
        ? { b: `${onTime}/${payReviews.length}`, s: "subbies report on-time payment (verified)" }
        : { b: "—", s: "no verified payment reports yet" },
    pendingTiers: pendingReqs.map((r) => r.tier),
  };

  return <BuilderApp vm={vm} />;
}
