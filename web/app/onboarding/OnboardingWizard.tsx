"use client";
/** Onboarding — ported 1:1 from site/onboarding.html (role picker → tailored wizard).
 *  The final step now really registers: POST /api/register → signIn("credentials").
 *  R2 sweep: AUDIT §2 fixes (tokens/classes, fieldsets, .field-error), busy scoping
 *  + error toasts, role-matched photo side panel ≥1024px (MASTER §12), focus moves
 *  to the step heading on step change, and wizard progress persists to localStorage
 *  (SPEC R7 pulled forward) — passwords are never saved. */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "@/components/Toast";
import { initials } from "@/lib/format";
import CategorySearchPicker from "@/components/CategorySearchPicker";
import { CATEGORY_TO_TRADE } from "@/lib/data/categories";

type WizardRole = "customer" | "tradie" | "builder";

const ROLE_IDS: WizardRole[] = ["customer", "tradie", "builder"];

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

/* Wizard progress persistence (SPEC R7, pulled into R2 for this page).
 * Everything EXCEPT passwords — those are never written to localStorage. */
const STORAGE_KEY = "bs.onboarding.v1";
interface SavedState {
  step?: number;
  role?: WizardRole | null;
  name?: string;
  email?: string;
  suburb?: string;
  abn?: string;
  trades?: string[];
  cats?: string[];
  lic?: string;
  ins?: string;
  insExpiry?: string;
  company?: string;
  builderLic?: string;
  builds?: string[];
  projectType?: string;
}

/* Page-scoped layout + rhythm (MASTER §12 auth split: two-column ≥1024px, photo
 * hidden below; §9 note; step-3 shell replaces the old inline styles).
 * `.auth-split` is a promotion candidate for app.css (owned elsewhere) — noted
 * in the R2 sweep report; /login carries the same recipe at 480px. */
const WIZARD_CSS = `
.auth-split{width:min(1180px,94%);display:grid;gap:1.6rem;justify-items:center;justify-content:center}
.auth-side{display:none}
@media(min-width:1080px){
  .auth-split{grid-template-columns:minmax(0,680px) minmax(0,340px);align-items:stretch;justify-items:stretch}
  .auth-side{display:block;min-width:0}
  /* height from the stretched track; drop SitePhoto's inline aspect-ratio so it
     can't derive an intrinsic WIDTH that overflows the column (audit fix). */
  .auth-side .photo{height:100%;width:100%;aspect-ratio:auto!important;overflow:hidden;border-radius:var(--r-7);box-shadow:var(--sh3)}
  .auth-split .ob-card{width:100%}
}
.ob-step .sub{margin:.6rem 0 1.4rem}
.ob-card fieldset{border:0;min-width:0;padding:0;margin:0}
.ob-card legend{padding:0}
.resume-note{margin-bottom:1.2rem;align-items:center}
.resume-note>svg{margin-top:0}
.resume-note>span{flex:1;min-width:0}
.resume-note .link-btn{flex:none;white-space:nowrap}
.resume-note .dismiss{width:28px;height:28px;flex:none;display:grid;place-items:center;border-radius:var(--r-2);color:var(--slate);transition:background var(--t-1),color var(--t-1)}
.resume-note .dismiss:hover{background:rgba(10,27,46,.08);color:var(--ink)}
.resume-note .dismiss svg{width:14px;height:14px;margin:0}
.ob-done{text-align:center;padding-top:1rem}
.ob-done .avatar{margin:0 auto 1.2rem;background:linear-gradient(135deg,var(--orange),var(--orange2))}
.ob-done .sub{max-width:44ch;margin:1rem auto 1.6rem}
.ob-done .actions{justify-content:center}
.ob-done .hint{margin-top:1.4rem}
`;

export interface OnboardingWizardProps {
  initialRole?: WizardRole;
  /** Server-rendered <SitePhoto> per role (SitePhoto reads the fs — server-only). */
  sideArt?: Partial<Record<WizardRole, React.ReactNode>>;
}

