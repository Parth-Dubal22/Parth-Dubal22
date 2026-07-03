/**
 * SPEC_V2 R5 — server-only data layer for the category directory (/find, the
 * customer "what do you need done?" grid, and the /jobs category filter).
 *
 * SERVER-ONLY: imports the DB and lib/photos (filesystem). Never import from a
 * "use client" module — call these in a server component and pass the plain,
 * serializable results (TileData / FindCompany / FindTradie) down as props.
 *
 * Legal split (Master Plan §4): every pro shape here carries positive/neutral
 * facts only — verified tier, rating, review volume, licence, suburb. riskLevel
 * / signals / exposure are NEVER selected into these shapes, so they can't leak
 * onto the public directory. Ordering uses lib/rank.ts (the 4 R's) — an explain-
 * able ordering of disclosed positive facts, never risk.
 */
import { sql } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import {
  POPULAR,
  findCategory,
  subcategoriesOf,
  type Category,
} from "@/lib/data/categories";
import { tilePhotoForCategory, type TilePhoto, type ArtKind } from "@/lib/photos";
import { byFourRs, type CategoryMatch } from "@/lib/rank";
import { formatAbn, hasVerifiedBadge, ratingX10ToNumber } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Serializable shapes (client-safe once passed as props)             */
/* ------------------------------------------------------------------ */

export type TileData = {
  slug: string;
  label: string;
  photo: TilePhoto | null;
  art: ArtKind;
  /** Count pill (pros / open jobs). Omitted → no pill. */
  count?: number;
};

export type FindCompany = {
  id: number;
  name: string;
  slug: string;
  abn: string; // formatted
  licence: string;
  location: string;
  artKind: string;
  verified: boolean;
  rating: number | null;
  reviewCount: number;
  /** How the company matched the viewed category — drives 4R ordering + a chip. */
  match: CategoryMatch;
};

export type FindTradie = {
  userId: number;
  name: string;
  businessName: string | null;
  suburb: string;
  reliability: number | null;
  verified: boolean;
  availableNow: boolean;
};

/* ------------------------------------------------------------------ */
/* Counts — pros per category (companies + tradies) and jobs per cat   */
/* ------------------------------------------------------------------ */

/** slug → number of PROS (distinct companies via company_categories PLUS
 *  tradie profiles whose categorySlugs contains the slug). Small tables →
 *  fetched once and counted in JS (no N+1). */
export async function prosByCategory(): Promise<Map<string, number>> {
  const [companyRows, tradieRows] = await Promise.all([
    db
      .select({
        slug: tables.companyCategories.categorySlug,
        n: sql<number>`count(distinct ${tables.companyCategories.companyId})`,
      })
      .from(tables.companyCategories)
      .groupBy(tables.companyCategories.categorySlug),
    db
      .select({ slugs: tables.tradieProfiles.categorySlugs })
      .from(tables.tradieProfiles),
  ]);

  const counts = new Map<string, number>();
  for (const r of companyRows) counts.set(r.slug, Number(r.n));
  for (const t of tradieRows) {
    for (const s of t.slugs ?? []) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return counts;
}

/** slug → number of OPEN jobs in that top-level category. */
export async function openJobsByCategory(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      slug: tables.jobs.categorySlug,
      n: sql<number>`count(*)`,
    })
    .from(tables.jobs)
    .where(sql`${tables.jobs.status} = 'open' and ${tables.jobs.categorySlug} is not null`)
    .groupBy(tables.jobs.categorySlug);
  const m = new Map<string, number>();
  for (const r of rows) if (r.slug) m.set(r.slug, Number(r.n));
  return m;
}

/* ------------------------------------------------------------------ */
/* Tiles                                                               */
/* ------------------------------------------------------------------ */

/** Build TileData for an arbitrary list of {slug,label}. `counts` optional. */
export function tilesFor(
  items: { slug: string; label: string }[],
  counts?: Map<string, number>,
): TileData[] {
  return items.map(({ slug, label }) => {
    const { photo, art } = tilePhotoForCategory(slug);
    const tile: TileData = { slug, label, photo, art };
    if (counts) tile.count = counts.get(slug) ?? 0;
    return tile;
  });
}

