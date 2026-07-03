/** Category taxonomy — generated from SPEC_V2_CATEGORIES.md (232 top-level,
 *  854 subcategories). categories.json is the canonical parsed data; this
 *  module adds types + helpers. Regenerate the JSON by re-running the parser
 *  against SPEC_V2_CATEGORIES.md if the taxonomy changes. */
import raw from "./categories.json";

export type Category = {
  slug: string;
  name: string;
  parent: string | null;
  synonyms: string[];
};

export const CATEGORIES: Category[] = raw as Category[];

export const TOP_LEVEL: Category[] = CATEGORIES.filter((c) => c.parent === null);

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));
const BY_PARENT = new Map<string, Category[]>();
for (const c of CATEGORIES) {
  if (c.parent) {
    const list = BY_PARENT.get(c.parent) ?? [];
    list.push(c);
    BY_PARENT.set(c.parent, list);
  }
}

export const findCategory = (slug: string): Category | undefined => BY_SLUG.get(slug);
export const subcategoriesOf = (slug: string): Category[] => BY_PARENT.get(slug) ?? [];

/** The ~26 most-demanded top-levels for the Popular Categories photo grid
 *  (SPEC_V2_CATEGORIES §3). "Builders" displays the `building` top-level. */
export const POPULAR: { slug: string; label: string }[] = [
  { slug: "air-conditioning", label: "Air Conditioning" },
  { slug: "arborist", label: "Arborist" },
  { slug: "bathroom", label: "Bathroom" },
  { slug: "building", label: "Builders" },
  { slug: "carpenters", label: "Carpenters" },
  { slug: "cleaning", label: "Cleaning" },
  { slug: "concreting", label: "Concreting" },
  { slug: "decking", label: "Decking" },
  { slug: "doors", label: "Doors" },
  { slug: "electricians", label: "Electricians" },
  { slug: "fencing", label: "Fencing" },
  { slug: "handyman", label: "Handyman" },
  { slug: "kitchen", label: "Kitchen" },
  { slug: "landscaping-and-gardening", label: "Landscaping & Gardening" },
  { slug: "painters", label: "Painters" },
  { slug: "paving", label: "Paving" },
  { slug: "pest-control", label: "Pest Control" },
  { slug: "plastering-and-gyprock", label: "Plastering & Gyprock" },
  { slug: "plumbers", label: "Plumbers" },
  { slug: "rendering", label: "Rendering" },
  { slug: "retaining-walls", label: "Retaining Walls" },
  { slug: "roofing", label: "Roofing" },
  { slug: "security", label: "Security" },
  { slug: "tilers", label: "Tilers" },
  { slug: "waterproofing", label: "Waterproofing" },
  { slug: "windows", label: "Windows" },
];

/** Legacy ALL_TRADES (12) → taxonomy top-level slug. "Labouring" has no
 *  taxonomy equivalent; it maps to handyman with a synonym note. */
export const TRADE_TO_CATEGORY: Record<string, string> = {
  Tiling: "tilers",
  Bricklaying: "bricklaying",
  Carpentry: "carpenters",
  Electrical: "electricians",
  Plumbing: "plumbers",
  Rendering: "rendering",
  Concreting: "concreting",
  Plastering: "plastering-and-gyprock",
  Painting: "painters",
  Roofing: "roofing",
  Landscaping: "landscaping-and-gardening",
  Labouring: "handyman",
};

/** Reverse of TRADE_TO_CATEGORY: taxonomy slug → legacy ALL_TRADES name (first
 *  trade wins on collisions). Used to keep `tradieProfiles.trades` populated
 *  with legacy names while `categorySlugs` becomes the source of truth. */
export const CATEGORY_TO_TRADE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [trade, slug] of Object.entries(TRADE_TO_CATEGORY)) {
    if (!(slug in m)) m[slug] = trade;
  }
  return m;
})();

