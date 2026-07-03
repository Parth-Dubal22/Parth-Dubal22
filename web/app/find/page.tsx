/** PUBLIC /find — the category directory hub (SPEC_V2_CATEGORIES §3-4).
 *  - Popular Categories: the 26 licensed-photo tiles, each with a pros-per-
 *    category count pill (companies via company_categories + tradie profiles
 *    via categorySlugs).
 *  - More categories A-Z: the full top-level index, 2-col mobile / 4-col
 *    desktop, anchored letter groups with jump links (topLevelAtoZ()).
 *  SEO: generateMetadata + JSON-LD ItemList of the popular categories.
 *  Legal: this is a public discovery surface — only category names + pro COUNTS
 *  here, never any risk detail. */
import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import CategoryGrid from "@/components/CategoryGrid";
import { popularTiles } from "@/lib/find";
import { topLevelAtoZ, POPULAR } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: "Find a builder or tradie by trade — BuildSafe",
    description:
      "Browse builders and tradies across 200+ trade categories in Victoria. Every pro is checked against public records — read two-way reviews and hire with confidence. Start with a free deposit-safety check.",
    alternates: { canonical: "/find" },
    openGraph: {
      title: "Find a builder or tradie by trade — BuildSafe",
      description:
        "Browse builders and tradies across 200+ trade categories in Victoria, each checked against public records.",
      url: "/find",
      type: "website",
    },
  };
}

export default async function FindPage() {
  const tiles = await popularTiles(true);
  const atoz = topLevelAtoZ();
  const letters = [...atoz.keys()];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Popular trade categories on BuildSafe",
    itemListElement: POPULAR.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.label,
      url: `/find/${p.slug}`,
    })),
  };

  return (
    <>
      <LandingNav />
      <main>
        <section>
          <div className="wrap">
            <span className="eyebrow">Find a pro · Victoria</span>
            <div className="topbar" style={{ marginTop: "var(--s4)" }}>
              <h1>What do you need done?</h1>
              <Link className="btn btn-g btn-s" href="/check">
                Or check a builder by ABN →
              </Link>
            </div>
            <p className="sub" style={{ maxWidth: "60ch" }}>
              Pick a category to see builders and tradies near you — each one checked against
              public records, with two-way reviews you can trust.
            </p>

            <h2 style={{ margin: "var(--s6) 0 var(--s4)" }}>Popular categories</h2>
            <CategoryGrid tiles={tiles} hrefBase="/find" countLabel="pros" />

            <h2 id="a-z" style={{ margin: "var(--s8) 0 0" }}>
              More categories A–Z
            </h2>
            <p className="hint">Jump to a letter, or browse the full list of trades we cover.</p>
            <nav className="az-jump" aria-label="Jump to letter">
              {letters.map((l) => (
                <a key={l} href={`#letter-${l}`}>
                  {l}
                </a>
              ))}
            </nav>

            <div className="az-index">
              {letters.map((l) => (
                <section key={l} className="az-group" id={`letter-${l}`}>
                  <h3>{l}</h3>
                  <div className="az-cols">
                    {atoz.get(l)!.map((c) => (
                      <Link key={c.slug} href={`/find/${c.slug}`}>
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <p className="f-legal">
            © 2026 BuildSafe · Built in Melbourne. Demo preview with sample data. BuildSafe
            provides information drawn from public records for general business purposes — not
            legal, financial or credit advice, and not a consumer credit report.
          </p>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  );
}
