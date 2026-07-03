/** Public live job board — the SEO / social-proof feed (Airtasker pattern).
 *  Noticeboard, not labour hire: builders state the rate, tradies contract
 *  directly with the poster — BuildSafe never sets pay or directs work.
 *
 *  Public visitors see open jobs + positive/neutral poster info only
 *  (company name, verification badge, rating). The builder payment-risk pill
 *  is PRIVATE to subscribers (canSeeRiskDetail) — stripped server-side so it
 *  never reaches a non-subscriber's browser. Applying is ALWAYS free.
 */
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { canSeeRiskDetail } from "@/lib/access";
import { ST, ratingX10ToNumber, timeAgo } from "@/lib/format";
import LandingNav from "@/components/landing/LandingNav";
import EmptyState from "@/components/EmptyState";
import Art from "@/components/Art";
import CategoryGrid from "@/components/CategoryGrid";
import { tilesFor, openJobsByCategory } from "@/lib/find";
import {
  POPULAR,
  popularLabel,
  TRADE_TO_CATEGORY,
  CATEGORY_TO_TRADE,
} from "@/lib/data/categories";
import { tilePhotoForCategory } from "@/lib/photos";
import ApplyButton from "./ApplyButton";

/** A job's effective taxonomy slug: the stored categorySlug, or the legacy
 *  trade mapped through TRADE_TO_CATEGORY (keeps ?trade= links + old rows working). */
const jobCategorySlug = (j: { categorySlug: string | null; trade: string | null }) =>
  j.categorySlug ?? (j.trade ? TRADE_TO_CATEGORY[j.trade] ?? null : null);

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Live construction jobs — Victoria",
    description:
      "Open subcontract packages and day hire posted by Victorian builders. Zero lead fees — tradies apply free. BuildSafe monitors public records and flags signals; subscribers see builder payment-risk status on every job.",
  };
}

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Tiny SVG star — replaces the ★ text glyph outside .stars/.pill (MASTER §13.3). */
const MiniStar = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="var(--star)"
    aria-hidden="true"
    style={{ display: "inline-block", flex: "none" }}
  >
    <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.65 1.13 6.57L12 17.56l-5.9 3.1 1.13-6.57-4.78-4.65 6.6-.96z" />
  </svg>
);

