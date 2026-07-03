import Skeleton, { SkeletonGroup } from "@/components/Skeleton";

/** Route-level loading state for /tradie — app-shell skeleton (MASTER §8, §12).
 *  Mirrors the real layout grid (appbar + side + main: topbar → kpis → list)
 *  so nothing jumps when the dashboard streams in. */
export default function TradieLoading() {
  return (
    <>
      <div className="appbar">
        <b>BuildSafe · Tradie</b>
      </div>
      <div className="app">
        <aside className="side" aria-hidden="true">
          <span className="logo">
            <span className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            BuildSafe
          </span>
          <span className="role">TRADIE APP</span>
          <Skeleton variant="text" count={6} />
        </aside>
        <main className="main">
          <SkeletonGroup label="Loading your tradie dashboard…">
            <div className="topbar">
              <Skeleton variant="title" />
            </div>
            <div className="kpis">
              <Skeleton variant="kpi" count={4} />
            </div>
            <div className="topbar">
              <Skeleton variant="title" />
            </div>
            <div className="list">
              <Skeleton variant="item" count={3} />
            </div>
          </SkeletonGroup>
        </main>
      </div>
    </>
  );
}
