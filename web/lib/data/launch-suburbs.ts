/** SPEC_V2 R5 EXTENDED — launch suburbs (Melbourne SE + west growth corridor).
 *  Suburb × category pages (/find/[category]/[suburb]) are generated for THESE
 *  suburbs and the popular-26 categories ONLY — every other combination 404s.
 *  That's the thin-page spam guard from SPEC_V2_CATEGORIES §4: no doorway-page
 *  farm, just suburbs where BuildSafe actually launches (CLAUDE.md: VIC first). */

export type LaunchSuburb = { slug: string; name: string };

export const LAUNCH_SUBURBS: LaunchSuburb[] = [
  { slug: "cranbourne", name: "Cranbourne" },
  { slug: "clyde-north", name: "Clyde North" },
  { slug: "officer", name: "Officer" },
  { slug: "berwick", name: "Berwick" },
  { slug: "pakenham", name: "Pakenham" },
  { slug: "narre-warren", name: "Narre Warren" },
  { slug: "frankston", name: "Frankston" },
  { slug: "dandenong", name: "Dandenong" },
  { slug: "werribee", name: "Werribee" },
  { slug: "tarneit", name: "Tarneit" },
];

const BY_SLUG = new Map(LAUNCH_SUBURBS.map((s) => [s.slug, s]));

export const findLaunchSuburb = (slug: string): LaunchSuburb | undefined => BY_SLUG.get(slug);
