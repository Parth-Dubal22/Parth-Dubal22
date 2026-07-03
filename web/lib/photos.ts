/**
 * SPEC_V2 R1 — photo manifest module (SERVER-ONLY: reads the filesystem).
 *
 * The registry below is the single source of truth for every "real photo" slot in
 * the product. Photos themselves are fetched by `scripts/fetch-photos.ts` (needs
 * UNSPLASH_ACCESS_KEY or PEXELS_API_KEY — see .env.example) which writes
 * `public/photos/<slot>-<width>.webp` + `public/photos/manifest.json`.
 *
 * Until that script has run, `getPhoto()` returns null for every slot and
 * `<SitePhoto>` renders the slot's `fallbackArt` <Art> SVG — so every page works
 * TODAY, with zero keys and zero network access, and upgrades itself to real
 * photography the moment the manifest exists. Do not import this module from a
 * client component ("use client") — call getPhoto() in a server component and
 * pass the plain data down instead.
 */
import fs from "node:fs";
import path from "node:path";
import { ALL_TRADES } from "./format";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Scene kinds that exist in components/Art.tsx (unknown kinds render "house"). */
export type ArtKind = "crane" | "frame" | "house" | "tower" | "tile";

/** Intended render aspect for the slot's container (CSS aspect-ratio). */
export type PhotoAspect = "16/10" | "16/9" | "21/9" | "3/4";

/** CSS `aspect-ratio` value per aspect key. */
export const ASPECT_CSS: Record<PhotoAspect, string> = {
  "16/10": "16 / 10", // default photo-card / cat-tile ratio (MASTER §11.1)
  "16/9": "16 / 9",   // wide hero media
  "21/9": "21 / 9",   // profile cover banners (MASTER §11.3 .cover)
  "3/4": "3 / 4",     // portrait side panels (onboarding / login split ≥1024px)
};

export interface PhotoSlot {
  /** Stock-search query sent to Unsplash/Pexels (themes from SPEC_V2 R1). */
  query: string;
  /** Where the slot is intended to be wired (documentation for page agents). */
  pages: string[];
  /** Hand-written alt text — authoritative; copied into the manifest at fetch time. */
  alt: string;
  /** Art.tsx scene rendered until a real photo has been fetched. */
  fallbackArt: ArtKind;
  /** Intended container aspect. */
  aspect: PhotoAspect;
  /**
   * Recommended `sizes` attribute for next/image, matched to the layout the slot
   * is intended for (MASTER §11/§12 grids). Pages may override per context.
   */
  sizes: string;
}

/* Shared `sizes` recipes (MASTER §11.2 grid: 4→3→2 cols; §12 wraps). */
const SIZES_HERO = "100vw";
const SIZES_GALLERY = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
const SIZES_CAT_TILE = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";
const SIZES_COVER = "(max-width: 1024px) 100vw, 980px";
const SIZES_SIDE_PANEL = "(max-width: 1023px) 100vw, 40vw";

/* ------------------------------------------------------------------ */
/* Slot registry                                                       */
/* ------------------------------------------------------------------ */

