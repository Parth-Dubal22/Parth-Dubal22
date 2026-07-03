"use client";
/** R5 — select-mode category tiles for client shells (MASTER §11.2).
 *  Multi-select (onboarding/profile secondary use) OR single-select filter
 *  (customer "what do you need done?"). Each tile is a <button aria-pressed>
 *  with a check chip when selected; grid is keyboard-operable (native buttons,
 *  roving with Tab). The parent owns selection state and passes serializable
 *  TileData[] (built server-side — pickers never touch the filesystem). */
import CategoryTile from "./CategoryTile";
import type { TileData } from "@/lib/find";

export interface CategoryPickerProps {
  tiles: TileData[];
  /** Currently-selected slugs. */
  selected: string[];
  /** Toggle a slug. For single-select filters, parent replaces the array. */
  onToggle: (slug: string) => void;
  countLabel?: string;
  compact?: boolean;
  sizes?: string;
  id?: string;
  /** Accessible group label. */
  ariaLabel?: string;
}

export default function CategoryPicker({
  tiles,
  selected,
  onToggle,
  countLabel = "pros",
  compact = true,
  sizes,
  id,
  ariaLabel = "Choose a category",
}: CategoryPickerProps) {
  const sel = new Set(selected);
  return (
    <div
      className={compact ? "cat-grid compact" : "cat-grid"}
      id={id}
      role="group"
      aria-label={ariaLabel}
    >
      {tiles.map((t) => (
        <CategoryTile
          key={t.slug}
          label={t.label}
          photo={t.photo}
          art={t.art}
          onClick={() => onToggle(t.slug)}
          selected={sel.has(t.slug)}
          count={t.count ?? null}
          countLabel={countLabel}
          sizes={sizes}
        />
      ))}
    </div>
  );
}
