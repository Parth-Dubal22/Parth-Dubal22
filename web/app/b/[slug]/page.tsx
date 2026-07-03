import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { formatAbn, fmtDate, initials, ratingX10ToNumber } from "@/lib/format";
import Art from "@/components/Art";
import EmptyState from "@/components/EmptyState";
import SitePhoto from "@/components/SitePhoto";
import Stars from "@/components/Stars";
import { defaultCoverSlot } from "@/lib/photos";
import ProfileNav from "./ProfileNav";
import ProfileActions from "./ProfileActions";
import ReviewForm from "./ReviewForm";

export const dynamic = "force-dynamic";

/* PUBLIC page — defamation guardrail (Master Plan §4): positive/neutral facts
 * only. No risk level, no signals list, no payment-delay aggregates. Licence
 * status, verified tier and reviews (with right of reply) are fine. */

const TIER_LABEL: Record<string, string> = {
  id_verified: "ID Verified",
  buildsafe_verified: "BuildSafe Verified",
  track_record: "Verified + Track Record",
};

const ROLE_LABEL: Record<string, string> = {
  homeowner: "Homeowner",
  subcontractor: "Subcontractor",
  builder: "Builder",
};

/* Neutral avatar palette — deterministic per company, never keyed to risk. */
const AV_COLORS = ["var(--av-1)", "var(--av-2)", "var(--av-3)", "var(--av-4)"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = await db.query.companies.findFirst({
    where: eq(tables.companies.slug, slug),
    columns: { name: true, location: true },
  });
  if (!company) return { title: "Builder profile — BuildSafe" };
  return {
    title: `${company.name} — BuildSafe profile`,
    description: `Verified reviews, licence and registration facts for ${company.name}${
      company.location ? ` (${company.location})` : ""
    }. BuildSafe monitors public records and flags signals.`,
  };
}

