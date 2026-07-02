import type { Metadata } from "next";
import LandingNav from "@/components/landing/LandingNav";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { PLANS, type Plan } from "@/lib/stripe";
import { SubscribeButton, CancelButton } from "./BillingButtons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing — BuildSafe",
  description:
    "Tradie Watch $29/mo and Builder Pro $99/mo. No pay-per-lead. No expiring credits. No lock-in contracts. Cancel anytime.",
};

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="var(--clear)" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export default async function Pricing({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const user = await currentUser();
  const sub = user
    ? await db.query.subscriptions.findFirst({ where: (s, { eq }) => eq(s.userId, user.id) })
    : null;

  function cta(plan: Plan) {
    if (!user) {
      return (
        <a className="btn btn-p" href="/onboarding">
          Create your profile →
        </a>
      );
    }
    const matches = user.role === "admin" || user.role === PLANS[plan].role;
    if (!matches) {
      return (
        <p className="hint">
          {PLANS[plan].label} is for {PLANS[plan].role} accounts.
        </p>
      );
    }
    const isCurrent = sub?.plan === plan && (sub.status === "active" || sub.status === "past_due");
    if (isCurrent && sub) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: ".7rem", alignItems: "flex-start" }}>
          <span className={`pill ${sub.status === "past_due" ? "watch" : "ok"}`}>
            {sub.status === "past_due" ? "Current plan — payment past due" : "Current plan"}
          </span>
          {sub.currentPeriodEnd && (
            <span className="mono" style={{ fontSize: ".78rem", color: "var(--slate)" }}>
              RENEWS {fmtDate(sub.currentPeriodEnd)}
            </span>
          )}
          <CancelButton />
        </div>
      );
    }
    return <SubscribeButton plan={plan} label={`Start ${PLANS[plan].label} — cancel anytime`} />;
  }

  return (
    <>
      <LandingNav />

      <section>
        <div className="wrap">
          <div className="sec-head rv">
            <span className="eyebrow">Pricing</span>
            <h2>One fair price per side. Nothing per lead.</h2>
            <p className="sub">
              Free to check a builder, free to build a profile, free to apply for jobs — always.
              Pay only for continuous monitoring and pro tools. Cancel anytime.
            </p>
          </div>

          {sp.status === "success" && (
            <p className="pill ok" role="status" style={{ marginBottom: "1.4rem" }}>
              Payment received — your subscription is being activated.
            </p>
          )}
          {sp.status === "canceled" && (
            <p className="pill watch" role="status" style={{ marginBottom: "1.4rem" }}>
              Checkout cancelled — nothing was charged.
            </p>
          )}

          <div className="grid2">
            {/* TRADIE WATCH */}
            <div className="card rv">
              <span className="eyebrow">For tradies &amp; subbies</span>
              <h3 style={{ marginTop: ".9rem" }}>Tradie Watch</h3>
              <p style={{ margin: ".4rem 0 .2rem" }}>
                <b className="mono" style={{ fontSize: "2.1rem" }}>$29</b>
                <span className="mono" style={{ color: "var(--slate)" }}> /month</span>
              </p>
              <p className="hint">Cancel anytime. No lock-in contracts.</p>
              <ul className="checks">
                <li>
                  <Check />
                  Watchlists for every builder you work under
                </li>
                <li>
                  <Check />
                  Continuous monitoring of public records — ASIC, courts, licence registers
                </li>
                <li>
                  <Check />
                  $ exposure tracker across your builders
                </li>
                <li>
                  <Check />
                  SMS/push + email alerts the moment records change
                </li>
                <li>
                  <Check />
                  Every alert cites its public source — verify in one tap
                </li>
              </ul>
              <div style={{ marginTop: "1.2rem" }}>{cta("tradie_watch")}</div>
            </div>

            {/* BUILDER PRO */}
            <div className="card rv d1">
              <span className="eyebrow" style={{ background: "var(--osoft)", color: "var(--orange)" }}>
                For builders
              </span>
              <h3 style={{ marginTop: ".9rem" }}>Builder Pro</h3>
              <p style={{ margin: ".4rem 0 .2rem" }}>
                <b className="mono" style={{ fontSize: "2.1rem" }}>$99</b>
                <span className="mono" style={{ color: "var(--slate)" }}> /month</span>
              </p>
              <p className="hint">Cancel anytime. No lock-in contracts.</p>
              <ul className="checks">
                <li>
                  <Check />
                  Watch your developers &amp; clients upward — know before you pour
                </li>
                <li>
                  <Check />
                  Subbie panel downward — licence &amp; insurance expiry tracking
                </li>
                <li>
                  <Check />
                  Your own health view — see what the market sees
                </li>
                <li>
                  <Check />
                  Verification badge eligibility with published criteria
                </li>
                <li>
                  <Check />
                  Post subcontract packages &amp; day-hire free — tradies apply free too
                </li>
              </ul>
              <div style={{ marginTop: "1.2rem" }}>{cta("builder_pro")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ANTI-PATTERN PLEDGE */}
      <section>
        <div className="wrap">
          <div
            className="appcard rv"
            style={{
              textAlign: "center",
              padding: "3rem 2rem",
              background: "linear-gradient(160deg,#0F2440,#0A1B2E)",
              color: "#fff",
              border: "none",
            }}
          >
            <span className="eyebrow" style={{ background: "rgba(255,90,31,.15)" }}>
              Our pledge
            </span>
            <h2 style={{ color: "#fff", marginTop: "1rem" }}>
              No pay-per-lead. No expiring credits. No lock-in contracts. Cancel anytime.
            </h2>
            <p className="sub" style={{ color: "#9DB0CC", maxWidth: "56ch", margin: "1rem auto 0" }}>
              We charge for monitoring and pro tools — never for the chance to work. Tradies never
              pay to apply. Builders never pay per applicant. Reviews are never suppressed.
            </p>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <p className="f-legal">
            © 2026 BuildSafe · Built in Melbourne. Subscriptions renew monthly and can be cancelled
            anytime — access continues until the end of the paid period. BuildSafe monitors public
            records and flags signals; every alert cites its public source. Information is provided
            for general business purposes — not legal, financial or credit advice, and not a
            consumer credit report.
          </p>
        </div>
      </footer>
    </>
  );
}
