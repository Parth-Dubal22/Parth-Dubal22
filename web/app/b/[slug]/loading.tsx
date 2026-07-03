import Skeleton, { SkeletonGroup } from "@/components/Skeleton";
import ProfileNav from "./ProfileNav";

/** Route-level skeleton for the public builder profile (MASTER §8):
 *  cover + overlapping hero card + two-column body, in the real .pwrap grid
 *  so the loaded page lands without a jump. */
export default function ProfileLoading() {
  return (
    <>
      <ProfileNav />
      <div className="pwrap">
        <SkeletonGroup label="Loading builder profile…">
          <div className="cover">
            <div className="skel" style={{ height: "100%", borderRadius: "var(--r-7)" }} aria-hidden="true" />
          </div>
          <div className="phead phead-hero">
            <div
              className="skel"
              style={{ width: 92, height: 92, borderRadius: "var(--r-7)", flexShrink: 0 }}
              aria-hidden="true"
            />
            <div className="grow list">
              <Skeleton variant="title" />
              <Skeleton variant="text" />
            </div>
            <div className="list" style={{ minWidth: 180 }}>
              <div className="skel" style={{ height: "var(--ctl-m)" }} aria-hidden="true" />
              <div className="skel" style={{ height: "var(--ctl-s)" }} aria-hidden="true" />
            </div>
          </div>
          <div className="grid2" style={{ marginTop: "var(--s4)", alignItems: "start" }}>
            <div className="list">
              <Skeleton variant="item" count={3} />
              <Skeleton variant="photo" count={2} />
            </div>
            <div className="list">
              <Skeleton variant="card" count={2} />
            </div>
          </div>
        </SkeletonGroup>
      </div>
    </>
  );
}
