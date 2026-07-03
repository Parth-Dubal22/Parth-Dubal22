import type { ReactNode } from "react";

/** R2 page transition (design-system/MASTER.md §13): every route change fades in
 *  with an 8px rise over --t-3/--ease via the .page-in recipe in app.css.
 *  Next remounts template.tsx per navigation, which restarts the animation.
 *  prefers-reduced-motion: the global kill-switch in app.css disables it. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-in">{children}</div>;
}
