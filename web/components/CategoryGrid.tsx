/** R5 — a grid of category tiles in LINK mode (MASTER §11.2 .cat-grid).
 *  Server-safe (no "use client", no fs): the parent server component builds the
 *  TileData[] (via lib/find.tilesFor / popularTiles) and passes it in. Renders
 *  the popular grid on /find, the subcategory/related grids, and the /jobs
 *  category filter (compact + query-string hrefs). Client shells that need
 *  select behaviour use <CategoryPicker> instead. */
import CategoryTile from "./CategoryTile";
import type { TileData } from "@/lib/find";

export interface CategoryGridProps {
  tiles: TileData[];
  /** href for a tile = `${hrefBase}/${slug}` (e.g. "/find"), unless hrefFor set. */
  hrefBase?: string;
  /** Full control over each tile's href (e.g. "/jobs?category=tilers"). */
  hrefFor?: (slug: string) => string;
  /** Count-pill meaning for screen readers. */
  countLabel?: string;
  /** Tighter grid variant (.cat-grid.compact). */
  compact?: boolean;
  /** Override tile <img> sizes for compact contexts. */
  sizes?: string;
  id?: string;
}

export default function CategoryGrid({
  tiles,
  hrefBase = "/find",
  hrefFor,
  countLabel = "pros",
  compact = false,
  sizes,
  id,
}: CategoryGridProps) {
  return (
    <div className={compact ? "cat-grid compact" : "cat-grid"} id={id}>
      {tiles.map((t) => (
        <CategoryTile
          key={t.slug}
          label={t.label}
          photo={t.photo}
          art={t.art}
          href={hrefFor ? hrefFor(t.slug) : `${hrefBase}/${t.slug}`}
          count={t.count ?? null}
          countLabel={countLabel}
          sizes={sizes}
        />
      ))}
    </div>
  );
}
