/** PUBLIC /find/[category] — a top-level category page (SPEC_V2_CATEGORIES §3-4).
 *  Layout: hero photo + our own one-line description · subcategory chip filters
 *  (?sub=) · COMPANIES in the category (bcard, positive/neutral only, ordered by
 *  the 4 R's — lib/rank) · a "Tradies in this category" secondary list · a
 *  matching open-jobs teaser (pro side) · a related cost-guide placeholder.
 *  SEO: generateMetadata + JSON-LD ItemList. Unknown slug → notFound().
 *
 *  Legal split (Master Plan §4): public surface = positive/neutral facts only.
 *  Verified tier, rating, review volume, licence and suburb are fine; riskLevel,
 *  signals and exposure never reach this page (lib/find never selects them). */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, and } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import LandingNav from "@/components/landing/LandingNav";
import SitePhoto from "@/components/SitePhoto";
import Art from "@/components/Art";
import Stars from "@/components/Stars";
import { slotForCategory } from "@/lib/photos";
import { categoryDescription } from "@/lib/data/category-descriptions";
import { subcategoriesOf } from "@/lib/data/categories";
import { companiesInCategory, tradiesInCategory, topLevel } from "@/lib/find";

export const dynamic = "force-dynamic";

const MATCH_CHIP: Record<string, string | null> = {
  primary: null, // headline trade — no extra chip needed
  secondary: "Also does",
  synonym: null,
  none: null,
};