/** 72px hard-hat line illustration for the jobs empty state (MASTER §9). */
const JobsIllustration = () => (
  <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
    <path
      d="M14 46c0-13 9.4-24 22-24s22 11 22 24"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path d="M31 22v-5a5 5 0 0110 0v5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="8" y="46" width="56" height="8" rx="4" stroke="var(--orange)" strokeWidth="2.5" />
    <path d="M27 30v10M36 28v12M45 30v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export default async function JobsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const typeF = one(sp.type); // "" | "day" | "sub"
  const tradeF = one(sp.trade);
  const locF = one(sp.loc).trim().slice(0, 160);
  // R5: ?category= is the new filter; ?trade= stays a legacy alias mapped to it.
  const catF = one(sp.category) || (tradeF ? TRADE_TO_CATEGORY[tradeF] ?? "" : "");

  const user = await currentUser();
  const [seeRisk, jobCounts] = await Promise.all([
    canSeeRiskDetail(user),
    openJobsByCategory(),
  ]);

  const conds = [eq(tables.jobs.status, "open")];
  if (typeF === "day") conds.push(eq(tables.jobs.type, "day_hire"));
  if (typeF === "sub") conds.push(eq(tables.jobs.type, "subcontract"));
  if (catF) {
    // Match the taxonomy slug OR the legacy trade label it maps to.
    const legacyTrade = CATEGORY_TO_TRADE[catF];
    const catCond = legacyTrade
      ? or(eq(tables.jobs.categorySlug, catF), eq(tables.jobs.trade, legacyTrade))
      : eq(tables.jobs.categorySlug, catF);
    if (catCond) conds.push(catCond);
  }
  if (locF) conds.push(ilike(tables.jobs.location, `%${locF.replace(/[%_\\]/g, "\\$&")}%`));

  const jobRows = await db.query.jobs.findMany({
    where: and(...conds),
    with: {
      company: true,
      applications: { columns: { tradieUserId: true } },
    },
    orderBy: [desc(tables.jobs.createdAt), desc(tables.jobs.id)],
  });

  const filtered = typeF !== "" || catF !== "" || locF !== "";

  // Popular category tiles with open-jobs count pills, linking to ?category=.
  const catTiles = tilesFor(POPULAR, jobCounts);
  const catHref = (slug: string) => {
    const q = new URLSearchParams();
    q.set("category", slug);
    if (typeF) q.set("type", typeF);
    if (locF) q.set("loc", locF);
    return `/jobs?${q.toString()}`;
  };

  // Chip links preserve the other filters (server-rendered — crawlable).
  const chipHref = (t: "" | "day" | "sub") => {
    const q = new URLSearchParams();
    if (t) q.set("type", t);
    if (catF) q.set("category", catF);
    if (locF) q.set("loc", locF);
    const s = q.toString();
    return s ? `/jobs?${s}` : "/jobs";
  };

  return (
    <>
      <LandingNav />
      <main>
        <section>
          <div className="wrap">
            <span className="eyebrow">Live job board · Victoria</span>
            <div className="topbar" style={{ marginTop: "var(--s4)" }}>
              <h2>Open jobs from verified-checked builders</h2>
              <span className="pill ok">ZERO LEAD FEES</span>
            </div>

            <div className="filters">
              <a className={`chip${typeF === "" ? " on" : ""}`} href={chipHref("")} aria-current={typeF === "" ? "true" : undefined}>All</a>
              <a className={`chip${typeF === "day" ? " on" : ""}`} href={chipHref("day")} aria-current={typeF === "day" ? "true" : undefined}>Day hire</a>
              <a className={`chip${typeF === "sub" ? " on" : ""}`} href={chipHref("sub")} aria-current={typeF === "sub" ? "true" : undefined}>Subcontract</a>
              <span className="hint" style={{ marginLeft: "auto" }}>Subscribers see builder pay-status on every job — applying is always free.</span>
            </div>

            {/* R5: category filter = popular grid (link mode), count pill = open
                jobs per category. Keeps ?trade= working via the alias above. */}
            <div className="topbar" style={{ margin: "var(--s5) 0 var(--s2)" }}>
              <h3 style={{ fontSize: "1.05rem" }}>Filter by category</h3>
              {catF ? (
                <a className="btn btn-g btn-s" href="/jobs">
                  Clear “{popularLabel(catF)}”
                </a>
              ) : null}
            </div>
            <CategoryGrid tiles={catTiles} hrefFor={catHref} countLabel="open jobs" compact />

            {/* Location filter (44px scale — system §5). */}
            <form method="get" action="/jobs" className="filters" style={{ marginTop: "var(--s4)" }} aria-label="Filter jobs by location">
              {typeF ? <input type="hidden" name="type" value={typeF} /> : null}
              {catF ? <input type="hidden" name="category" value={catF} /> : null}
              <label className="check-row">
                Location
                <div className="w-m">
                  <input type="text" name="loc" defaultValue={locF} placeholder="Suburb or region" aria-label="Filter by location" />
                </div>
              </label>
              <button className="btn btn-g" type="submit">Filter</button>
            </form>

            <div className="grid2">
              {jobRows.map((j) => {
                const st = ST[seeRisk ? j.company.riskLevel : "ok"];
                const rating = ratingX10ToNumber(j.company.ratingAvg);
                const applied = !!user && j.applications.some((a) => a.tradieUserId === user.id);
                const isOwner = !!user && j.builderUserId === user.id;
                const catSlug = jobCategorySlug(j);
                const catName = catSlug ? popularLabel(catSlug) : j.trade;
                const catTile = catSlug ? tilePhotoForCategory(catSlug) : null;
                return (
                  <div className="jobcard" key={j.id}>
                    <div className="top">
                      <div>
                        <h4>{j.title}</h4>
                        <div className="meta">
                          <span>{j.location}</span>
                          <span>Starts {j.startText}</span>
                          <span>{j.duration}</span>
                          {j.requirement ? <span>{j.requirement}</span> : null}
                        </div>
                        {catName ? (
                          <span className="cat-chip" style={{ marginTop: ".5rem" }}>
                            {catTile ? (
                              <span className="cat-thumb">
                                {catTile.photo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={catTile.photo.src} srcSet={catTile.photo.srcSet} sizes="44px" alt="" loading="lazy" decoding="async" />
                                ) : (
                                  <Art kind={catTile.art} />
                                )}
                              </span>
                            ) : null}
                            {catSlug ? <a href={`/jobs?category=${catSlug}`}>{catName}</a> : catName}
                          </span>
                        ) : null}
                      </div>
                      <span className="rate">{j.rate}</span>
                    </div>
                    <div className="paycheck">
                      <span className="who">
                        {seeRisk ? <span className={`pill ${st[1]}`}>Builder: {st[0]}</span> : null}
                        <b>{j.company.name}</b>
                        {j.company.tier !== "none" ? (
                          <span className="vbadge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                            Verified
                          </span>
                        ) : null}
                        {rating != null && j.company.reviewCount > 0 ? (
                          <span className="micro" style={{ display: "inline-flex", alignItems: "center", gap: ".25rem" }}>
                            {rating.toFixed(1)} <MiniStar /> · {j.company.reviewCount} reviews
                          </span>
                        ) : null}
                        {seeRisk && j.company.lastCheckedAt ? (
                          <span className="micro">checked {timeAgo(j.company.lastCheckedAt)}</span>
                        ) : null}
                      </span>
                      {!user ? (
                        <a className="btn btn-g btn-s" href="/login">Sign in to apply</a>
                      ) : user.role === "tradie" ? (
                        applied ? <span className="pill ok">Applied ✓</span> : <ApplyButton jobId={j.id} />
                      ) : isOwner || user.role === "admin" ? (
                        <span className="micro">{j.applications.length} applicants</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {jobRows.length === 0 ? (
              <EmptyState
                icon={<JobsIllustration />}
                headline={filtered ? "No open jobs match" : "No open jobs right now"}
                body="New subcontract packages and day hire land here first — builders post free, tradies apply free."
                cta={
                  filtered ? (
                    <a className="btn btn-p" href="/jobs">Clear filters</a>
                  ) : (
                    <a className="btn btn-p" href="/builder">Post a job as a builder</a>
                  )
                }
              />
            ) : null}

            <p className="hint" style={{ marginTop: "var(--s7)" }}>
              BuildSafe is a noticeboard — you contract directly with the poster. We never set pay or direct work.
              Rates are stated by the posting builder. Payment-risk status is based on public records BuildSafe
              monitors and flags — visible to subscribers, with sources and dates on every signal.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
