import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import Art from "@/components/Art";
import LandingNav from "@/components/landing/LandingNav";
import ExposureCalculator from "@/components/landing/ExposureCalculator";

export const dynamic = "force-dynamic";

export default async function Landing() {
  // Resolve the sample profile link from the DB (prototype: profile.html?b=rh).
  const featured =
    (await db.query.companies.findFirst({
      where: eq(tables.companies.slug, "redgum-homes-aus"),
    })) ?? (await db.query.companies.findFirst());
  const profileHref = featured ? `/b/${featured.slug}` : "/customer";

  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero">
        <div className="wrap">
          <div>
            <span className="eyebrow" style={{ background: "rgba(255,90,31,.15)" }}>
              One platform · Two apps · Every side protected
            </span>
            <h1 style={{ marginTop: "1.3rem" }}>
              The build platform where <em>everyone gets paid.</em>
            </h1>
            <p className="sub">
              Like Uber has a rider app and a driver app — BuildSafe has one side for customers
              hiring with confidence, and one side for tradies &amp; builders who get monitored, get
              work, and get paid. All powered by the same financial risk engine.
            </p>
            <form className="search" action="/check" method="get">
              <input
                type="text"
                name="q"
                placeholder="Check a builder — name or ABN…"
                aria-label="Builder name or ABN"
              />
              <button className="btn btn-p btn-lg" type="submit">
                Check free
              </button>
            </form>
            <div className="hero-apps">
              <a className="btn btn-g" href="/customer" style={{ background: "rgba(255,255,255,.95)" }}>
                Open Customer app →
              </a>
              <a className="btn btn-g" href="/tradie" style={{ background: "rgba(255,255,255,.95)" }}>
                Open Tradie app →
              </a>
              <a className="btn btn-g" href="/builder" style={{ background: "rgba(255,255,255,.95)" }}>
                Open Builder app →
              </a>
            </div>
            <div className="hero-stats">
              <div className="hstat">
                <b>2,970</b>
                <span>builder insolvencies last FY</span>
              </div>
              <div className="hstat">
                <b>$42k</b>
                <span>avg. subbie loss per collapse</span>
              </div>
              <div className="hstat">
                <b>10 sec</b>
                <span>to check any builder, free</span>
              </div>
            </div>
          </div>

          {/* two phones: customer + pro */}
          <div className="duo" aria-hidden="true">
            <div className="phone">
              <div className="scr">
                <div className="p-head">
                  <div className="who">
                    <span className="avatar" style={{ background: "#2E5E8F" }}>C</span>
                    <b>Customer</b>
                  </div>
                  <span className="p-tag">HIRE SAFE</span>
                </div>
                <div className="p-body">
                  <div className="mcard">
                    <b>Find a verified builder</b>
                    <span>TOWNHOUSE · OFFICER VIC</span>
                  </div>
                  <div className="mcard">
                    <div className="mrow">
                      <div>
                        <b>Redgum Homes (Aus)</b>
                        <span>★ 4.8 · 63 reviews</span>
                      </div>
                      <span className="vbadge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Verified
                      </span>
                    </div>
                  </div>
                  <div className="mcard">
                    <div className="mrow">
                      <div>
                        <b>Southpoint Projects</b>
                        <span>★ 4.7 · 41 reviews</span>
                      </div>
                      <span className="vbadge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Verified
                      </span>
                    </div>
                  </div>
                  <div className="mcard" style={{ borderLeft: "4px solid var(--clear)" }}>
                    <b>Deposit safety check ✓</b>
                    <span>SAFE TO PROCEED · SOURCES ATTACHED</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="phone">
              <div className="scr">
                <div className="p-head">
                  <div className="who">
                    <span className="avatar" style={{ background: "var(--orange)" }}>P</span>
                    <b>Tradie / Builder</b>
                  </div>
                  <span className="p-tag">GET PAID</span>
                </div>
                <div className="p-body">
                  <div className="mcard" style={{ borderLeft: "4px solid var(--risk)" }}>
                    <b>Alert · a builder on your watchlist</b>
                    <span>COURT FILING · $42,300 EXPOSED · SOURCE →</span>
                  </div>
                  <div className="mcard">
                    <div className="mrow">
                      <div>
                        <b>Tiler — bathroom reno ×3</b>
                        <span>CRANBOURNE · STARTS MON · BUILDER: CLEAR</span>
                      </div>
                      <span className="rate" style={{ fontSize: ".8rem" }}>$620/day</span>
                    </div>
                  </div>
                  <div className="mcard">
                    <div className="mrow">
                      <b>Available now</b>
                      <span className="pill ok">ON</span>
                    </div>
                    <span>BUILDERS NEARBY CAN BOOK YOUR DAY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* construction skyline scene */}
        <div className="scene">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <rect width="1440" height="320" fill="transparent" />
            <g fill="#081524">
              <rect x="0" y="180" width="180" height="140" />
              <rect x="200" y="120" width="120" height="200" />
              <rect x="360" y="200" width="220" height="120" />
              <rect x="620" y="90" width="140" height="230" />
              <rect x="800" y="160" width="180" height="160" />
              <rect x="1020" y="110" width="120" height="210" />
              <rect x="1180" y="190" width="260" height="130" />
            </g>
            <g stroke="#FF5A1F" strokeWidth="6">
              <path d="M700 320V60h8v260M704 60l190-34M894 26v26M704 60l-90 18M820 42v20" />
            </g>
            <g fill="#FFC773" opacity=".9">
              <rect x="230" y="150" width="14" height="10" />
              <rect x="260" y="150" width="14" height="10" />
              <rect x="230" y="180" width="14" height="10" />
              <rect x="650" y="120" width="14" height="10" />
              <rect x="680" y="120" width="14" height="10" />
              <rect x="650" y="150" width="14" height="10" />
              <rect x="1050" y="140" width="14" height="10" />
              <rect x="1080" y="170" width="14" height="10" />
            </g>
          </svg>
        </div>
      </section>

      {/* UBER-STYLE TWO APPS */}
      <section className="twoapps">
        <div className="wrap">
          <div className="sec-head rv">
            <span className="eyebrow">How the platform works</span>
            <h2>Two apps. One risk engine underneath.</h2>
            <p className="sub">
              Every side of a build joins with their own profile — and the same engine protects
              them all.
            </p>
          </div>
          <div className="grid2">
            <div className="appcard cust rv">
              <span className="ic" style={{ background: "var(--cloud)", color: "var(--navy)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 10.5L12 4l9 6.5" />
                  <path d="M5 10v10h14V10" />
                  <rect x="10" y="14" width="4" height="6" />
                </svg>
              </span>
              <h3>Customer app — hire with proof</h3>
              <ul>
                <li>Search a directory where every builder&rsquo;s financial standing is checked, not guessed</li>
                <li>
                  Read verified reviews from homeowners <b>and</b> the subbies they pay
                </li>
                <li>Run a free deposit-safety check before handing over five figures</li>
                <li>Request quotes from Verified builders in two taps</li>
              </ul>
              <a className="btn btn-d" href="/customer">
                Open the Customer app →
              </a>
            </div>
            <div className="appcard pro rv d1">
              <span className="ic" style={{ background: "var(--osoft)", color: "var(--orange)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14.7 6.3a4.5 4.5 0 00-6.4 6.4L3 18v3h3l5.3-5.3a4.5 4.5 0 006.4-6.4L14 13l-3-3z" />
                </svg>
              </span>
              <h3>Tradie &amp; Builder app — work, watch, get paid</h3>
              <ul>
                <li>Build a profile: trades, licence, insurance, portfolio, reviews</li>
                <li>Watch the companies you&rsquo;re exposed to — alerts the moment records change</li>
                <li>Job board: builders post day-hire &amp; subcontracts; tradies apply free</li>
                <li>Flip &ldquo;Available now&rdquo; and pick up a paid day when a site rains off</li>
              </ul>
              <a className="btn btn-p" href="/tradie">
                Open the Pro app →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE FROM THE PLATFORM */}
      <section>
        <div className="wrap">
          <div className="sec-head rv">
            <span className="eyebrow">Live from the platform</span>
            <h2>Real screens, working right now</h2>
            <p className="sub">
              Everything below is clickable in the apps — profiles, reviews, job posting, alerts.
            </p>
          </div>
          <div className="grid3">
            <div className="card rv">
              <span className="ic" style={{ background: "var(--rsoft)", color: "var(--risk)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 01-3.4 0" />
                </svg>
              </span>
              <h3>Watchlists &amp; alerts</h3>
              <p>
                Court filings, ASIC notices, licence changes — pushed to your phone with the source
                attached.
              </p>
              <a className="btn btn-g btn-s" href="/tradie" style={{ marginTop: "1rem" }}>
                See it in the Tradie app
              </a>
            </div>
            <div className="card rv d1">
              <span className="ic" style={{ background: "var(--wsoft)", color: "var(--watch)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </span>
              <h3>Job board (both directions)</h3>
              <p>
                Builders post work and see applicants&rsquo; verified credentials. Tradies see the
                builder&rsquo;s pay-status before applying.
              </p>
              <a className="btn btn-g btn-s" href="/builder" style={{ marginTop: "1rem" }}>
                Post a job as a builder
              </a>
            </div>
            <div className="card rv d2">
              <span className="ic" style={{ background: "var(--csoft)", color: "var(--clear)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <h3>Profiles, badges &amp; reviews</h3>
              <p>
                Verified profiles with portfolios, two-way reviews (yes — tradies rate builders
                too), and badges that mean something.
              </p>
              <a className="btn btn-g btn-s" href={profileHref} style={{ marginTop: "1rem" }}>
                View a builder profile
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section style={{ background: "var(--navy)", color: "#fff" }}>
        <div className="wrap split">
          <div className="rv">
            <span className="eyebrow" style={{ background: "rgba(255,90,31,.15)" }}>
              Why now
            </span>
            <h2 style={{ color: "#fff", marginTop: "1rem" }}>
              Nearly 3,000 builders collapsed last year. The warnings were public.
            </h2>
            <p className="sub" style={{ color: "#9DB0CC", marginTop: "1rem" }}>
              Court lists, ASIC notices, licence registers — the signals sit in plain sight,
              scattered where nobody looks. We fuse them per-ABN and put them on your phone.
            </p>
            <ul className="checks" style={{ color: "#DDE7F3" }}>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="#33C088" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Every alert cites its public source — verify in one tap
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="#33C088" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Facts and opinion clearly separated; corrections within 48h
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="#33C088" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                No lead fees, no lock-ins, no expiring credits — ever
              </li>
            </ul>
          </div>
          <div className="rv d1">
            <div className="grid2">
              <Art kind="crane" label="Melbourne SE · dusk pour" />
              <Art kind="frame" label="Timber frame · Werribee" />
              <Art kind="house" label="Handover day · Officer" />
              <Art kind="tile" label="Wet-area tiling · Clyde Nth" />
            </div>
          </div>
        </div>
      </section>

      {/* EXPOSURE CALCULATOR */}
      <section>
        <div className="wrap">
          <div className="sec-head rv">
            <span className="eyebrow">Exposure calculator</span>
            <h2>How exposed are you right now?</h2>
            <p className="sub">
              A quick sum, not a prediction: what you&rsquo;re owed across the builders you work
              under. Then check each of them free.
            </p>
          </div>
          <ExposureCalculator />
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="wrap">
          <div
            className="appcard rv"
            style={{
              textAlign: "center",
              padding: "3.5rem 2rem",
              background: "linear-gradient(160deg,#0F2440,#0A1B2E)",
              color: "#fff",
              border: "none",
            }}
          >
            <h2 style={{ color: "#fff" }}>Pick your side. Same engine protects you.</h2>
            <p className="sub" style={{ color: "#9DB0CC", maxWidth: "52ch", margin: "1rem auto 1.8rem" }}>
              Create a profile in under two minutes — customer, tradie, or builder. Founding
              members lock launch pricing for life.
            </p>
            <div style={{ display: "flex", gap: ".8rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a className="btn btn-p btn-lg" href="/onboarding">
                Create your profile →
              </a>
              <a className="btn btn-g btn-lg" href="/customer" style={{ background: "#fff" }}>
                Just check a builder
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <p className="f-legal">
            © 2026 BuildSafe · Built in Melbourne. Demo preview with sample data. BuildSafe
            provides information drawn from public records for general business purposes — not
            legal, financial or credit advice, and not a consumer credit report. Signals are
            sourced facts; status ratings are our opinion based on those disclosed records.
            Builders may request corrections at any time.
          </p>
        </div>
      </footer>
    </>
  );
}