type Params = Promise<{ category: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await params;
  const cat = topLevel(category);
  if (!cat) return { title: "Category not found — BuildSafe" };
  const desc =
    categoryDescription(cat.slug) ??
    `Find ${cat.name.toLowerCase()} in Victoria — checked against public records, with two-way reviews.`;
  return {
    title: `${cat.name} in Victoria — find a checked pro · BuildSafe`,
    description: desc,
    alternates: { canonical: `/find/${cat.slug}` },
    openGraph: {
      title: `${cat.name} in Victoria — BuildSafe`,
      description: desc,
      url: `/find/${cat.slug}`,
      type: "website",
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { category } = await params;
  const cat = topLevel(category);
  if (!cat) notFound();

  const sp = await searchParams;
  const sub = one(sp.sub);

  const [companies, tradies, jobRows] = await Promise.all([
    companiesInCategory(cat.slug),
    tradiesInCategory(cat.slug),
    db.query.jobs.findMany({
      where: and(eq(tables.jobs.status, "open"), eq(tables.jobs.categorySlug, cat.slug)),
      with: { company: true },
      orderBy: [desc(tables.jobs.createdAt)],
      limit: 3,
    }),
  ]);

  const subs = subcategoriesOf(cat.slug);
  const slot = slotForCategory(cat.slug);
  const description = categoryDescription(cat.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${cat.name} on BuildSafe`,
    itemListElement: companies.slice(0, 20).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      url: `/b/${c.slug}`,
    })),
  };

  return (
    <>
      <LandingNav />
      <main>
        <section>
          <div className="wrap">
            <p className="hint" style={{ marginBottom: "var(--s3)" }}>
              <Link href="/find">← All categories</Link>
            </p>

            {/* hero */}
            <div className="cover" style={{ marginBottom: "var(--s5)" }}>
              {slot ? (
                <SitePhoto slot={slot} priority caption={cat.name} showAttribution={false} />
              ) : (
                <Art kind="house" label={cat.name} style={{ position: "absolute", inset: 0 }} />
              )}
            </div>

            <span className="eyebrow">Category · Victoria</span>
            <h1>{cat.name}</h1>
            {description ? (
              <p className="sub" style={{ maxWidth: "62ch" }}>
                {description}
              </p>
            ) : null}

            {/* subcategory chip filters */}
            {subs.length > 0 ? (
              <div className="filters" style={{ marginTop: "var(--s4)" }} aria-label="Refine by type">
                <Link
                  className={"chip" + (!sub ? " on" : "")}
                  href={`/find/${cat.slug}`}
                  aria-current={!sub ? "true" : undefined}
                >
                  All {cat.name.toLowerCase()}
                </Link>
                {subs.map((s) => (
                  <Link
                    key={s.slug}
                    className={"chip" + (sub === s.slug ? " on" : "")}
                    href={`/find/${cat.slug}?sub=${s.slug}`}
                    aria-current={sub === s.slug ? "true" : undefined}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            ) : null}

            {/* companies */}
            <h2 style={{ margin: "var(--s7) 0 var(--s4)" }}>
              Builders &amp; companies{companies.length ? ` (${companies.length})` : ""}
            </h2>
            {companies.length === 0 ? (
              <p className="note info">
                No verified companies listed under {cat.name.toLowerCase()} yet — try the{" "}
                <Link href="/find">popular categories</Link> or run a free{" "}
                <Link href="/check">builder check</Link>.
              </p>
            ) : (
              <div className="grid3">
                {companies.map((c) => (
                  <div className="bcard rv" key={c.id}>
                    <div className="photo" style={{ aspectRatio: "16 / 8", borderRadius: 0 }} aria-hidden="true">
                      <Art kind={c.artKind} label={c.location} style={{ position: "absolute", inset: 0 }} />
                    </div>
                    <div className="bod">
                      <div className="nm">
                        <div>
                          <h4>{c.name}</h4>
                          <div className="loc">
                            {[c.licence, c.location].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        {c.verified ? (
                          <span className="vbadge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="pill navy">MONITORED</span>
                        )}
                      </div>
                      <div className="rw">
                        {c.rating != null ? (
                          <>
                            <Stars rating={c.rating} /> <b>{c.rating}</b> · {c.reviewCount} reviews
                          </>
                        ) : (
                          <>No reviews yet</>
                        )}
                      </div>
                      {c.match === "secondary" && MATCH_CHIP.secondary ? (
                        <div className="micro" style={{ marginTop: ".3rem" }}>
                          {MATCH_CHIP.secondary} {cat.name.toLowerCase()}
                        </div>
                      ) : null}
                      <div className="cta">
                        <Link className="btn btn-d btn-s" href={`/b/${c.slug}`}>
                          View profile
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* tradies secondary list */}
            {tradies.length > 0 ? (
              <>
                <h2 style={{ margin: "var(--s7) 0 var(--s3)" }}>
                  Tradies in {cat.name.toLowerCase()}
                </h2>
                <div className="card">
                  {tradies.map((t) => (
                    <div className="tradie-row" key={t.userId}>
                      <div className="grow">
                        <div className="t-name">
                          {t.businessName || t.name}
                          {t.availableNow ? (
                            <span className="pill ok" style={{ marginLeft: ".5rem" }}>
                              AVAILABLE NOW
                            </span>
                          ) : null}
                        </div>
                        <div className="t-sub">
                          {[
                            t.suburb,
                            t.reliability != null ? `${t.reliability}% reliability` : null,
                            t.verified ? "ID Verified" : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="hint">
                  Tradie profiles show licence, insurance and reliability — verified where we can
                  confirm it against public registers.
                </p>
              </>
            ) : null}

            {/* matching open jobs teaser */}
            {jobRows.length > 0 ? (
              <>
                <h2 style={{ margin: "var(--s7) 0 var(--s3)" }}>Open {cat.name.toLowerCase()} jobs</h2>
                <div className="grid2">
                  {jobRows.map((j) => (
                    <div className="jobcard" key={j.id}>
                      <div className="top">
                        <div>
                          <h4>{j.title}</h4>
                          <div className="meta">
                            <span>{j.location}</span>
                            <span>Starts {j.startText}</span>
                            <span>{j.duration}</span>
                          </div>
                        </div>
                        <span className="rate">{j.rate}</span>
                      </div>
                      <div className="paycheck">
                        <span className="who">
                          <b>{j.company.name}</b>
                        </span>
                        <Link className="btn btn-g btn-s" href="/jobs">
                          View on job board
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="hint">
                  <Link href={`/jobs?category=${cat.slug}`}>See all {cat.name.toLowerCase()} jobs →</Link>{" "}
                  Zero lead fees — tradies apply free.
                </p>
              </>
            ) : null}

            {/* related cost-guide placeholder */}
            <div className="note" style={{ marginTop: "var(--s7)" }}>
              <b>{cat.name} cost guide</b> — coming soon. We&apos;re writing plain-English price
              ranges for {cat.name.toLowerCase()} in Victoria.
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <p className="f-legal">
            © 2026 BuildSafe · Built in Melbourne. Demo preview with sample data. Positive and
            neutral public-record facts only shown here — risk detail is private to subscribers.
          </p>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
