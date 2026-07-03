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
