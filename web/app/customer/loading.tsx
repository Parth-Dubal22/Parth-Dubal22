import Skeleton, { SkeletonGroup } from "@/components/Skeleton";

/** Route-level skeleton for the customer app (MASTER §8): the real app-shell
 *  grid with the expected directory-card count, so the loaded page lands
 *  without a jump. */
export default function CustomerLoading() {
  return (
    <div className="app">
      <aside className="side" aria-hidden="true" />
      <main className="main">
        <SkeletonGroup label="Loading your customer app…" className="stack">
          <Skeleton variant="title" />
          <div className="grid3">
            <Skeleton variant="card" count={6} />
          </div>
        </SkeletonGroup>
      </main>
    </div>
  );
}