export default function OnboardingWizard({ initialRole, sideArt }: OnboardingWizardProps = {}) {
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
  // R5: taxonomy category slugs (index 0 = primary) — source of truth for tradies.
  const [cats, setCats] = useState<string[]>([]);
  const [lic, setLic] = useState("");
  const [ins, setIns] = useState("");
  const [insExpiry, setInsExpiry] = useState("");
  const [company, setCompany] = useState("");
  const [builderLic, setBuilderLic] = useState("");
  const [builds, setBuilds] = useState<string[]>([]);
  const [projectType, setProjectType] = useState("New home build");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resumed, setResumed] = useState(false);

  /* -------- keyboard/a11y: on step change, move focus to the step heading -------- */
  const stepHeadings = useRef<Record<number, HTMLHeadingElement | null>>({});
  const focusPending = useRef(false);

  function go(n: number) {
    focusPending.current = true;
    setStep(n);
    // html{scroll-behavior:smooth} + the reduced-motion media query make this
    // smooth normally and instant under prefers-reduced-motion.
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    stepHeadings.current[step]?.focus({ preventScroll: true });
  }, [step]);

  /* -------- persistence: restore on mount… -------- */
  const hydrated = useRef(false);
  useEffect(() => {
    // localStorage can't feed useState initializers here: it would render
    // differently from the SSR HTML and break hydration. Restoring after
    // mount is the sanctioned external-store sync; one batched pass.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as SavedState;
        const savedRole = s.role && ROLE_IDS.includes(s.role) ? s.role : null;
        const strings = [s.name, s.email, s.suburb, s.abn, s.lic, s.ins, s.insExpiry, s.company, s.builderLic];
        const meaningful =
          !!savedRole ||
          strings.some((v) => typeof v === "string" && v.trim() !== "") ||
          (Array.isArray(s.trades) && s.trades.length > 0) ||
          (Array.isArray(s.cats) && s.cats.length > 0) ||
          (Array.isArray(s.builds) && s.builds.length > 0);
        if (meaningful) {
          if (typeof s.name === "string") setName(s.name);
          if (typeof s.email === "string") setEmail(s.email);
          if (typeof s.suburb === "string") setSuburb(s.suburb);
          if (typeof s.abn === "string") setAbn(s.abn);
          if (Array.isArray(s.trades)) setTrades(s.trades.filter((t): t is string => typeof t === "string"));
          if (Array.isArray(s.cats)) setCats(s.cats.filter((t): t is string => typeof t === "string"));
          if (typeof s.lic === "string") setLic(s.lic);
          if (typeof s.ins === "string") setIns(s.ins);
          if (typeof s.insExpiry === "string") setInsExpiry(s.insExpiry);
          if (typeof s.company === "string") setCompany(s.company);
          if (typeof s.builderLic === "string") setBuilderLic(s.builderLic);
          if (Array.isArray(s.builds)) setBuilds(s.builds.filter((b): b is string => typeof b === "string"));
          if (typeof s.projectType === "string" && s.projectType) setProjectType(s.projectType);
          // An explicit ?role= CTA wins over the saved role.
          if (!initialRole && savedRole) setRole(savedRole);
          if (s.step === 2 && (initialRole ?? savedRole)) setStep(2);
          setResumed(true);
        }
      }
    } catch {
      /* corrupt JSON or storage blocked — start fresh */
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    hydrated.current = true;
    // mount-only: initialRole is fixed for the page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- …save on every change (never after the done step) -------- */
  useEffect(() => {
    if (!hydrated.current || step === 3) return;
    try {
      const s: SavedState = {
        step, role, name, email, suburb, abn, trades, cats, lic, ins, insExpiry,
        company, builderLic, builds, projectType,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* storage full/blocked — persistence is best-effort */
    }
  }, [step, role, name, email, suburb, abn, trades, cats, lic, ins, insExpiry, company, builderLic, builds, projectType]);

  function clearSaved() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function startOver() {
    clearSaved();
    setResumed(false);
    setError("");
    setStep(1);
    setRole(initialRole ?? null);
    setName(""); setEmail(""); setPassword(""); setPassword2("");
    setSuburb(""); setAbn(""); setTrades([]); setCats([]); setLic(""); setIns(""); setInsExpiry("");
    setCompany(""); setBuilderLic(""); setBuilds([]); setProjectType("New home build");
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
        // R5: send taxonomy slugs; keep legacy trade names populated for old surfaces.
        profile.categorySlugs = cats;
        profile.trades = [
          ...new Set(cats.map((s) => CATEGORY_TO_TRADE[s]).filter(Boolean)),
        ];
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
        const msg = data?.error ?? "Something went wrong creating your account. Please try again.";
        setError(msg);
        toast(msg, { kind: "error" });
        return;
      }

      // Account exists now — the saved wizard state is spent either way.
      clearSaved();
      setResumed(false);

      const signed = await signIn("credentials", { email: email.trim(), password, redirect: false });
      if (signed?.error) {
        setError("Account created — please sign in at the login page.");
        toast("Account created — please sign in", { kind: "error" });
        return;
      }
      toast("Account created — you're signed in");
      go(3);
    } catch {
      setError("Something went wrong creating your account. Please try again.");
      toast("Something went wrong creating your account", { kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  const firstName = (name.trim() || "there").split(" ")[0];

  return (
    <div className="ob">
      <style>{WIZARD_CSS}</style>
      <div className="auth-split">
        <div className="ob-card">
          <Link className="logo" href="/">
            <span className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            BuildSafe
          </Link>
          <div className="prog" role="list" aria-label={`Onboarding progress: step ${step} of 3`}>
            {[1, 2, 3].map((n) => (
              <i
                key={n}
                id={`p${n}`}
                role="listitem"
                aria-label={`Step ${n} of 3`}
                aria-current={step === n ? "step" : undefined}
                className={step >= n ? "on" : undefined}
              />
            ))}
          </div>

          {resumed && step < 3 && (
            <div className="note info resume-note" role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <span>Resume where you left off? We restored your earlier answers — passwords are never saved.</span>
              <button type="button" className="link-btn" onClick={startOver}>
                Start over
              </button>
              <button type="button" className="dismiss" aria-label="Dismiss this message" onClick={() => setResumed(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* STEP 1: role */}
          <div className={`ob-step${step === 1 ? " on" : ""}`} id="s1">
            <h2 tabIndex={-1} ref={(el) => { stepHeadings.current[1] = el; }}>
              Who are you on the site?
            </h2>
            <p className="sub">
              Pick your side — your profile and app are built around it. (You can add another role later.)
            </p>
            <div className="roles">
              <button
                type="button"
                className={`role${role === "customer" ? " on" : ""}`}
                aria-pressed={role === "customer"}
                onClick={() => setRole("customer")}
              >
                <span className="ic navy">
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
                <span className="ic pro">
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
                <span className="ic ok">
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
            <h2 id="s2-title" tabIndex={-1} ref={(el) => { stepHeadings.current[2] = el; }}>
              {role ? STEP2_COPY[role][0] : "Your details"}
            </h2>
            <p className="sub" id="s2-sub">
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
                <div id="tradie-extra" className="form">
                  <fieldset id="trade-chips">
                    <legend className="field-legend">
                      Your trades <span className="hint">— search and add all that apply</span>
                    </legend>
                    <CategorySearchPicker
                      label="Search your trades"
                      value={cats}
                      onChange={(slugs) => setCats(slugs)}
                    />
                  </fieldset>
                  <div className="f2">
                    <label>
                      Licence / rego # <span className="hint">(if your trade needs one)</span>
                      <input type="text" id="f-lic" placeholder="e.g. VBA / plumbing rego" value={lic} onChange={(e) => setLic(e.target.value)} />
                    </label>
                    <label>
                      Public liability insurance
                      <input type="text" id="f-ins" placeholder="Insurer · amount · expiry" value={ins} onChange={(e) => setIns(e.target.value)} />
                    </label>
                  </div>
                  <div className="f2">
                    <label>
                      Insurance expiry <span className="hint">— we&apos;ll remind you before it lapses</span>
                      <input type="date" id="f-insx" value={insExpiry} onChange={(e) => setInsExpiry(e.target.value)} />
                    </label>
                  </div>
                </div>
              )}
              {role === "builder" && (
                <div id="builder-extra" className="form">
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
                  <fieldset>
                    <legend className="field-legend">
                      What do you build? <span className="hint">— shows on your public profile</span>
                    </legend>
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
                  </fieldset>
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
                <p className="field-error" role="alert">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                  {error}
                </p>
              )}
              <div className="ob-nav">
                <button type="button" className="btn btn-g" onClick={() => go(1)}>
                  ← Back
                </button>
                <button
                  type="submit"
                  className={`btn btn-p${busy ? " busy" : ""}`}
                  id="n2"
                  disabled={busy}
                  aria-busy={busy || undefined}
                >
                  {busy ? "Creating your account…" : "Continue →"}
                </button>
              </div>
            </form>
          </div>

          {/* STEP 3: done */}
          <div className={`ob-step${step === 3 ? " on" : ""}`} id="s3">
            <div className="ob-done">
              <span className="av-xl avatar" id="done-av">
                {name.trim() ? (
                  initials(name.trim())
                ) : (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </span>
              <h2 id="done-h" tabIndex={-1} ref={(el) => { stepHeadings.current[3] = el; }}>
                {role ? DONE_COPY[role].h(firstName) : "Profile created"}
              </h2>
              <p className="sub" id="done-p">
                {role ? DONE_COPY[role].p : ""}
              </p>
              <div className="actions">
                <Link className="btn btn-p btn-lg" id="done-cta" href={role ? APP_HREF[role] : "/"}>
                  Open my app →
                </Link>
                <Link className="btn btn-g btn-lg" href="/">
                  Back to home
                </Link>
              </div>
              <p className="hint">
                Your account is live and you&apos;re signed in. ABN &amp; licence details are checked against public
                registers before any verification badge is granted.
              </p>
            </div>
          </div>
        </div>

        {sideArt ? <aside className="auth-side">{sideArt[role ?? "customer"] ?? null}</aside> : null}
      </div>
    </div>
  );
}