export const PHOTO_SLOTS = {
  /* ---- landing ---- */
  "landing-hero": {
    query: "residential construction site dusk australia",
    pages: ["/ (hero background/side)"],
    alt: "Residential construction site at dusk — timber house frames and a tower crane silhouetted against an orange sky",
    fallbackArt: "crane",
    aspect: "16/9",
    sizes: SIZES_HERO,
  },
  "landing-gallery-1": {
    query: "timber framing carpenter house construction",
    pages: ["/ (gallery)"],
    alt: "Carpenter nailing off a timber wall frame on a new home build",
    fallbackArt: "frame",
    aspect: "16/10",
    sizes: SIZES_GALLERY,
  },
  "landing-gallery-2": {
    query: "construction cranes city skyline",
    pages: ["/ (gallery)"],
    alt: "Tower cranes over a construction skyline in the late afternoon",
    fallbackArt: "tower",
    aspect: "16/10",
    sizes: SIZES_GALLERY,
  },
  "landing-gallery-3": {
    query: "concrete pour slab construction workers",
    pages: ["/ (gallery)"],
    alt: "Concreters screeding a fresh slab pour on a residential site",
    fallbackArt: "crane",
    aspect: "16/10",
    sizes: SIZES_GALLERY,
  },
  "landing-gallery-4": {
    query: "tiler laying floor tiles",
    pages: ["/ (gallery)"],
    alt: "Tiler laying large-format floor tiles, checking the level by hand",
    fallbackArt: "tile",
    aspect: "16/10",
    sizes: SIZES_GALLERY,
  },
  "landing-gallery-5": {
    query: "new home handover keys owner",
    pages: ["/ (gallery)"],
    alt: "New homeowners receiving the keys at handover in front of their finished house",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_GALLERY,
  },
  "landing-gallery-6": {
    query: "construction team high visibility vests site",
    pages: ["/ (gallery)"],
    alt: "Construction crew in hi-vis and hard hats walking a building site together",
    fallbackArt: "crane",
    aspect: "16/10",
    sizes: SIZES_GALLERY,
  },

  /* ---- category tiles (R5) — one per trade + Builders on the customer side ---- */
  "category-tiling": {
    query: "tiler tiling floor trowel adhesive",
    pages: ["/customer (category grid)", "/tradie (job-board filter)", "/onboarding (trade tiles)"],
    alt: "Tiler setting floor tiles into fresh adhesive with a notched trowel",
    fallbackArt: "tile",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-bricklaying": {
    query: "bricklayer laying bricks mortar wall",
    pages: ["/customer (category grid)", "/tradie (job-board filter)", "/onboarding (trade tiles)"],
    alt: "Bricklayer laying a course of bricks and striking the mortar with a trowel",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-carpentry": {
    query: "carpenter timber framing power tools",
    pages: ["/customer (category grid)", "/tradie (job-board filter)", "/onboarding (trade tiles)"],
    alt: "Carpenter cutting and fixing timber framing on site",
    fallbackArt: "frame",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-electrical": {
    query: "electrician switchboard electrical panel wiring",
    pages: ["/customer (category grid)", "/tradie (job-board filter)", "/onboarding (trade tiles)"],
    alt: "Electrician wiring circuit breakers inside a residential switchboard",
    fallbackArt: "tower",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-plumbing": {
    query: "plumber under sink pipe wrench",
    pages: ["/customer (category grid)", "/tradie (job-board filter)", "/onboarding (trade tiles)"],
    alt: "Plumber working on the pipework under a kitchen sink",
    fallbackArt: "tile",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-rendering": {
    query: "renderer rendering exterior wall scaffold trowel",
    pages: ["/customer (category grid)", "/tradie (job-board filter)", "/onboarding (trade tiles)"],
    alt: "Renderer on scaffold floating a fresh coat of render across an exterior wall",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-concreting": {
    query: "concreter concrete slab power trowel finishing",
    pages: ["/customer (category grid)", "/tradie (job-board filter)", "/onboarding (trade tiles)"],
    alt: "Concreter finishing a wet slab with a power trowel",
    fallbackArt: "crane",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-plastering": {
    query: "plasterer plastering wall trowel skim",
    pages: ["/customer (category grid)", "/tradie (job-board filter)", "/onboarding (trade tiles)"],
    alt: "Plasterer skimming a wall smooth with a trowel",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-painting": {
    query: "painter cutting in wall paint brush",
    pages: ["/customer (category grid)", "/tradie (job-board filter)", "/onboarding (trade tiles)"],
    alt: "Painter cutting in a wall edge with a brush",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-roofing": {
    query: "roofer installing roof tiles pitched roof",
    pages: ["/customer (category grid)", "/tradie (job-board filter)", "/onboarding (trade tiles)"],
    alt: "Roofer fixing tiles on a pitched residential roof",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-landscaping": {
    query: "landscaper laying turf garden landscaping",
    pages: ["/customer (category grid)", "/tradie (job-board filter)", "/onboarding (trade tiles)"],
    alt: "Landscaper laying fresh turf in a new backyard",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-labouring": {
    query: "construction labourer hi vis carrying materials",
    pages: ["/customer (category grid)", "/tradie (job-board filter)", "/onboarding (trade tiles)"],
    alt: "Labourer in hi-vis carrying materials across a construction site",
    fallbackArt: "crane",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-builders": {
    query: "home builder hard hat building plans site",
    pages: ["/customer (category grid — Builders tile)"],
    alt: "Builder in hi-vis reviewing plans on a residential building site",
    fallbackArt: "crane",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },

  /* ---- popular-category tiles (R5 EXTENDED) — the 26 POPULAR taxonomy slots
     that don't map onto an existing trade slot above. Same licensed-photo rules:
     Unsplash/Pexels via scripts/fetch-photos.ts only — NEVER HiPages or Google
     Images. Alt text hand-written; queries follow the SPEC R1 theme style. ---- */
  "category-air-conditioning": {
    query: "technician installing split system air conditioner wall",
    pages: ["/find (popular grid)", "/find/air-conditioning (hero)", "/customer (category grid)"],
    alt: "Air-conditioning technician fixing a split-system head unit to an interior wall",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-arborist": {
    query: "arborist climbing tree chainsaw harness pruning",
    pages: ["/find (popular grid)", "/find/arborist (hero)", "/customer (category grid)"],
    alt: "Arborist in a climbing harness pruning limbs high in a gum tree",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-bathroom": {
    query: "modern bathroom renovation tiles shower screen",
    pages: ["/find (popular grid)", "/find/bathroom (hero)", "/customer (category grid)"],
    alt: "Freshly renovated bathroom with floor-to-ceiling tiles and a frameless shower screen",
    fallbackArt: "tile",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-cleaning": {
    query: "professional cleaner mopping home floor gloves",
    pages: ["/find (popular grid)", "/find/cleaning (hero)", "/customer (category grid)"],
    alt: "Professional cleaner in gloves mopping a timber floor in a family home",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-decking": {
    query: "timber deck construction drill outdoor",
    pages: ["/find (popular grid)", "/find/decking (hero)", "/customer (category grid)"],
    alt: "Carpenter screwing down fresh timber decking boards on a backyard deck frame",
    fallbackArt: "frame",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-doors": {
    query: "carpenter installing timber door hinge",
    pages: ["/find (popular grid)", "/find/doors (hero)", "/customer (category grid)"],
    alt: "Tradesperson fitting hinges while hanging a new timber door in its frame",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-fencing": {
    query: "timber fence installation backyard posts",
    pages: ["/find (popular grid)", "/find/fencing (hero)", "/customer (category grid)"],
    alt: "Fencer nailing palings to a new timber boundary fence",
    fallbackArt: "frame",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-handyman": {
    query: "handyman tool belt drill home repair",
    pages: ["/find (popular grid)", "/find/handyman (hero)", "/customer (category grid)"],
    alt: "Handyman with a loaded tool belt drilling a wall fixing during a home repair",
    fallbackArt: "frame",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-kitchen": {
    query: "kitchen renovation cabinet installation benchtop",
    pages: ["/find (popular grid)", "/find/kitchen (hero)", "/customer (category grid)"],
    alt: "Cabinet maker levelling new cabinetry during a kitchen renovation",
    fallbackArt: "tile",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-paving": {
    query: "paver laying brick pavers path rubber mallet",
    pages: ["/find (popular grid)", "/find/paving (hero)", "/customer (category grid)"],
    alt: "Paver tapping brick pavers into a sand bed with a rubber mallet",
    fallbackArt: "tile",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-pest-control": {
    query: "pest control technician spraying skirting board",
    pages: ["/find (popular grid)", "/find/pest-control (hero)", "/customer (category grid)"],
    alt: "Pest-control technician treating skirting boards inside a home with a sprayer",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-retaining-walls": {
    query: "stone block retaining wall garden construction",
    pages: ["/find (popular grid)", "/find/retaining-walls (hero)", "/customer (category grid)"],
    alt: "Block retaining wall being built up in courses along a sloped garden bed",
    fallbackArt: "frame",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-security": {
    query: "technician installing security camera cctv wall",
    pages: ["/find (popular grid)", "/find/security (hero)", "/customer (category grid)"],
    alt: "Security installer mounting a CCTV camera to an exterior wall",
    fallbackArt: "tower",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-waterproofing": {
    query: "waterproofing membrane bathroom floor roller",
    pages: ["/find (popular grid)", "/find/waterproofing (hero)", "/customer (category grid)"],
    alt: "Waterproofer rolling blue membrane across a bathroom floor before tiling",
    fallbackArt: "tile",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },
  "category-windows": {
    query: "tradesman installing window frame glass house",
    pages: ["/find (popular grid)", "/find/windows (hero)", "/customer (category grid)"],
    alt: "Installer seating a new window frame into a house opening",
    fallbackArt: "house",
    aspect: "16/10",
    sizes: SIZES_CAT_TILE,
  },

  /* ---- default profile covers (R4/R6) — rotated by company id ---- */
  "profile-cover-default-1": {
    query: "house construction sunset silhouette",
    pages: ["/b/[slug] and /t/[slug] (cover when none uploaded)"],
    alt: "Construction site at dusk with house frames against a warm sky",
    fallbackArt: "crane",
    aspect: "21/9",
    sizes: SIZES_COVER,
  },
  "profile-cover-default-2": {
    query: "timber roof trusses house frame",
    pages: ["/b/[slug] and /t/[slug] (cover when none uploaded)"],
    alt: "Timber roof trusses and wall frames on a new residential build",
    fallbackArt: "frame",
    aspect: "21/9",
    sizes: SIZES_COVER,
  },
  "profile-cover-default-3": {
    query: "tower crane building construction blue sky",
    pages: ["/b/[slug] and /t/[slug] (cover when none uploaded)"],
    alt: "Tower crane over a rising building frame against the skyline",
    fallbackArt: "tower",
    aspect: "21/9",
    sizes: SIZES_COVER,
  },
  "profile-cover-default-4": {
    query: "new suburban homes street australia",
    pages: ["/b/[slug] and /t/[slug] (cover when none uploaded)"],
    alt: "Street of newly completed homes in the late afternoon",
    fallbackArt: "house",
    aspect: "21/9",
    sizes: SIZES_COVER,
  },

  /* ---- auth / onboarding side panels (R2/R7 split layout ≥1024px) ---- */
  "onboarding-side-customer": {
    query: "builder client handshake house site",
    pages: ["/onboarding (customer wizard side panel)"],
    alt: "Builder and client shaking hands on site in front of a new home",
    fallbackArt: "house",
    aspect: "3/4",
    sizes: SIZES_SIDE_PANEL,
  },
  "onboarding-side-tradie": {
    query: "tradesman tool belt high visibility portrait",
    pages: ["/onboarding (tradie wizard side panel)"],
    alt: "Tradie in hi-vis with a tool belt on the job",
    fallbackArt: "frame",
    aspect: "3/4",
    sizes: SIZES_SIDE_PANEL,
  },
  "onboarding-side-builder": {
    query: "construction site manager hard hat plans",
    pages: ["/onboarding (builder wizard side panel)"],
    alt: "Builder walking a construction site while reviewing plans",
    fallbackArt: "crane",
    aspect: "3/4",
    sizes: SIZES_SIDE_PANEL,
  },
  "login-side": {
    query: "construction cranes skyline dusk lights",
    pages: ["/login (side panel)"],
    alt: "Construction cranes on a city skyline at dusk",
    fallbackArt: "tower",
    aspect: "3/4",
    sizes: SIZES_SIDE_PANEL,
  },
} as const satisfies Record<string, PhotoSlot>;

