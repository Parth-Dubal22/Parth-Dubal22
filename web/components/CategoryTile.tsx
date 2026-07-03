/** R5 EXTENDED — one category tile, two modes (MASTER §11.2):
 *    link mode   — whole tile is a single <Link> (server-safe; /find, /jobs)
 *    select mode — <button aria-pressed> (client parents pass onClick)
 *  No "use client" and no fs imports: server components use it directly; client
 *  components (CustomerApp/TradieApp/pickers) import it into their bundle.
 *  Photos arrive pre-serialized as TilePhoto (lib/photos.tilePhotoForCategory —
 *  server-only) so this component never touches the filesystem. */
import Link from "next/link";
import Art from "./Art";
import type { TilePhoto } from "@/lib/photos";

function CheckChip() {
  return (
    <span className="check-chip" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  );
}

export interface CategoryTileProps {
  label: string;
  /** Fetched photo (null until scripts/fetch-photos.ts has run → Art fallback). */
  photo: TilePhoto | null;
  /** Art scene kind rendered while no photo exists. */
  art: string;
  /** Link mode. */
  href?: string;
  /** Select mode (client parents only). */
  onClick?: () => void;
  selected?: boolean;
  /** Count pill top-right (pros / open jobs). Hidden when null/undefined. */
  count?: number | null;
  /** What the count means, for screen readers (e.g. "pros", "open jobs"). */
  countLabel?: string;
  /** Override the photo's default sizes attr for compact grids. */
  sizes?: string;
}

export default function CategoryTile({
  label, photo, art, href, onClick, selected, count, countLabel = "pros", sizes,
}: CategoryTileProps) {
  const inner = (
    <>
      {photo ? (
        // Plain <img> with manual srcSet — works in both server and client
        // bundles with zero config; .photo CSS handles cover + scrim.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes={sizes ?? photo.sizes}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : (
        <Art kind={art} style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
      )}
      {selected ? <CheckChip /> : null}
      {count != null ? (
        <span className="pill">
          {count}
          <span className="vh"> {countLabel}</span>
        </span>
      ) : null}
      <span className="cap title">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link className="cat-tile photo" href={href} aria-label={count != null ? `${label} — ${count} ${countLabel}` : label}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className="cat-tile photo"
      onClick={onClick}
      aria-pressed={selected ?? false}
      aria-label={count != null ? `${label} — ${count} ${countLabel}` : label}
    >
      {inner}
    </button>
  );
}
