/** SPEC_V2 R5 EXTENDED — our OWN one-line category descriptions (plain Aussie
 *  English, no competitor sentences — SPEC_V2_CATEGORIES §5). Popular 26 for
 *  now; the categories.description column stays nullable so the rest can be
 *  written later. Keyed by taxonomy slug (lib/data/categories.ts). */

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "air-conditioning":
    "Install, service and repair — ducted, split systems and evap, sized right for your place.",
  arborist:
    "Qualified tree work — pruning, removals and stump grinding done safely and cleaned up after.",
  bathroom:
    "Full renos and smart updates — design, waterproofing, tiling and fit-off under one roof.",
  building:
    "Registered builders for new homes, extensions and renos — financially checked before you hand over a deposit.",
  carpenters:
    "Frames, decks, doors and fix-out — carpenters who measure twice and turn up when they say.",
  cleaning:
    "Home, bond and builder cleans — leave it spotless without lifting a finger.",
  concreting:
    "Slabs, driveways and paths — poured straight, finished level, cured properly.",
  decking:
    "Timber or composite decks built to last Aussie summers — design, build and repairs.",
  doors:
    "Hanging, repairs and replacements — internal, entry and security doors that shut properly.",
  electricians:
    "Licensed sparkies for switchboards, power points, lighting and EV chargers — tested and tagged.",
  fencing:
    "Timber, Colorbond, glass or rural — straight fences and gates that make good neighbours.",
  handyman:
    "Odd jobs knocked over in one visit — repairs, assembly, patching and the list on the fridge.",
  kitchen:
    "New kitchens and renos — cabinetry, benchtops and appliances measured up and fitted once.",
  "landscaping-and-gardening":
    "Design, construction and garden care — turn the backyard into your favourite room.",
  painters:
    "Interior and exterior painting with proper prep — clean lines, clean site, colours that suit.",
  paving:
    "Driveways, paths and patios — pavers laid level on a proper base, with edges that stay put.",
  "pest-control":
    "Termites, spiders, rodents and more — licensed treatments that keep the crawlies out.",
  "plastering-and-gyprock":
    "Walls and ceilings hung, set and sanded smooth — patches you'll never find again.",
  plumbers:
    "Licensed plumbing — blocked drains, hot water, leaks and renos, all done to code.",
  rendering:
    "Cement and acrylic render — fresh, weatherproof walls with a finish that lasts.",
  "retaining-walls":
    "Engineered walls in timber, block or stone — hold the slope and look good doing it.",
  roofing:
    "Tiles, metal and Colorbond — new roofs, restorations and repairs that keep the weather out.",
  security:
    "Alarms, CCTV, intercoms and access control — professionally installed so you sleep easy.",
  tilers:
    "Floors, walls and wet areas — tiles laid flat, cut clean and grouted properly.",
  waterproofing:
    "Keep water where it belongs — showers, balconies and pools sealed properly.",
  windows:
    "Replacements, new installs and glass repairs — draught-free windows that open and shut like new.",
};

export const categoryDescription = (slug: string): string | null =>
  CATEGORY_DESCRIPTIONS[slug] ?? null;