/** The popular-26 tiles, optionally with a pros-per-category count pill. */
export async function popularTiles(withCounts = false): Promise<TileData[]> {
  const counts = withCounts ? await prosByCategory() : undefined;
  return tilesFor(POPULAR, counts);
}

/* ------------------------------------------------------------------ */
/* Companies + tradies in a category                                  */
/* ------------------------------------------------------------------ */

/** Companies mapped to a top-level category via company_categories. `primary`
 *  rows → primary match, others → secondary. Positive/neutral facts only. */
export async function companiesInCategory(slug: string): Promise<FindCompany[]> {
  const rows = await db
    .select({
      id: tables.companies.id,
      name: tables.companies.name,
      slug: tables.companies.slug,
      abn: tables.companies.abn,
      licenceNumber: tables.companies.licenceNumber,
      licenceStatus: tables.companies.licenceStatus,
      location: tables.companies.location,
      artKind: tables.companies.artKind,
      tier: tables.companies.tier,
      ratingAvg: tables.companies.ratingAvg,
      reviewCount: tables.companies.reviewCount,
      lastCheckedAt: tables.companies.lastCheckedAt,
      isPrimary: tables.companyCategories.primary,
    })
    .from(tables.companyCategories)
    .innerJoin(
      tables.companies,
      sql`${tables.companies.id} = ${tables.companyCategories.companyId}`,
    )
    .where(sql`${tables.companyCategories.categorySlug} = ${slug}`);

  const ranked = byFourRs(
    rows.map((c) => ({
      // 4R inputs
      match: (c.isPrimary ? "primary" : "secondary") as CategoryMatch,
      lastCheckedAt: c.lastCheckedAt ? c.lastCheckedAt.toISOString() : null,
      reviewCount: c.reviewCount,
      tier: c.tier as string,
      verified: hasVerifiedBadge(c.tier),
      // passthrough
      name: c.name,
      _row: c,
    })),
  );

  return ranked.map((r) => {
    const c = r._row;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      abn: formatAbn(c.abn),
      licence: [c.licenceNumber, c.licenceStatus].filter(Boolean).join(" · "),
      location: c.location ?? "",
      artKind: c.artKind,
      verified: hasVerifiedBadge(c.tier),
      rating: ratingX10ToNumber(c.ratingAvg),
      reviewCount: c.reviewCount,
      match: r.match,
    };
  });
}

/** Tradie profiles whose categorySlugs contains the slug (jsonb @> operator).
 *  Ordered verified-first, then reliability, then name. Positive/neutral only. */
export async function tradiesInCategory(slug: string): Promise<FindTradie[]> {
  const rows = await db
    .select({
      userId: tables.tradieProfiles.userId,
      businessName: tables.tradieProfiles.businessName,
      suburb: tables.tradieProfiles.suburb,
      reliability: tables.tradieProfiles.reliabilityScore,
      licenceVerified: tables.tradieProfiles.licenceVerified,
      insuranceVerified: tables.tradieProfiles.insuranceVerified,
      availableNow: tables.tradieProfiles.availableNow,
      name: tables.users.name,
    })
    .from(tables.tradieProfiles)
    .innerJoin(tables.users, sql`${tables.users.id} = ${tables.tradieProfiles.userId}`)
    .where(sql`${tables.tradieProfiles.categorySlugs} @> ${JSON.stringify([slug])}::jsonb`);

  return rows
    .map((t) => ({
      userId: t.userId,
      name: t.name,
      businessName: t.businessName,
      suburb: t.suburb ?? "",
      reliability: t.reliability,
      verified: !!(t.licenceVerified || t.insuranceVerified),
      availableNow: t.availableNow,
    }))
    .sort(
      (a, b) =>
        Number(b.verified) - Number(a.verified) ||
        (b.reliability ?? 0) - (a.reliability ?? 0) ||
        a.name.localeCompare(b.name),
    );
}

/** Subcategory chips for a top-level category (empty for unknown slugs). */
export function subChips(slug: string): Category[] {
  return subcategoriesOf(slug);
}

export function topLevel(slug: string): Category | undefined {
  const c = findCategory(slug);
  return c && c.parent === null ? c : undefined;
}
