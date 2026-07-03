import Skeleton, { SkeletonGroup } from "@/components/Skeleton";

/** /builder instant loading state — MASTER §8 app-shell skeleton.
 *  Mirrors the Overview panel's real layout grid (topbar → kpis → grid2 → card)
 *  so the streamed page swaps in without a jump. */
export default function Loading() {
  return (
    <div className="app">
      <aside className="side" aria-hidden="true" />
      <main className="main">
        <SkeletonGroup label="Loading your builder dashboard…">
          <div className="topbar">
            <Skeleton variant="title" />
          </div>
          <div className="kpis">
            <Skeleton variant="kpi" count={4} />
          </div>
          <div className="stack">
            <div className="grid2">
              <Skeleton variant="card" count={2} />
            </div>
            <div className="list">
              <Skeleton variant="item" count={3} />
            </div>
          </div>
        </SkeletonGroup>
      </main>
    </div>
  );
}