export const POPULAR_SLUGS = new Set(POPULAR.map((p) => p.slug));
export const isPopularCategory = (slug: string) => POPULAR_SLUGS.has(slug);
export const popularLabel = (slug: string) =>
  POPULAR.find((p) => p.slug === slug)?.label ?? findCategory(slug)?.name ?? slug;

/** Free-text trade → taxonomy top-level slug. Handles the legacy ALL_TRADES
 *  names exactly, then exact top-level name matches, then a keyword heuristic
 *  for the messy strings already in the DB ("Wall & Floor Tiling" → tilers). */
export function categorySlugForTradeText(trade: string): string | null {
  const exact = TRADE_TO_CATEGORY[trade];
  if (exact) return exact;
  const t = trade.trim().toLowerCase();
  if (!t) return null;
  const byName = TOP_LEVEL.find((c) => c.name.toLowerCase() === t);
  if (byName) return byName.slug;
  const HEURISTICS: [RegExp, string][] = [
    [/til/i, "tilers"],
    [/brick|block/i, "bricklaying"],
    [/carpen|chippy|chippie/i, "carpenters"],
    [/electric|sparkie|sparky/i, "electricians"],
    [/plumb/i, "plumbers"],
    [/render/i, "rendering"],
    [/concret/i, "concreting"],
    [/plaster|gyprock/i, "plastering-and-gyprock"],
    [/paint/i, "painters"],
    [/roof/i, "roofing"],
    [/landscap|garden/i, "landscaping-and-gardening"],
    [/labour|handyman/i, "handyman"],
    [/scaffold/i, "scaffolding"],
    [/build/i, "building"],
  ];
  for (const [re, slug] of HEURISTICS) {
    if (re.test(t)) return slug;
  }
  return null;
}

export type CategorySearchHit = {
  category: Category;
  /** For subcategory hits: the top-level the picker actually selects. */
  topLevel: Category;
  /** Why it matched — shown in the picker result row. */
  via: "name" | "synonym" | "subcategory";
};

/** Search-as-you-type over the FULL tree (top-level names, synonyms and
 *  subcategory names). Pure + client-safe: the pickers run this per keystroke.
 *  Ranking: top-level name prefix > top-level name substring > synonym >
 *  subcategory name. Selecting a subcategory hit selects its top-level. */
export function searchCategories(query: string, limit = 12): CategorySearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { hit: CategorySearchHit; score: number }[] = [];
  for (const c of CATEGORIES) {
    const top = c.parent ? BY_SLUG.get(c.parent) : c;
    if (!top) continue;
    const name = c.name.toLowerCase();
    let score = -1;
    let via: CategorySearchHit["via"] = c.parent ? "subcategory" : "name";
    if (name.startsWith(q)) score = c.parent ? 40 : 100;
    else if (name.includes(q)) score = c.parent ? 30 : 80;
    if (score < 0 && !c.parent) {
      const syn = c.synonyms.find((s) => s.toLowerCase().includes(q));
      if (syn) {
        score = 60;
        via = "synonym";
      }
    }
    if (score < 0) continue;
    // One row per top-level: keep the best-scoring hit for it.
    const key = top.slug;
    const existing = scored.find((s) => s.hit.topLevel.slug === key);
    if (existing) {
      if (score > existing.score) {
        existing.score = score;
        existing.hit = { category: c, topLevel: top, via };
      }
      continue;
    }
    scored.push({ hit: { category: c, topLevel: top, via }, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.hit.topLevel.name.localeCompare(b.hit.topLevel.name))
    .slice(0, limit)
    .map((s) => s.hit);
}

/** A–Z index of every top-level category for the "More Categories" section. */
export function topLevelAtoZ(): Map<string, Category[]> {
  const m = new Map<string, Category[]>();
  for (const c of [...TOP_LEVEL].sort((a, b) => a.name.localeCompare(b.name))) {
    const letter = /^[0-9]/.test(c.name) ? "#" : c.name[0].toUpperCase();
    const list = m.get(letter) ?? [];
    list.push(c);
    m.set(letter, list);
  }
  return m;
}
