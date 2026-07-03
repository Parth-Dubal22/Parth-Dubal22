import Skeleton, { SkeletonGroup } from "@/components/Skeleton";

/** /admin instant loading state — MASTER §8 app-shell skeleton.
 *  Mirrors the queue panels' real layout (topbar → note → list of queue items)
 *  so the streamed page swaps in without a jump. */
export default function Loading() {
  return (
    <div className="app">
      <aside className="side" aria-hidden="true" />
      <main className="main">
        <SkeletonGroup label="Loading the review queues…">
          <div className="topbar">
            <Skeleton variant="title" />
          </div>
          <div className="stack">
            <Skeleton variant="text" />
            <div className="list">
              <Skeleton variant="item" count={4} />
            </div>
          </div>
        </SkeletonGroup>
      </main>
    </div>
  );
}
