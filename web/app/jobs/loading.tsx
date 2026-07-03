/** /jobs instant loading state — list-page skeleton per MASTER §8.
 *  Mirrors the real layout (topbar → filter row → 2-col jobcard grid) so the
 *  streamed content swaps in with zero jump. */
import LandingNav from "@/components/landing/LandingNav";
import Skeleton, { SkeletonGroup } from "@/components/Skeleton";

export default function JobsLoading() {
  return (
    <>
      <LandingNav />
      <main>
        <section>
          <SkeletonGroup label="Loading open jobs…" className="wrap">
            <Skeleton variant="text" className="w-m" />
            <div className="topbar" style={{ marginTop: "var(--s4)" }}>
              <Skeleton variant="title" className="w-l" />
            </div>
            <div className="filters">
              <Skeleton variant="text" className="w-s" count={3} />
            </div>
            <div className="grid2" style={{ marginTop: "var(--s4)" }}>
              <Skeleton variant="card" count={4} />
            </div>
          </SkeletonGroup>
        </section>
      </main>
    </>
  );
}
