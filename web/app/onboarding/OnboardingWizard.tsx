"use client";
/** Onboarding — ported 1:1 from site/onboarding.html (role picker → tailored wizard).
 *  The final step now really registers: POST /api/register → signIn("credentials"). */
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "@/components/Toast";
import { ALL_TRADES, initials } from "@/lib/format";

type WizardRole = "customer" | "tradie" | "builder";

const BUILDS = ["New homes", "Townhouses", "Renovations", "Extensions", "Commercial fit-out", "Multi-res"];

const STEP2_COPY: Record<WizardRole, [string, string]> = {
  customer: ["Tell us about you", "So verified builders can quote your project properly."],
  tradie: ["Build your tradie profile", "This is what builders see when you apply — licence and insurance get you hired faster."],
  builder: ["Set up your builder profile", "This becomes your public page — customers and subbies both see it."],
};

const APP_HREF: Record<WizardRole, string> = {
  customer: "/customer",
  tradie: "/tradie",
  builder: "/builder",
};

const DONE_COPY: Record<WizardRole, { h: (first: string) => string; p: string }> = {
  customer: {
    h: (first) => `Welcome, ${first} — let's find you a safe builder`,
    p: "Your Customer app is ready: search verified builders, read two-way reviews, and run a free deposit-safety check before you pay anyone.",
  },
  tradie: {
    h: (first) => `You're set, ${first} — protection is on`,
    p: "Your Tradie app is ready: add the builders you work under to your watchlist, log your exposure, and browse the job board — zero lead fees.",
  },
  builder: {
    h: () => "Profile live — now get Verified",
    p: "Your Builder app is ready: post jobs, watch your clients and subbies, and apply for the Verified badge that wins nervous customers.",
  },
};

