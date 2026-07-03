/** /check/[slug] instant loading state — page skeleton per MASTER §8.
 *  Mirrors the result layout (eyebrow → name row → meta line → fact list →
 *  CTA row) inside the same .wrap-narrow so the result swaps in without jump. */
import LandingNav from "@/components/landing/LandingNav";
import Skeleton, { SkeletonGroup } from "@/components/Skeleton";

export default function CheckResultLoading() {
  return (
    <>
      <LandingNav />
      <section>
        <SkeletonGroup label="Running the check against public registers…" className="wrap-narrow">
          <Skeleton variant="text" className="w-l" />
          <div style={{ marginTop: "var(--s4)" }}>
            <Skeleton variant="title" />
          </div>
          <div style={{ marginTop: "var(--s2)" }}>
            <Skeleton variant="text" className="w-m" />
          </div>
          <div className="list" style={{ marginTop: "var(--stack-gap)" }}>
            <Skeleton variant="item" count={4} />
          </div>
          <div className="actions" style={{ marginTop: "var(--stack-gap)" }}>
            <Skeleton variant="text" className="w-s" count={2} />
          </div>
        </SkeletonGroup>
      </section>
    </>
  );
}