export type PhotoSlotId = keyof typeof PHOTO_SLOTS;

export const ALL_PHOTO_SLOT_IDS = Object.keys(PHOTO_SLOTS) as PhotoSlotId[];

/* Compile-time guarantee: every trade in ALL_TRADES has a category-<trade> slot.
 * (If a trade is ever added to format.ts, this line fails tsc until a slot exists.) */
type TradeCategorySlotId = `category-${Lowercase<(typeof ALL_TRADES)[number]>}`;
const _everyTradeHasACategorySlot: TradeCategorySlotId extends PhotoSlotId ? true : never = true;
void _everyTradeHasACategorySlot;

/** "Tiling" → "category-tiling" (typed); use for R5 tile grids. */
export const categorySlotForTrade = (trade: (typeof ALL_TRADES)[number]): PhotoSlotId =>
  `category-${trade.toLowerCase() as Lowercase<typeof trade>}`;

/* ---- R5 EXTENDED: taxonomy category slug → photo slot ----
 * Every POPULAR slug (lib/data/categories.ts) has a slot: the 15 new
 * category-* slots above plus the 11 that reuse an existing trade slot
 * (tilers→category-tiling etc.). `bricklaying` is mapped too so job-card
 * thumbnails work for the seeded bricklaying job even though it isn't in
 * the popular grid. */
