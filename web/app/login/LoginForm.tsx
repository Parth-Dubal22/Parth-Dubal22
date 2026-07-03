"use client";
/** Sign-in — minimal card consistent with the onboarding design system.
 *  R2 sweep: AUDIT §1 fixes (tokens/classes instead of inline styles), busy
 *  scoping + error toast on the submit, photo side panel ≥1024px (MASTER §12). */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { toast } from "@/components/Toast";

const HOME_BY_ROLE: Record<string, string> = {
  customer: "/customer",
  tradie: "/tradie",
  builder: "/builder",
  admin: "/admin",
};

const DEMO_LOGINS: { label: string; email: string }[] = [
  { label: "Tradie", email: "tradie@demo.buildsafe" },
  { label: "Builder", email: "builder@demo.buildsafe" },
  { label: "Customer", email: "customer@demo.buildsafe" },
  { label: "Admin", email: "admin@demo.buildsafe" },
];

/* Page-scoped layout (MASTER §12 auth: two-column ≥1024px, photo hidden below).
 * `.auth-split` is a candidate for promotion into app.css once another auth-style
 * page needs it — noted in the R2 sweep report; app.css is owned elsewhere. */
const AUTH_CSS = `
.auth-split{width:min(1120px,94%);display:grid;gap:1.6rem;justify-items:center;justify-content:center}
.auth-side{display:none}
@media(min-width:1024px){
  .auth-split{grid-template-columns:minmax(0,480px) minmax(280px,360px);align-items:stretch;justify-items:stretch}
  .auth-side{display:block}
  .auth-side .photo{height:100%;border-radius:var(--r-7);box-shadow:var(--sh3)}
  .auth-split .ob-card{width:100%}
}
.ob-card .sub{margin:.6rem 0 1.4rem}
.auth-submit{min-width:176px;justify-content:center}
.demo-box{margin-top:1.4rem}
.demo-box ul{list-style:none;display:grid;gap:.25rem}
.auth-foot{margin-top:1.2rem}
`;

export default function LoginForm({ side }: { side?: React.ReactNode } = {}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const res = await signIn("credentials", { email: email.trim(), password, redirect: false });
      if (res?.error) {
        const msg = "That email and password don't match an account. Check them and try again.";
        setError(msg);
        toast("Sign-in failed — check your details", { kind: "error" });
        return;
      }
      const session = await getSession();
      const role = session?.user?.role ?? "";
      toast("Signed in");
      router.push(HOME_BY_ROLE[role] ?? "/");
      router.refresh();
    } catch {
      setError("Something went wrong signing you in. Please try again.");
      toast("Could not sign you in — please try again", { kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ob">
      <style>{AUTH_CSS}</style>
      <div className="auth-split">
        <div className="ob-card narrow">
          <Link className="logo" href="/">
            <span className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            BuildSafe
          </Link>
          <h2>Sign in</h2>
          <p className="sub">Your watchlists, alerts and profile are waiting.</p>
          <form className="form" onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                id="f-email"
                placeholder="you@example.com.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                id="f-pass"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
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
            <button
              type="submit"
              className={`btn btn-p btn-lg auth-submit${busy ? " busy" : ""}`}
              disabled={busy}
              aria-busy={busy || undefined}
            >
              {busy ? "Signing in…" : "Sign in →"}
            </button>
          </form>
          <div className="card flat demo-box">
            <p className="field-legend">
              Demo logins — password <span className="mono">demo1234</span>
            </p>
            <ul>
              {DEMO_LOGINS.map((d) => (
                <li key={d.email}>
                  <button
                    type="button"
                    className="link-btn"
                    aria-label={`Fill the form with the ${d.label} demo login`}
                    onClick={() => {
                      setEmail(d.email);
                      setPassword("demo1234");
                      setError("");
                    }}
                  >
                    {d.label}: {d.email}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <p className="hint auth-foot">
            New here? <Link href="/onboarding" className="link-accent">Create your profile →</Link>
          </p>
        </div>
        {side ? <aside className="auth-side">{side}</aside> : null}
      </div>
    </div>
  );
}
