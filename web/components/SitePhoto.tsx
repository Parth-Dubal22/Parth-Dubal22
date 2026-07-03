/**
 * SPEC_V2 R1 — <SitePhoto slot="…" /> (SERVER component — no "use client").
 *
 * One component for every real-photo slot in the product:
 *   - When `public/photos/manifest.json` has the slot (scripts/fetch-photos.ts has
 *     run with an API key): renders next/image with the local .webp renditions —
 *     `fill` inside an aspect-ratio figure (zero CLS), responsive `sizes` from the
 *     slot registry, lazy below the fold (pass `priority` for the LCP image, which
 *     maps to Next 16's `preload`), alt text from the manifest, plus an optional
 *     glass caption and a tiny "photographer · provider" attribution line per
 *     Unsplash/Pexels norms (full linkable attribution data lives in the manifest
 *     via getPhoto().attribution for pages that want a credits section).
 *   - Until then (TODAY, with no keys and no egress): automatically renders the
 *     slot's mapped <Art kind=…> SVG scene — pages can wire SitePhoto now and get
 *     real photography later with zero further changes.
 *
 * Styling: the figure carries the `.photo-card` class (design-system owned; see
 * design-system/MASTER.md §11.1) — this component only sets layout-critical
 * inline styles (aspect-ratio from the slot + position:relative required by
 * next/image `fill`), never visual skin. Category tiles: wrap SitePhoto in the
 * `.cat-tile` anchor and keep `showAttribution={false}` there if it's too small.
 *
 * Local files under /public need no next.config images entry — zero-config.
 */
import Image from "next/image";
import Art from "./Art";
import { ASPECT_CSS, getPhoto, PHOTO_SLOTS, type PhotoSlotId } from "@/lib/photos";

export interface SitePhotoProps {
  slot: PhotoSlotId;
  /** Above-the-fold LCP image? Maps to next/image `preload` (Next 16's `priority`). */
  priority?: boolean;
  /** Extra class(es) on the <figure> (base class is always `photo-card`). */
  className?: string;
  /** Optional caption — glass chip on the photo, or the Art scene's label when falling back. */
  caption?: string;
  /** Override the slot's default responsive `sizes` for a non-standard layout. */
  sizes?: string;
  /** Hide the tiny photographer · provider line (e.g. on small category tiles). */
  showAttribution?: boolean;
}

/** Tiny credit line — inline-styled (design-system CSS is owned elsewhere);
 *  sits in the caption-scrim zone, never intercepts clicks (tiles stay clickable). */
const creditStyle: React.CSSProperties = {
  position: "absolute",
  right: ".6rem",
  bottom: ".55rem",
  zIndex: 2,
  pointerEvents: "none",
  color: "rgba(255,255,255,.88)",
  background: "rgba(10,27,46,.55)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  borderRadius: "6px",
  padding: ".22rem .5rem",
  font: "500 .62rem var(--fm, monospace)",
  letterSpacing: ".04em",
  whiteSpace: "nowrap",
};

export default function SitePhoto({
  slot,
  priority = false,
  className,
  caption,
  sizes,
  showAttribution = true,
}: SitePhotoProps) {
  const def = PHOTO_SLOTS[slot];
  const photo = getPhoto(slot);
  const figureClass = className ? `photo-card ${className}` : "photo-card";
  // aspect-ratio reserves the box (zero CLS); position:relative is required by
  // next/image `fill` and keeps the fallback art + caption layers anchored.
  const figureStyle: React.CSSProperties = {
    position: "relative",
    aspectRatio: ASPECT_CSS[def.aspect],
  };

  /* ---- fallback path (TODAY: manifest absent → the slot's SVG scene) ---- */
  if (!photo) {
    return (
      <figure className={figureClass} style={figureStyle} data-photo-slot={slot}>
        <Art
          kind={def.fallbackArt}
          label={caption}
          style={{ position: "absolute", inset: 0 }}
        />
      </figure>
    );
  }

  /* ---- real-photo path (after scripts/fetch-photos.ts has run) ---- */
  const a = photo.attribution;
  return (
    <figure className={figureClass} style={figureStyle} data-photo-slot={slot}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes ?? photo.sizes}
        // Next 16: `preload` replaces the deprecated `priority`; default stays lazy.
        preload={priority || undefined}
        quality={80}
        style={{ objectFit: "cover" }}
      />
      {caption ? <figcaption className="cap micro">{caption}</figcaption> : null}
      {showAttribution ? (
        <span style={creditStyle} aria-label={`Photo by ${a.photographer} on ${a.providerName}`}>
          {a.photographer} · {a.providerName}
        </span>
      ) : null}
    </figure>
  );
}