export default function OnboardingWizard({ initialRole }: { initialRole?: WizardRole } = {}) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<WizardRole | null>(initialRole ?? null);

  // Step 2 fields (prototype ids f-name, f-email, f-suburb, f-abn, f-lic, f-ins, f-co, f-blic, f-proj)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [suburb, setSuburb] = useState("");
  const [abn, setAbn] = useState("");
  const [trades, setTrades] = useState<string[]>([]);
  const [lic, setLic] = useState("");
  const [ins, setIns] = useState("");
  const [insExpiry, setInsExpiry] = useState("");
  const [company, setCompany] = useState("");
  const [builderLic, setBuilderLic] = useState("");
  const [builds, setBuilds] = useState<string[]>([]);
  const [projectType, setProjectType] = useState("New home build");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function go(n: number) {
    setStep(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function submit() {
    if (!role) return;
    setError("");
    if (!name.trim()) return setError("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== password2) return setError("Passwords don't match.");
    if (role === "builder") {
      if (!company.trim()) return setError("Please enter your company name.");
      if (abn.replace(/\D/g, "").length !== 11) return setError("Please enter a valid 11-digit ABN for your company.");
    }

    setBusy(true);
    try {
      const profile: Record<string, unknown> = { suburb: suburb.trim() || undefined };
      if (role === "customer") profile.projectType = projectType;
      if (role === "tradie") {
        profile.abn = abn.trim() || undefined;
        profile.trades = trades;
        profile.licenceNumber = lic.trim() || undefined;
        profile.insurance = ins.trim() || undefined;
        profile.insuranceExpiry = insExpiry || undefined;
      }
      if (role === "builder") {
        profile.abn = abn.trim();
        profile.companyName = company.trim();
        profile.licenceNumber = builderLic.trim() || undefined;
        profile.builds = builds;
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, name: name.trim(), email: email.trim(), password, profile }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Something went wrong creating your account. Please try again.");
        return;
      }

      const signed = await signIn("credentials", { email: email.trim(), password, redirect: false });
      if (signed?.error) {
        setError("Account created — please sign in at the login page.");
        return;
      }
      toast("Account created — you're signed in");
      go(3);
    } catch {
      setError("Something went wrong creating your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const firstName = (name.trim() || "there").split(" ")[0];

  return (
    <div className="ob">
      <div className="ob-card">
        <Link className="logo" href="/" style={{ marginBottom: "1.4rem" }}>
          <span className="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          BuildSafe
        </Link>
        <div className="prog">
          <i className={step >= 1 ? "on" : undefined} id="p1" />
          <i className={step >= 2 ? "on" : undefined} id="p2" />
          <i className={step >= 3 ? "on" : undefined} id="p3" />
        </div>

        {/* STEP 1: role */}
        <div className={`ob-step${step === 1 ? " on" : ""}`} id="s1">
          <h2>Who are you on the site?</h2>
          <p className="sub" style={{ marginTop: ".6rem" }}>
            Pick your side — your profile and app are built around it. (You can add another role later.)
          </p>
          <div className="roles">
            <button
              type="button"
              className={`role${role === "customer" ? " on" : ""}`}
              aria-pressed={role === "customer"}
              onClick={() => setRole("customer")}
            >
              <span className="ic" style={{ background: "var(--cloud)", color: "var(--navy)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10.5L12 4l9 6.5" />
                  <path d="M5 10v10h14V10" />
                </svg>
              </span>
              <b>I&apos;m a customer</b>
              <span>Hiring a builder or tradie for my home or project</span>
            </button>
            <button
              type="button"
              className={`role${role === "tradie" ? " on" : ""}`}
              aria-pressed={role === "tradie"}
              onClick={() => setRole("tradie")}
            >
              <span className="ic" style={{ background: "var(--osoft)", color: "var(--orange)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a4.5 4.5 0 00-6.4 6.4L3 18v3h3l5.3-5.3a4.5 4.5 0 006.4-6.4L14 13l-3-3z" />
                </svg>
              </span>
              <b>I&apos;m a tradie / subbie</b>
              <span>I work under builders and want to get paid safely</span>
            </button>
            <button
              type="button"
              className={`role${role === "builder" ? " on" : ""}`}
              aria-pressed={role === "builder"}
              onClick={() => setRole("builder")}
            >
              <span className="ic" style={{ background: "var(--csoft)", color: "var(--clear)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="8" width="18" height="12" rx="2" />
                  <path d="M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2M12 12v4" />
                </svg>
              </span>
              <b>I&apos;m a builder</b>
              <span>I hire trades, run projects, and want to prove I&apos;m solid</span>
            </button>
          </div>
          <div className="ob-nav">
            <span />
            <button type="button" className="btn btn-p" id="n1" disabled={!role} onClick={() => go(2)}>
              Continue →
            </button>
          </div>
        </div>

        {/* STEP 2: details (role-tailored) */}
        <div className={`ob-step${step === 2 ? " on" : ""}`} id="s2">
          <h2 id="s2-title">{role ? STEP2_COPY[role][0] : "Your details"}</h2>
          <p className="sub" style={{ margin: ".6rem 0 1.4rem" }} id="s2-sub">
            {role ? STEP2_COPY[role][1] : ""}
          </p>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div className="f2">
              <label>
                Full name
                <input type="text" id="f-name" placeholder="e.g. Parth Chavda" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </label>
              <label>
                Email
                <input type="email" id="f-email" placeholder="you@example.com.au" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </label>
            </div>
            <div className="f2">
              <label>
                Password <span className="hint">— min 8 characters</span>
                <input type="password" id="f-pass" placeholder="Choose a password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </label>
              <label>
                Confirm password
                <input type="password" id="f-pass2" placeholder="Repeat your password" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" />
              </label>
            </div>
            <div className="f2">
              <label>
                Suburb
                <input type="text" id="f-suburb" placeholder="e.g. Clyde North VIC" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
              </label>
              {role !== "customer" && (
                <label id="l-abn">
                  ABN <span className="hint">— verified against ABN Lookup at launch</span>
                  <input type="text" id="f-abn" placeholder="XX XXX XXX XXX" value={abn} onChange={(e) => setAbn(e.target.value)} />
                </label>
              )}
            </div>
            {role === "tradie" && (
              <div id="tradie-extra">
                <label style={{ marginBottom: ".5rem" }}>
                  Your trades <span className="hint">— pick all that apply</span>
                </label>
                <div className="chips" id="trade-chips">
                  {ALL_TRADES.map((t) => (
                    <button
                      type="button"
                      key={t}
                      className={`chip${trades.includes(t) ? " on" : ""}`}
                      aria-pressed={trades.includes(t)}
                      onClick={() => toggle(trades, setTrades, t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="f2" style={{ marginTop: "1rem" }}>
                  <label>
                    Licence / rego # <span className="hint">(if your trade needs one)</span>
                    <input type="text" id="f-lic" placeholder="e.g. VBA / plumbing rego" value={lic} onChange={(e) => setLic(e.target.value)} />
                  </label>
                  <label>
                    Public liability insurance
                    <input type="text" id="f-ins" placeholder="Insurer · amount · expiry" value={ins} onChange={(e) => setIns(e.target.value)} />
                  </label>
                </div>
                <div className="f2" style={{ marginTop: "1rem" }}>
                  <label>
                    Insurance expiry <span className="hint">— we&apos;ll remind you before it lapses</span>
                    <input type="date" id="f-insx" value={insExpiry} onChange={(e) => setInsExpiry(e.target.value)} />
                  </label>
                </div>
              </div>
            )}
            {role === "builder" && (
              <div id="builder-extra">
                <div className="f2">
                  <label>
                    Company name
                    <input type="text" id="f-co" placeholder="e.g. Southpoint Projects Pty Ltd" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </label>
                  <label>
                    Builder licence
                    <input type="text" id="f-blic" placeholder="e.g. VBA DB-U XXXXX" value={builderLic} onChange={(e) => setBuilderLic(e.target.value)} />
                  </label>
                </div>
                <label>
                  What do you build? <span className="hint">— shows on your public profile</span>
                  <div className="chips" id="build-chips">
                    {BUILDS.map((t) => (
                      <button
                        type="button"
                        key={t}
                        className={`chip${builds.includes(t) ? " on" : ""}`}
                        aria-pressed={builds.includes(t)}
                        onClick={() => toggle(builds, setBuilds, t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
            )}
            {role === "customer" && (
              <div id="cust-extra">
                <label>
                  What are you planning?
                  <select id="f-proj" value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                    <option>New home build</option>
                    <option>Renovation / extension</option>
                    <option>Townhouse / development</option>
                    <option>Repairs &amp; small works</option>
                  </select>
                </label>
              </div>
            )}
            {error && (
              <p role="alert" style={{ color: "var(--risk)", fontSize: ".85rem", fontWeight: 500, margin: 0 }}>
                {error}
              </p>
            )}
            <div className="ob-nav">
              <button type="button" className="btn btn-g" onClick={() => go(1)}>
                ← Back
              </button>
              <button type="submit" className="btn btn-p" id="n2" disabled={busy}>
                {busy ? "Creating your account…" : "Continue →"}
              </button>
            </div>
          </form>
        </div>

        {/* STEP 3: done */}
        <div className={`ob-step${step === 3 ? " on" : ""}`} id="s3">
          <div style={{ textAlign: "center", padding: "1rem 0 0" }}>
            <span
              className="av-xl avatar"
              id="done-av"
              style={{ background: "linear-gradient(135deg,var(--orange),var(--orange2))", margin: "0 auto 1.2rem" }}
            >
              {name.trim() ? (
                initials(name.trim())
              ) : (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
            <h2 id="done-h">{role ? DONE_COPY[role].h(firstName) : "Profile created"}</h2>
            <p className="sub" style={{ maxWidth: "44ch", margin: "1rem auto 1.6rem" }} id="done-p">
              {role ? DONE_COPY[role].p : ""}
            </p>
            <div style={{ display: "flex", gap: ".7rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="btn btn-p btn-lg" id="done-cta" href={role ? APP_HREF[role] : "/"}>
                Open my app →
              </Link>
              <Link className="btn btn-g btn-lg" href="/">
                Back to home
              </Link>
            </div>
            <p className="hint" style={{ marginTop: "1.4rem" }}>
              Your account is live and you&apos;re signed in. ABN &amp; licence details are checked against public
              registers before any verification badge is granted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
