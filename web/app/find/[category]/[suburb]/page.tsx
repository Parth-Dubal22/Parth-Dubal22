/** PUBLIC /find/[category]/[suburb] — location landing pages, generated for the
 *  POPULAR-26 categories × the launch suburbs ONLY (SPEC_V2_CATEGORIES §4). Every
 *  other combination 404s — this is the thin-page-spam guard: no doorway-page
 *  farm, just the suburbs where BuildSafe actually launches (Melbourne SE/W).
 *
 *  Same layout as the category page, filtered to the suburb. Legal split holds:
 *  positive/neutral facts only (lib/find never selects risk). */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LandingNav from "@/components/landing/LandingNav";
import SitePhoto from "@/components/SitePhoto";
import Art from "@/components/Art";
import Stars from "@/components/Stars";
import { slotForCategory } from "@/lib/photos";
import { categoryDescription } from "@/lib/data/category-descriptions";
import { POPULAR, isPopularCategory, popularLabel } from "@/lib/data/categories";
import { LAUNCH_SUBURBS, findLaunchSuburb } from "@/lib/data/launch-suburbs";
import { companiesInCategory, tradiesInCategory, topLevel } from "@/lib/find";

export const dynamic = "force-dynamic";

type Params = Promise<{ category: string; suburb: string }>;

/** Popular categories × launch suburbs — the only combinations that exist. */
export function generateStaticParams() {
  const out: { category: string; suburb: string }[] = [];
  for (const p of POPULAR) {
    for (const s of LAUNCH_SUBURBS) out.push({ category: p.slug, suburb: s.slug });
  }
  return out;
}

const inSuburb = (location: string | undefined | null, suburbName: string) =>
  (location ?? "").toLowerCase().includes(suburbName.toLowerCase());

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, suburb } = await params;
  const cat = topLevel(category);
  const sub = findLaunchSuburb(suburb);
  if (!cat || !sub || !isPopularCategory(category)) return { title: "Not found — BuildSafe" };
  const title = `${popularLabel(cat.slug)} in ${sub.name} — checked pros · BuildSafe`;
  const description = `Find ${cat.name.toLowerCase()} in ${sub.name}, Victoria — each checked against public records, with two-way reviews.`;
  return {
    title,
    description,
    alternates: { canonical: `/find/${cat.slug}/${sub.slug}` },
    openGraph: { title, description, url: `/find/${cat.slug}/${sub.slug}`, type: "website" },
  };
}

export default async function CategorySuburbPage({ params }: { params: Params }) {
  const { category, suburb } = await params;
  const cat = topLevel(category);
  const sub = findLaunchSuburb(suburb);
  // Guard: only popular category × launch suburb combinations exist.
  if (!cat || !sub || !isPopularCategory(category)) notFound();

  const [allCompanies, allTradies] = await Promise.all([
    companiesInCategory(cat.slug),
    tradiesInCategory(cat.slug),
  ]);
  const companies = allCompanies.filter((c) => inSuburb(c.location, sub.name));
  const tradies = allTradies.filter((t) => inSuburb(t.suburb, sub.name));

  const slot = slotForCategory(cat.slug);
  const description = categoryDescription(cat.slug);
  const label = popularLabel(cat.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${label} in ${sub.name}`,
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
              <Link href={`/find/${cat.slug}`}>← All {label.toLowerCase()}</Link> ·{" "}
              <Link href="/find">All categories</Link>
            </p>

            <div className="cover" style={{ marginBottom: "var(--s5)" }}>
              {slot ? (
                <SitePhoto slot={slot} priority caption={`${label} · ${sub.name}`} showAttribution={false} />
              ) : (
                <Art kind="house" label={label} style={{ position: "absolute", inset: 0 }} />
              )}
            </div>

            <span className="eyebrow">{sub.name} · Victoria</span>
            <h1>
              {label} in {sub.name}
            </h1>
            {description ? (
              <p className="sub" style={{ maxWidth: "62ch" }}>
                {description}
              </p>
            ) : null}

            <h2 style={{ margin: "var(--s7) 0 var(--s4)" }}>
              Builders &amp; companies in {sub.name}
              {companies.length ? ` (${companies.length})` : ""}
            </h2>
            {companies.length === 0 ? (
              <p className="note info">
                No {label.toLowerCase()} companies listed in {sub.name} yet — see all{" "}
                <Link href={`/find/${cat.slug}`}>{label.toLowerCase()} across Victoria</Link>, or
                run a free <Link href="/check">builder check</Link>.
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
                          <div className="loc">{[c.licence, c.location].filter(Boolean).join(" · ")}</div>
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

            {tradies.length > 0 ? (
              <>
                <h2 style={{ margin: "var(--s7) 0 var(--s3)" }}>
                  Tradies in {sub.name}
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
              </>
            ) : null}

            <div className="note" style={{ marginTop: "var(--s7)" }}>
              <b>
                {label} costs in {sub.name}
              </b>{" "}
              — cost guide coming soon.
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
