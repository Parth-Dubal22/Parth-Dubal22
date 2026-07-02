"use client";
/** Sign-in — minimal card consistent with the onboarding design system. */
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

export default function LoginForm() {
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
        setError("That email and password don't match an account. Check them and try again.");
        return;
      }
      const session = await getSession();
      const role = session?.user?.role ?? "";
      toast("Signed in");
      router.push(HOME_BY_ROLE[role] ?? "/");
      router.refresh();
    } catch {
      setError("Something went wrong signing you in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ob">
      <div className="ob-card" style={{ width: "min(480px,92%)" }}>
        <Link className="logo" href="/" style={{ marginBottom: "1.4rem" }}>
          <span className="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          BuildSafe
        </Link>
        <h2>Sign in</h2>
        <p className="sub" style={{ margin: ".6rem 0 1.4rem" }}>
          Your watchlists, alerts and profile are waiting.
        </p>
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
            <p role="alert" style={{ color: "var(--risk)", fontSize: ".85rem", fontWeight: 500, margin: 0 }}>
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-p btn-lg" disabled={busy}>
            {busy ? "Signing in…" : "Sign in →"}
          </button>
        </form>
        <div
          style={{
            background: "var(--mist)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: "1rem 1.1rem",
            marginTop: "1.4rem",
          }}
        >
          <p className="hint" style={{ fontWeight: 600, marginBottom: ".4rem" }}>
            Demo logins — password <span className="mono">demo1234</span>
          </p>
          <ul style={{ listStyle: "none", display: "grid", gap: ".25rem" }}>
            {DEMO_LOGINS.map((d) => (
              <li key={d.email}>
                <button
                  type="button"
                  className="mono"
                  style={{ fontSize: ".74rem", color: "var(--slate)", padding: ".1rem 0" }}
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
        <p className="hint" style={{ marginTop: "1.2rem" }}>
          New here? <Link href="/onboarding" style={{ color: "var(--orange)", fontWeight: 600 }}>Create your profile →</Link>
        </p>
      </div>
    </div>
  );
}