export const CATEGORY_PHOTO_SLOT: Record<string, PhotoSlotId> = {
  "air-conditioning": "category-air-conditioning",
  arborist: "category-arborist",
  bathroom: "category-bathroom",
  building: "category-builders",
  bricklaying: "category-bricklaying",
  carpenters: "category-carpentry",
  cleaning: "category-cleaning",
  concreting: "category-concreting",
  decking: "category-decking",
  doors: "category-doors",
  electricians: "category-electrical",
  fencing: "category-fencing",
  handyman: "category-handyman",
  kitchen: "category-kitchen",
  "landscaping-and-gardening": "category-landscaping",
  painters: "category-painting",
  paving: "category-paving",
  "pest-control": "category-pest-control",
  "plastering-and-gyprock": "category-plastering",
  plumbers: "category-plumbing",
  rendering: "category-rendering",
  "retaining-walls": "category-retaining-walls",
  roofing: "category-roofing",
  security: "category-security",
  tilers: "category-tiling",
  waterproofing: "category-waterproofing",
  windows: "category-windows",
};

/** Category slug → photo slot (null for slugs without one — callers render
 *  the category's fallback Art instead; deep-taxonomy slots can be added later). */
export const slotForCategory = (slug: string): PhotoSlotId | null =>
  CATEGORY_PHOTO_SLOT[slug] ?? null;