export default async function BuilderProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await db.query.companies.findFirst({
    where: eq(tables.companies.slug, slug),
  });
  if (!company) notFound();

  const [viewer, reviews] = await Promise.all([
    currentUser(),
    db.query.reviews.findMany({
      where: and(
        eq(tables.reviews.subjectCompanyId, company.id),
        eq(tables.reviews.status, "published"),
      ),
      with: { author: { columns: { name: true } } },
      orderBy: [desc(tables.reviews.createdAt)],
    }),
  ]);

  const rating = ratingX10ToNumber(company.ratingAvg);
  const subbieCount = reviews.filter((r) => r.authorRole === "subcontractor").length;
  const avColor = AV_COLORS[company.id % AV_COLORS.length];
  const verified = company.tier !== "none";
  const licenceLine = [company.licenceNumber, company.licenceStatus].filter(Boolean).join(" · ");
  const metaLine = [
    `ABN ${formatAbn(company.abn)}`,
    licenceLine,
    ...company.tags,
  ]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase();
  const lastChecked = company.lastCheckedAt ? fmtDate(company.lastCheckedAt) : null;
  const abnHref = `https://abr.business.gov.au/ABN/View?abn=${company.abn}`;
  const licenceSourceName =
    company.licenceSource === "VBA" ? "VBA licence register" : company.licenceSource || "State licence register";

  return (
    <>
      <ProfileNav />

      <div className="pwrap">
        {/* §11.3 profile hero: 21/9 default cover (rotated by company id, SVG art
            fallback until the photo pipeline runs) with the .phead card overlapping.
            display:grid stretches SitePhoto's aspect-ratio figure to fill the
            clamped cover height — promote to `.cover{display:grid}` in app.css. */}
        <div className="cover" style={{ display: "grid" }}>
          <SitePhoto
            slot={defaultCoverSlot(company.id)}
            className="photo"
            priority
            caption={`${company.location ?? company.state ?? "VIC"} · portfolio`}
          />
        </div>
        <div className="phead phead-hero">
          <span className="avatar av-xl" style={{ background: avColor }}>
            {initials(company.name)}
          </span>
          <div className="grow">
            <div className="actions">
              <h2>{company.name}</h2>
              {verified ? (
                <span className="vbadge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {TIER_LABEL[company.tier]}
                </span>
              ) : (
                <span className="pill navy">NOT YET VERIFIED</span>
              )}
            </div>
            <div className="micro" style={{ marginTop: "var(--s1)" }}>
              {metaLine}
            </div>
            <div className="pstats">
              <div>
                <b>
                  {rating != null ? (
                    <>
                      {rating}{" "}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="var(--star)"
                        aria-hidden="true"
                        style={{ verticalAlign: "-.08em" }}
                      >
                        <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
                      </svg>
                    </>
                  ) : (
                    "New"
                  )}
                </b>
                <span>{company.reviewCount} verified reviews</span>
              </div>
              <div>
                <b>{verified ? "Monthly" : "On demand"}</b>
                <span>re-verification</span>
              </div>
              <div>
                <b>{subbieCount}</b>
                <span>subbie reviews</span>
              </div>
            </div>
          </div>
          <div className="list">
            <ProfileActions
              companyId={company.id}
              companyName={company.name}
              viewerRole={viewer?.role ?? null}
            />
            {company.claimedByUserId == null ? (
              <>
                <a className="btn btn-g btn-s" href="/onboarding" aria-label={`Claim the ${company.name} profile`}>
                  Claim this profile
                </a>
                <span className="hint" style={{ textAlign: "center" }}>
                  Run this business? Claiming is free.
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="grid2" style={{ marginTop: "var(--s4)", alignItems: "start" }}>
          <div>
            <h3 style={{ margin: ".6rem 0 .8rem" }}>Public record — with sources</h3>
            <div className="list">
              <div className="item alertcard c">
                <div className="grow">
                  <b>
                    ABN {formatAbn(company.abn)} — registered{company.abnStatus ? ` · ${company.abnStatus}` : ""}
                    {company.entityType ? ` · ${company.entityType}` : ""}
                  </b>
                  <div className="srcline">
                    {lastChecked ?? "ON RECORD"} · Source:{" "}
                    <a href={abnHref} target="_blank" rel="noopener noreferrer">
                      ABN Lookup (Australian Business Register)
                    </a>
                  </div>
                </div>
                <span className="pill navy">FACT</span>
              </div>
              {company.licenceNumber ? (
                <div className="item alertcard c">
                  <div className="grow">
                    <b>
                      Builder licence {company.licenceNumber}
                      {company.licenceStatus ? ` — ${company.licenceStatus}` : ""}
                    </b>
                    <div className="srcline">
                      {lastChecked ?? "ON RECORD"} · Source:{" "}
                      <a href="https://www.vba.vic.gov.au/tools/find-practitioner" target="_blank" rel="noopener noreferrer">
                        {licenceSourceName}
                      </a>
                    </div>
                  </div>
                  <span className="pill navy">FACT</span>
                </div>
              ) : null}
              {verified ? (
                <div className="item alertcard c">
                  <div className="grow">
                    <b>
                      {TIER_LABEL[company.tier]}
                      {company.tierGrantedAt ? ` — granted ${fmtDate(company.tierGrantedAt)}` : ""} · re-checked monthly
                    </b>
                    <div className="srcline">
                      {lastChecked ?? "ON RECORD"} · Source: BuildSafe verification register
                    </div>
                  </div>
                  <span className="pill navy">FACT</span>
                </div>
              ) : null}
            </div>
            {lastChecked ? (
              <p className="micro" style={{ marginTop: "var(--s2)" }}>
                LAST CHECKED {lastChecked}
              </p>
            ) : null}
            <p className="hint" style={{ marginTop: "var(--s1)" }}>
              BuildSafe monitors public records and flags signals. Detailed signal history sits with
              subscribers inside the Tradie &amp; Builder apps — this public page shows registration
              and licence facts only.
            </p>

            <h3 style={{ margin: "1.8rem 0 .8rem" }}>Recent work</h3>
            {/* §11.1 .photo recipe over the Art scenes — company-specific photos arrive in R4;
                the wrapper keeps the 16:10 photo-card look today (tiles are decorative). */}
            <div className="portfolio two">
              {(
                [
                  [company.artKind, `Completed · ${company.location ?? company.state ?? "VIC"}`],
                  ["tile", "Wet areas"],
                  ["frame", "In progress"],
                  ["house", "Handover"],
                ] as const
              ).map(([kind, label]) => (
                <div className="photo" key={label}>
                  <Art kind={kind} label={label} style={{ position: "absolute", inset: 0 }} />
                </div>
              ))}
            </div>

            <details className="card flat" style={{ marginTop: "var(--stack-gap)" }}>
              <summary style={{ cursor: "pointer", fontFamily: "var(--fd)", fontWeight: 600 }}>
                Verification badges — published criteria
              </summary>
              {/* prose bullets, not the icon .criteria list — needs a shared `.card details` recipe (noted in report) */}
              <ul style={{ margin: "var(--s2) 0 0", paddingLeft: "1.1rem", display: "grid", gap: "var(--s2)", fontSize: ".85rem" }}>
                <li>
                  <b>ID Verified</b> — director government ID verified and matched to the ABN.
                </li>
                <li>
                  <b>BuildSafe Verified</b> — ID Verified, plus a current builder licence and current
                  insurance confirmed against the issuing registers.
                </li>
                <li>
                  <b>Verified + Track Record</b> — BuildSafe Verified, plus 12+ months of monitoring
                  history and verified reviews on the platform.
                </li>
              </ul>
              <p className="hint" style={{ marginTop: "var(--s2)", marginBottom: 0 }}>
                Every badge is re-checked monthly and revoked immediately if its criteria stop being met.
              </p>
            </details>
          </div>

          <div>
            <h3 style={{ margin: ".6rem 0 .8rem" }}>
              Reviews <span className="hint">({reviews.length})</span>
            </h3>
            <div className="list">
              {reviews.length === 0 ? (
                <EmptyState
                  icon={
                    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
                      <path
                        d="M36 12l6.5 13.2 14.5 2.1-10.5 10.2 2.5 14.4L36 45.1 23 51.9l2.5-14.4L15 27.3l14.5-2.1z"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M58 12l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7"
                        stroke="var(--orange)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                  headline="No reviews yet — be the first"
                  body="Reviews we can match to a real job on the platform carry a Verified badge."
                />
              ) : (
                reviews.map((r) => {
                  const authorName = r.author?.name ?? "BuildSafe member";
                  return (
                    <div className="review" key={r.id}>
                      <div className="rt">
                        <span className="avatar" style={{ background: "var(--av-1)" }}>
                          {initials(authorName)}
                        </span>
                        <div className="actions" style={{ gap: ".35rem" }}>
                          <b>{authorName}</b>
                          <span className="pill navy">
                            {ROLE_LABEL[r.authorRole] ?? r.authorRole}
                          </span>
                          {r.verified ? (
                            <span className="pill ok">
                              Verified job
                            </span>
                          ) : null}
                        </div>
                        <span style={{ marginLeft: "auto" }}>
                          <Stars rating={r.rating} />
                        </span>
                      </div>
                      <p>&ldquo;{r.text}&rdquo;</p>
                      {r.reply ? (
                        <div className="reply">
                          <b>RESPONSE FROM BUILDER</b>
                          <br />
                          {r.reply}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
            <ReviewForm
              companyId={company.id}
              viewer={viewer ? { name: viewer.name, role: viewer.role } : null}
            />
          </div>
        </div>
        <p className="f-legal" style={{ marginTop: "var(--s7)" }}>
          Public-record signals are facts from published sources (linked). Status ratings are
          BuildSafe&rsquo;s opinion based on those disclosed records. Reviews carry a Verified
          badge where we can match them to a real transaction on the platform; builders may respond
          publicly and may request corrections at any time. Demo page with sample data.
        </p>
      </div>
    </>
  );
}
