import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LandingNav from "@/components/landing/LandingNav";
import Art from "@/components/Art";
import CheckForm from "./CheckForm";
import { runCheck } from "./run-check";

export const metadata: Metadata = {
  title: "Free builder check — BuildSafe",
  description:
    "Check any Australian builder by name or ABN — free, no signup. BuildSafe monitors public records (ABN Lookup, VBA register, ASIC published notices) and flags signals with sources.",
};

export default async function CheckPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Arriving from the landing hero (?q=): run the check server-side and jump to the result.
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  if (q) {
    const slug = await runCheck(q);
    redirect(`/check/${slug}`);
  }

  return (
    <>
      <LandingNav />

      {/* HERO — big search, prototype hero styling */}
      <section className="hero">
        <div className="wrap">
          <div>
            <span className="eyebrow on-dark">
              Free builder check · No signup · No credit card
            </span>
            <h1 style={{ marginTop: "var(--s5)" }}>
              Check any builder <em>before money changes hands.</em>
            </h1>
            <p className="sub">
              Ten seconds, free forever. BuildSafe monitors public records and flags signals —
              a check is a snapshot of published facts at a point in time, with every source
              linked so you can verify it yourself. It is not a prediction.
            </p>
            <CheckForm />
            <div className="hero-stats">
              <div className="hstat">
                <b>2,970</b>
                <span>builder insolvencies last FY</span>
              </div>
              <div className="hstat">
                <b>$42k</b>
                <span>avg. subbie loss per collapse</span>
              </div>
              <div className="hstat">
                <b>10 sec</b>
                <span>to check any builder, free</span>
              </div>
            </div>
          </div>
          <div aria-hidden="true">
            <Art kind="crane" label="Public records · checked per ABN" />
          </div>
        </div>
      </section>

      {/* WHAT GETS CHECKED */}
      <section>
        <div className="wrap">
          <div className="sec-head rv">
            <span className="eyebrow">What gets checked</span>
            <h2>Three public registers. One plain-English answer.</h2>
            <p className="sub">
              Every check pulls the same public sources per ABN — and every fact on the result
              links back to the register it came from.
            </p>
          </div>
          <div className="grid3">
            <div className="card rv">
              <span className="ic navy">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 9h18M8 14h8" />
                </svg>
              </span>
              <h3>ABN Lookup</h3>
              <p>
                Registration status, entity type and GST standing from the Australian Business
                Register — is the company actually registered and active?
              </p>
            </div>
            <div className="card rv d1">
              <span className="ic ok">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <h3>VBA register</h3>
              <p>
                Victorian Building Authority practitioner register — licence number, class and
                current standing for registered builders.
              </p>
            </div>
            <div className="card rv d2">
              <span className="ic risk">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
                  <path d="M14 3v6h6M9 13h6M9 17h6" />
                </svg>
              </span>
              <h3>ASIC published notices</h3>
              <p>
                Company notices published by ASIC — a count of adverse public records from the
                last 24 months, each verifiable at the source.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW TO READ A CHECK — ACL-safe framing */}
      <section className="sec-navy">
        <div className="wrap split">
          <div className="rv">
            <span className="eyebrow on-dark">
              How to read a check
            </span>
            <h2 style={{ marginTop: "var(--s4)" }}>Facts with sources — not verdicts.</h2>
            <p className="sub" style={{ marginTop: "var(--s4)" }}>
              BuildSafe monitors public records and flags signals. A check shows what the
              registers said at the moment we looked — nothing more, nothing less.
            </p>
            <ul className="checks">
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Every fact cites its public source — verify it in one tap
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Every result shows when it was checked — records change, so re-check before paying
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Not a prediction, not advice — a snapshot of published facts; corrections within 48h
              </li>
            </ul>
          </div>
          <div className="rv d1" aria-hidden="true">
            <Art kind="frame" label="Sourced facts · last-checked shown" />
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <p className="f-legal">
            © 2026 BuildSafe · Built in Melbourne. Demo preview with sample data. BuildSafe
            provides information drawn from public records for general business purposes — not
            legal, financial or credit advice, and not a consumer credit report. Signals are
            sourced facts; status ratings are our opinion based on those disclosed records.
            Builders may request corrections at any time.
          </p>
        </div>
      </footer>
    </>
  );
}
