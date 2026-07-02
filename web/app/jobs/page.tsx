/** Public live job board — the SEO / social-proof feed (Airtasker pattern).
 *  Noticeboard, not labour hire: builders state the rate, tradies contract
 *  directly with the poster — BuildSafe never sets pay or directs work.
 *
 *  Public visitors see open jobs + positive/neutral poster info only
 *  (company name, verification badge, rating). The builder payment-risk pill
 *  is PRIVATE to subscribers (canSeeRiskDetail) — stripped server-side so it
 *  never reaches a non-subscriber's browser. Applying is ALWAYS free.
 */
import { and, desc, eq, ilike } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { canSeeRiskDetail } from "@/lib/access";
import { ALL_TRADES, ST, ratingX10ToNumber, timeAgo } from "@/lib/format";
import LandingNav from "@/components/landing/LandingNav";
import ApplyButton from "./ApplyButton";

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

export default async function JobsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const typeF = one(sp.type); // "" | "day" | "sub"
  const tradeF = one(sp.trade);
  const locF = one(sp.loc).trim().slice(0, 160);

  const user = await currentUser();
  const seeRisk = await canSeeRiskDetail(user);

  const conds = [eq(tables.jobs.status, "open")];
  if (typeF === "day") conds.push(eq(tables.jobs.type, "day_hire"));
  if (typeF === "sub") conds.push(eq(tables.jobs.type, "subcontract"));
  if (tradeF) conds.push(eq(tables.jobs.trade, tradeF));
  if (locF) conds.push(ilike(tables.jobs.location, `%${locF.replace(/[%_\\]/g, "\\$&")}%`));

  const jobRows = await db.query.jobs.findMany({
    where: and(...conds),
    with: {
      company: true,
      applications: { columns: { tradieUserId: true } },
    },
    orderBy: [desc(tables.jobs.createdAt), desc(tables.jobs.id)],
  });

  // Chip links preserve the other filters (server-rendered — crawlable).
  const chipHref = (t: "" | "day" | "sub") => {
    const q = new URLSearchParams();
    if (t) q.set("type", t);
    if (tradeF) q.set("trade", tradeF);
    if (locF) q.set("loc", locF);
    const s = q.toString();
    return s ? `/jobs?${s}` : "/jobs";
  };

  return (
    <>
      <LandingNav />
      <main className="wrap" style={{ padding: "2.6rem 0 3.5rem" }}>
        <span className="eyebrow">Live job board · Victoria</span>
        <div className="topbar" style={{ marginTop: "1rem" }}>
          <h2>Open jobs from verified-checked builders</h2>
          <span className="pill ok">ZERO LEAD FEES</span>
        </div>

        <div className="filters">
          <a className={`chip${typeF === "" ? " on" : ""}`} href={chipHref("")} aria-current={typeF === "" ? "true" : undefined}>All</a>
          <a className={`chip${typeF === "day" ? " on" : ""}`} href={chipHref("day")} aria-current={typeF === "day" ? "true" : undefined}>Day hire</a>
          <a className={`chip${typeF === "sub" ? " on" : ""}`} href={chipHref("sub")} aria-current={typeF === "sub" ? "true" : undefined}>Subcontract</a>
          <span style={{ marginLeft: "auto" }} className="hint">Subscribers see builder pay-status on every job — applying is always free.</span>
        </div>

        <form method="get" action="/jobs" className="filters" aria-label="Filter jobs">
          {typeF ? <input type="hidden" name="type" value={typeF} /> : null}
          <label className="hint" style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            Trade
            <select name="trade" defaultValue={tradeF} aria-label="Filter by trade"
              style={{ border: "1.5px solid var(--line)", borderRadius: "9px", padding: ".45rem .6rem", font: "inherit", fontSize: ".82rem", background: "#fff" }}>
              <option value="">All trades</option>
              {ALL_TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="hint" style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            Location
            <input type="text" name="loc" defaultValue={locF} placeholder="Suburb or region" aria-label="Filter by location"
              style={{ border: "1.5px solid var(--line)", borderRadius: "9px", padding: ".45rem .6rem", font: "inherit", fontSize: ".82rem" }} />
          </label>
          <button className="btn btn-g btn-s" type="submit">Filter</button>
        </form>

        <div className="grid2">
          {jobRows.map((j, i) => {
            const st = ST[seeRisk ? j.company.riskLevel : "ok"];
            const rating = ratingX10ToNumber(j.company.ratingAvg);
            const applied = !!user && j.applications.some((a) => a.tradieUserId === user.id);
            const isOwner = !!user && j.builderUserId === user.id;
            return (
              <div className={`jobcard rv${i % 3 === 1 ? " d1" : i % 3 === 2 ? " d2" : ""}`} key={j.id}>
                <div className="top">
                  <div>
                    <h4>{j.title}</h4>
                    <div className="meta">
                      <span>{j.location}</span>
                      <span>Starts {j.startText}</span>
                      <span>{j.duration}</span>
                      {j.requirement ? <span>{j.requirement}</span> : null}
                      {j.trade ? <span>{j.trade}</span> : null}
                    </div>
                  </div>
                  <span className="rate">{j.rate}</span>
                </div>
                <div className="paycheck">
                  <span style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".84rem", flexWrap: "wrap" }}>
                    {seeRisk ? <span className={`pill ${st[1]}`}>Builder: {st[0]}</span> : null}
                    <b style={{ fontSize: ".84rem" }}>{j.company.name}</b>
                    {j.company.tier !== "none" ? (
                      <span className="vbadge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                        Verified
                      </span>
                    ) : null}
                    {rating != null && j.company.reviewCount > 0 ? (
                      <span className="mono" style={{ fontSize: ".66rem", color: "var(--slate2)" }}>
                        {rating.toFixed(1)} ★ · {j.company.reviewCount} reviews
                      </span>
                    ) : null}
                    {seeRisk && j.company.lastCheckedAt ? (
                      <span className="mono" style={{ fontSize: ".62rem", color: "var(--slate2)" }}>
                        checked {timeAgo(j.company.lastCheckedAt)}
                      </span>
                    ) : null}
                  </span>
                  {!user ? (
                    <a className="btn btn-g btn-s" href="/login">Sign in to see payment-risk status &amp; apply</a>
                  ) : user.role === "tradie" ? (
                    applied ? <span className="pill ok">Applied ✓</span> : <ApplyButton jobId={j.id} />
                  ) : isOwner || user.role === "admin" ? (
                    <span className="mono" style={{ fontSize: ".66rem", color: "var(--slate2)" }}>{j.applications.length} applicants</span>
                  ) : null}
                </div>
              </div>
            );
          })}
          {jobRows.length === 0 ? (
            <div className="card" style={{ padding: "1.6rem" }}>
              <b>No open jobs match</b>
              <p className="hint" style={{ marginTop: ".4rem" }}>
                Try another filter — new packages and day hire land here first.
              </p>
            </div>
          ) : null}
        </div>

        <p className="hint" style={{ marginTop: "2rem" }}>
          BuildSafe is a noticeboard — you contract directly with the poster. We never set pay or direct work.
          Rates are stated by the posting builder. Payment-risk status is based on public records BuildSafe
          monitors and flags — visible to subscribers, with sources and dates on every signal.
        </p>
      </main>
    </>
  );
}