/** Serializable subset of ResolvedPhoto for client components (CustomerApp,
 *  TradieApp strips, pickers) — plain <img src srcSet sizes> data, no fs access. */
export interface TilePhoto {
  src: string;
  srcSet: string;
  sizes: string;
  alt: string;
  width: number;
  height: number;
}

/** Resolve a category slug to serializable tile data: the fetched photo (or
 *  null before the pipeline has run) plus the slot's fallback Art kind. */
export function tilePhotoForCategory(slug: string): { photo: TilePhoto | null; art: ArtKind } {
  const slotId = slotForCategory(slug);
  if (!slotId) return { photo: null, art: "house" };
  const p = getPhoto(slotId);
  return {
    photo: p
      ? { src: p.src, srcSet: p.srcSet, sizes: p.sizes, alt: p.alt, width: p.width, height: p.height }
      : null,
    art: PHOTO_SLOTS[slotId].fallbackArt,
  };
}

/** Deterministic default cover rotation for profiles without an uploaded cover. */
export const defaultCoverSlot = (seed: number): PhotoSlotId =>
  (`profile-cover-default-${(Math.abs(seed) % 4) + 1}`) as PhotoSlotId;

/* ------------------------------------------------------------------ */
/* Manifest (written by scripts/fetch-photos.ts)                       */
/* ------------------------------------------------------------------ */

/** Renditions generated per slot (widths in px; .webp). Shared with the script. */
export const PHOTO_WIDTHS = [640, 1280, 1920] as const;

