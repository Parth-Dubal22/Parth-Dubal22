import type { ReactNode } from "react";

/** Skeleton loaders — R2 system layer (design-system/MASTER.md §8).
 *  Server-compatible. Recipes live in app.css (.skel + presets).
 *
 *  Usage — render the EXPECTED row count in the real layout grid so nothing jumps:
 *    <SkeletonGroup label="Loading alerts…" className="list">
 *      <Skeleton variant="item" count={3} />
 *    </SkeletonGroup>
 *
 *  The group sets aria-busy + a visually-hidden live label; skeleton nodes are
 *  aria-hidden. Reduced motion: the shimmer freezes to a static --cloud block. */

export type SkeletonVariant = "text" | "title" | "avatar" | "kpi" | "item" | "card" | "photo";

export default function Skeleton({
  variant = "text",
  count = 1,
  className,
}: {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}) {
  const cls = `skel skel-${variant}${className ? ` ${className}` : ""}`;
  if (count === 1) return <div className={cls} aria-hidden="true" />;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cls} aria-hidden="true" />
      ))}
    </>
  );
}

/** Wrap a loading region: announces busy state while the skeletons render. */
export function SkeletonGroup({
  label = "Loading…",
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className} aria-busy="true">
      <span className="vh" role="status">
        {label}
      </span>
      {children}
    </div>
  );
}
