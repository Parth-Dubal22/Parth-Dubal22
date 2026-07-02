/** Tradie app — ported 1:1 from site/app-tradie.html.
 *  Server component: queries the DB directly; all mutations go through API routes.
 *  Risk detail (signals, riskLevel, exposure) is gated by canSeeRiskDetail — it is
 *  stripped server-side so it never reaches a non-subscriber's browser. */
import { and, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { canSeeRiskDetail } from "@/lib/access";
import { formatAbn } from "@/lib/format";
import TradieApp from "./TradieApp";
import type {
  TradieAlert, TradieJob, TradieProfileData, TradieReview, TradieWatchItem,
} from "./types";

export const metadata = { title: "Tradie app — BuildSafe" };
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  homeowner: "Homeowner",
  subcontractor: "Subcontractor",
  builder: "Builder",
};

export default async function TradiePage() {
  const user = await requireUser("tradie");
  const seeRisk = await canSeeRiskDetail(user);

  const [profile, watchRows, exposureRows, alertRows, jobRows, reviewRows] = await Promise.all([
    db.query.tradieProfiles.findFirst({
      where: eq(tables.tradieProfiles.userId, user.id),
    }),
    db.query.watchlistItems.findMany({
      where: eq(tables.watchlistItems.userId, user.id),
      with: {
        company: {
          with: {
            signals: {
              where: (s, { eq: e }) => e(s.status, "approved"),
              orderBy: (s, { desc }) => [desc(s.occurredOn)],
            },
          },
        },
      },
      orderBy: (w, { asc }) => [asc(w.createdAt)],
    }),
    db.query.exposureEntries.findMany({
      where: eq(tables.exposureEntries.userId, user.id),
    }),
    db.query.alerts.findMany({
      where: eq(tables.alerts.userId, user.id),
      with: { signal: { with: { company: true } } },
      orderBy: (a, { desc }) => [desc(a.createdAt)],
    }),
    db.query.jobs.findMany({
      where: eq(tables.jobs.status, "open"),
      with: {
        company: true,
        applications: { columns: { tradieUserId: true } },
      },
      orderBy: (j, { asc }) => [asc(j.id)],
    }),
    db.query.reviews.findMany({
      where: and(
        eq(tables.reviews.subjectUserId, user.id),
        eq(tables.reviews.status, "published"),
      ),
      with: { author: { columns: { name: true } } },
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    }),
  ]);

  const exposureByCompany = new Map<number, number>();
  for (const e of exposureRows) {
    exposureByCompany.set(e.companyId, (exposureByCompany.get(e.companyId) ?? 0) + e.amountCents);
  }

  // Risk detail is stripped here for non-subscribers — facts stay server-side.
  const watch: TradieWatchItem[] = watchRows.map((w) => ({
    companyId: w.companyId,
    name: w.company.name,
    slug: w.company.slug,
    abn: formatAbn(w.company.abn),
    licence: [w.company.licenceNumber, w.company.licenceStatus].filter(Boolean).join(" · "),
    risk: seeRisk ? w.company.riskLevel : null,
    lastCheckedAt: w.company.lastCheckedAt ? w.company.lastCheckedAt.toISOString() : null,
    signals: seeRisk
      ? w.company.signals.map((s) => ({
          title: s.title,
          level: s.level,
          sourceName: s.sourceName,
          sourceUrl: s.sourceUrl,
          date: s.occurredOn.toISOString(),
        }))
      : [],
    exposureCents: seeRisk ? exposureByCompany.get(w.companyId) ?? 0 : null,
  }));

  const alerts: TradieAlert[] = seeRisk
    ? alertRows.map((a) => ({
        id: a.id,
        level: a.signal.level,
        companyName: a.signal.company.name,
        title: a.signal.title,
        detail: a.signal.detail,
        sourceName: a.signal.sourceName,
        sourceUrl: a.signal.sourceUrl,
        occurredOn: a.signal.occurredOn.toISOString(),
        createdAt: a.createdAt.toISOString(),
        read: a.readAt != null,
      }))
    : [];

  const jobsList: TradieJob[] = jobRows.map((j) => ({
    id: j.id,
    title: j.title,
    type: j.type,
    rate: j.rate,
    location: j.location,
    startText: j.startText,
    duration: j.duration,
    requirement: j.requirement,
    builderName: j.company.name,
    builderRisk: seeRisk ? j.company.riskLevel : null,
    applicants: j.applications.length,
    applied: j.applications.some((a) => a.tradieUserId === user.id),
  }));

  const myReviews: TradieReview[] = reviewRows.map((r) => ({
    id: r.id,
    author: r.author.name,
    role: ROLE_LABEL[r.authorRole] ?? r.authorRole,
    rating: r.rating,
    text: r.text,
    reply: r.reply,
  }));

  const ratingAvg = myReviews.length
    ? Math.round((myReviews.reduce((a, r) => a + r.rating, 0) / myReviews.length) * 10) / 10
    : null;

  const profileData: TradieProfileData = {
    name: user.name,
    trades: profile?.trades ?? [],
    suburb: profile?.suburb ?? "",
    state: profile?.state ?? "VIC",
    abn: formatAbn(profile?.abn ?? ""),
    licenceNumber: profile?.licenceNumber ?? "",
    licenceVerified: profile?.licenceVerified ?? false,
    insuranceProvider: profile?.insuranceProvider ?? "",
    insuranceExpiry: profile?.insuranceExpiry
      ? profile.insuranceExpiry.toISOString().slice(0, 10)
      : "",
    insuranceVerified: profile?.insuranceVerified ?? false,
    availableNow: profile?.availableNow ?? false,
    reliabilityScore: profile?.reliabilityScore ?? null,
    jobsCompleted: profile?.jobsCompleted ?? 0,
    portfolio: profile?.portfolio ?? [],
    ratingAvg,
  };

  return (
    <TradieApp
      seeRisk={seeRisk}
      profile={profileData}
      watch={watch}
      alerts={alerts}
      jobs={jobsList}
      reviews={myReviews}
    />
  );
}
