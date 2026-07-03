import type { ReactNode } from "react";

/** Empty state — R2 system layer (design-system/MASTER.md §9).
 *  ONE pattern everywhere: illustration + headline + one sentence + exactly one CTA.
 *  Server-compatible; the shell recipe is .empty in app.css.
 *
 *    <EmptyState
 *      headline="No builders watched yet"
 *      body="Add the builders you work under — monitoring runs continuously."
 *      cta={<button className="btn btn-p" onClick={…}>Add a builder</button>}
 *    />
 *
 *  `icon` takes a context-specific 72px line-art SVG (navy strokes, one orange
 *  accent — see MASTER §9 for the per-context list); the default below is a
 *  generic clipboard-with-check. Never use ＋/emoji glyphs in the CTA label. */
export default function EmptyState({
  icon,
  headline,
  body,
  cta,
  className,
}: {
  icon?: ReactNode;
  headline: string;
  body?: ReactNode;
  cta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`empty${className ? ` ${className}` : ""}`}>
      {icon ?? <DefaultIllustration />}
      <h3>{headline}</h3>
      {body ? <p>{body}</p> : null}
      {cta}
    </div>
  );
}

/** 72px line-art fallback: clipboard + orange check accent (house 24-grid stroke style, scaled). */
function DefaultIllustration() {
  return (
    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <rect x="16" y="12" width="40" height="52" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <rect x="27" y="7" width="18" height="10" rx="3" fill="#fff" stroke="currentColor" strokeWidth="2.5" />
      <path d="M25 30h16M25 39h22M25 48h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="50" r="10" fill="var(--osoft)" stroke="var(--orange)" strokeWidth="2.5" />
      <path d="M45.5 50l3 3 6-6" stroke="var(--orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