export interface ManifestEntry {
  slot: string;
  provider: "unsplash" | "pexels";
  /** Provider photo id — used for de-duplication across slots. */
  photoId: string;
  photographer: string;
  /** Photographer profile URL (carries UTM params per provider guidelines). */
  profileUrl: string;
  /** The photo's page on the provider (for credits pages). */
  photoUrl: string;
  license: string;
  alt: string;
  /** Intrinsic dimensions of the largest generated rendition. */
  width: number;
  height: number;
  /** width → public path, e.g. { "640": "/photos/landing-hero-640.webp" } */
  files: Record<string, string>;
  fetchedAt: string;
}

export interface PhotoManifest {
  generatedAt: string;
  note?: string;
  photos: Record<string, ManifestEntry>;
}

export interface PhotoAttribution {
  provider: "unsplash" | "pexels";
  providerName: "Unsplash" | "Pexels";
  photographer: string;
  profileUrl: string;
  photoUrl: string;
  license: string;
}

/** What getPhoto() hands to <SitePhoto> / any server component. */
export interface ResolvedPhoto {
  slot: PhotoSlotId;
  /** Largest rendition — use as next/image `src` (local file, zero remote config). */
  src: string;
  width: number;
  height: number;
  /** Manual srcSet string for consumers NOT using next/image (plain <img>, og:image pickers).
   *  next/image generates its own srcset from `src` + `sizes` — don't pass this to it. */
  srcSet: string;
  /** Recommended sizes attribute for this slot's intended layout. */
  sizes: string;
  alt: string;
  aspect: PhotoAspect;
  attribution: PhotoAttribution;
}

const MANIFEST_REL = path.join("public", "photos", "manifest.json");

let cache: { mtimeMs: number; manifest: PhotoManifest } | null = null;

/**
 * Read public/photos/manifest.json (cwd = web/, which is how Next runs).
 * Returns null when the fetch script hasn't produced one yet. Cached by mtime,
 * so running the fetch script against a live dev server picks up on next render.
 */
export function readManifest(): PhotoManifest | null {
  const file = path.join(process.cwd(), MANIFEST_REL);
  try {
    const stat = fs.statSync(file);
    if (cache && cache.mtimeMs === stat.mtimeMs) return cache.manifest;
    const manifest = JSON.parse(fs.readFileSync(file, "utf8")) as PhotoManifest;
    if (!manifest || typeof manifest !== "object" || typeof manifest.photos !== "object") return null;
    cache = { mtimeMs: stat.mtimeMs, manifest };
    return manifest;
  } catch {
    return null; // missing or unreadable → not fetched yet: fall back to SVG art
  }
}

/**
 * Resolve a slot to its fetched photo, or null when the pipeline hasn't run
 * (no keys / no network yet) — callers then render the slot's fallbackArt.
 */
export function getPhoto(slotId: PhotoSlotId): ResolvedPhoto | null {
  const def = PHOTO_SLOTS[slotId];
  if (!def) return null;
  const entry = readManifest()?.photos[slotId];
  if (!entry || !entry.files || Object.keys(entry.files).length === 0) return null;

  const widths = Object.keys(entry.files)
    .map((w) => Number(w))
    .filter((w) => Number.isFinite(w) && w > 0)
    .sort((a, b) => a - b);
  if (widths.length === 0) return null;
  const largest = widths[widths.length - 1];

  return {
    slot: slotId,
    src: entry.files[String(largest)],
    width: entry.width,
    height: entry.height,
    srcSet: widths.map((w) => `${entry.files[String(w)]} ${w}w`).join(", "),
    sizes: def.sizes,
    alt: entry.alt || def.alt,
    aspect: def.aspect,
    attribution: {
      provider: entry.provider,
      providerName: entry.provider === "unsplash" ? "Unsplash" : "Pexels",
      photographer: entry.photographer,
      profileUrl: entry.profileUrl,
      photoUrl: entry.photoUrl,
      license: entry.license,
    },
  };
}
