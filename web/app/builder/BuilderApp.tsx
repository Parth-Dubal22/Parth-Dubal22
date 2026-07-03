"use client";
/** Builder app shell — ported 1:1 from site/app-builder.html.
 *  Panels: Overview · Post a job · My jobs & applicants · Profile & verification · Reviews.
 *  All mutations go through the API routes (see API_CONTRACT.md).
 *  R2: per-action busy keys (no global freeze), token-clean styles, EmptyState
 *  zero-states, error-kind toasts on every mutation failure. */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";
import Stars from "@/components/Stars";
import EmptyState from "@/components/EmptyState";
import { ALL_TRADES } from "@/lib/format";

export type Pill = { label: string; cls: string };

export type BuilderVM = {
  companyName: string;
  companyInitials: string;
  slug: string;
  abnFormatted: string;
  licenceLine: string;
  licenceStatus: string;
  locationLine: string;
  tier: "none" | "id_verified" | "buildsafe_verified" | "track_record";
  tierRank: number;
  tierLabel: string;
  ratingText: string;
  reviewCount: number;
  tier3Pct: number;
  statusLabel: string;
  statusCls: string;
  kpiCls: string;
  lastChecked: string;
  canSee: boolean;
  kpis: { openJobs: number; newApplicants: number };
  ownSignals: { id: number; date: string; title: string; pill: Pill; sourceName: string; sourceUrl: string | null }[];
  clientsIntro: string;
  clients: {
    companyId: number;
    name: string;
    initials: string;
    avatarBg: string;
    sub2: string;
    src: { title: string; name: string; url: string | null; date: string } | null;
    pill: Pill | null;
  }[];
  subbies: { id: number; name: string; initials: string; avatarBg: string; sub2: string; pill: Pill }[];
  jobs: {
    id: number;
    title: string;
    loc: string;
    start: string;
    dur: string;
    rate: string;
    status: string;
    apps: { id: number; tradieUserId: number; status: string; name: string; initials: string; sub2: string }[];
  }[];
  reviews: { id: number; name: string; initials: string; roleLabel: string; rating: number; text: string; reply: string | null }[];
  availableTradies: { name: string; initials: string; sub2: string }[];
  paySummary: { b: string; s: string };
  pendingTiers: string[];
};

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

/* 12px check for inline pill status (replaces the "✓" glyph) */
const CHECK_S = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

/* 14px star for rating figures (replaces the "★" glyph) */
const STAR = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--star)" aria-hidden="true">
    <path d="M12 17.3l-5.9 3.5 1.5-6.7L2.5 9.6l6.8-.6L12 2.7l2.7 6.3 6.8.6-5.1 4.5 1.5 6.7z" />
  </svg>
);

/* 16px plus for add actions (replaces the "＋" glyph) */
const PLUS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/* 14px direction arrows for the watch headings (replace "↑"/"↓" text arrows) */
const ARROW_UP = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);
const ARROW_DOWN = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
);

const TABS: { id: string; label: string; icon: React.ReactNode }[] = [
  {
    id: "b-dash",
    label: "Overview",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="8" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
        <rect x="13" y="13" width="8" height="8" rx="2" />
      </svg>
    ),
  },
  {
    id: "b-post",
    label: "Post a job",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    id: "b-jobs",
    label: "My jobs & applicants",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    ),
  },
  {
    id: "b-verify",
    label: "Profile & verification",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "b-rev",
    label: "Reviews",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M12 17l-5 3 1-5.6L4 10l5.7-.8L12 4l2.3 5.2L20 10l-4 4.4L17 20z" />
      </svg>
    ),
  },
];

const TIER_CARDS: { n: number; key: "id_verified" | "buildsafe_verified" | "track_record"; title: string; criteria: string[] }[] = [
  {
    n: 1,
    key: "id_verified",
    title: "Identity Verified",
    criteria: ["ABN matches the registered entity", "Builder licence confirmed with VBA", "Director identity documents validated"],
  },
  {
    n: 2,
    key: "buildsafe_verified",
    title: "BuildSafe Verified",
    criteria: [
      "Tier 1 held & current",
      "Insurance certificate sighted & current",
      "12 months of clean public records",
      "Re-checked monthly — revoked instantly if criteria lapse",
    ],
  },
  {
    n: 3,
    key: "track_record",
    title: "Verified + Track Record",
    criteria: [
      "Tier 2 held & current",
      "50+ verified reviews",
      "Includes subbie payment ratings",
      "Re-checked monthly — revoked instantly if criteria lapse",
    ],
  },
];

async function api(url: string, method: string, body?: unknown): Promise<{ ok?: boolean; error?: string; [k: string]: unknown }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return (await res.json()) as { ok?: boolean; error?: string };
  } catch {
    return { ok: false, error: "Network error — please try again" };
  }
}

export default function BuilderApp({ vm }: { vm: BuilderVM }) {
  const router = useRouter();
  const [tab, setTab] = useState("b-dash");
  const [sideOpen, setSideOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  /* Per-action busy keys (MASTER §4): one in-flight mutation never freezes
   * another action's button; double-submit stays guarded per key. */
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});
  const isBusy = (key: string) => Boolean(busyMap[key]);
  async function withBusy(key: string, fn: () => Promise<void>) {
    if (busyMap[key]) return; // double-submit guard, scoped to this action
    setBusyMap((b) => ({ ...b, [key]: true }));
    try {
      await fn();
    } finally {
      setBusyMap((b) => {
        const next = { ...b };
        delete next[key];
        return next;
      });
    }
  }
  /** Busy props for the button that fires `key` (spinner + disabled + aria-busy). */
  const busyBtn = (key: string, base: string) => ({
    className: `${base}${isBusy(key) ? " busy" : ""}`,
    disabled: isBusy(key),
    "aria-busy": isBusy(key) || undefined,
  });

  function go(id: string) {
    setTab(id);
    setSideOpen(false);
    window.scrollTo({ top: 0 });
  }

  function closeSide() {
    setSideOpen(false);
    burgerRef.current?.focus();
  }

  /* Mobile drawer contract (MASTER §7): Escape closes, body scroll locked, focus returns to burger. */
  useEffect(() => {
    if (!sideOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSideOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [sideOpen]);

  /* ---- post a job → POST /api/jobs ---- */
  async function submitJob(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    await withBusy("job:post", async () => {
      const d = await api("/api/jobs", "POST", {
        title: String(fd.get("title") ?? "").trim(),
        type: String(fd.get("type")) === "Subcontract package" ? "subcontract" : "day_hire",
        rate: String(fd.get("rate") ?? "").trim(),
        location: String(fd.get("location") ?? "").trim(),
        startText: String(fd.get("start") ?? "").trim(),
        duration: String(fd.get("duration") ?? "").trim() || "—",
        requirement: String(fd.get("requirement") ?? "").trim() || undefined,
        trade: String(fd.get("trade") ?? "").trim() || undefined,
      });
      if (d.ok) {
        form.reset();
        toast(`Job published — live on the tradie board with your ${vm.statusLabel} status`);
        router.refresh();
        go("b-jobs");
      } else {
        toast(d.error || "Could not publish the job", { kind: "error" });
      }
    });
  }

  /* ---- upward watchlist (clients/developers) → /api/watchlist kind:'client' ---- */
  async function addClientWatch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = String(new FormData(form).get("q") ?? "").trim();
    if (!q) return;
    const digits = q.replace(/\D/g, "");
    await withBusy("watch:add", async () => {
      const d = await api(
        "/api/watchlist",
        "POST",
        digits.length === 11 ? { abn: digits, kind: "client" } : { name: q, kind: "client" },
      );
      if (d.ok) {
        form.reset();
        toast(`${q} added to your watchlist — monitoring public records from now on`);
        router.refresh();
      } else {
        toast(d.error || "Could not add to your watchlist", { kind: "error" });
      }
    });
  }

  async function removeWatch(companyId: number, name: string) {
    await withBusy(`watch:${companyId}`, async () => {
      const d = await api(`/api/watchlist?companyId=${companyId}`, "DELETE");
      if (d.ok) {
        toast(`${name} removed from your watchlist`);
        router.refresh();
      } else {
        toast(d.error || "Could not remove from your watchlist", { kind: "error" });
      }
    });
  }

  /* ---- Builder Pro upsell (only when risk detail is locked) ---- */
  async function upgrade() {
    await withBusy("billing:upgrade", async () => {
      const d = await api("/api/billing/checkout", "POST", { plan: "builder_pro" });
      if (d.ok && typeof d.url === "string" && d.url) {
        window.location.href = d.url;
      } else if (d.ok) {
        toast("Builder Pro active — no lock-in, cancel anytime");
        router.refresh();
      } else {
        toast(d.error || "Could not start checkout", { kind: "error" });
      }
    });
  }

  /* ---- verification apply → POST /api/builder/verification-request ---- */
  async function applyTier(tier: string) {
    await withBusy(`tier:${tier}`, async () => {
      const d = await api("/api/builder/verification-request", "POST", { tier });
      if (d.ok) {
        toast("Application submitted — reviewed against the published criteria, badge re-checked monthly");
        router.refresh();
      } else {
        toast(d.error || "Could not submit the application", { kind: "error" });
      }
    });
  }

  /* ---- accept an applicant → status 'contacted' + add to subbie panel ---- */
  async function acceptApplicant(appId: number, name: string) {
    await withBusy(`applicant:${appId}`, async () => {
      const d = await api(`/api/applications/${appId}`, "POST", { action: "accept" });
      if (d.ok) {
        toast(`${name} accepted — contact details unlocked and added to your subbie panel`);
        router.refresh();
      } else {
        toast(d.error || "Could not accept the applicant", { kind: "error" });
      }
    });
  }

  /* ---- builder → tradie review → POST /api/reviews (subjectUserId) ---- */
  const [reviewFor, setReviewFor] = useState<number | null>(null);
  async function submitTradieReview(e: React.FormEvent<HTMLFormElement>, appId: number, tradieUserId: number, name: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const rating = Number(fd.get("rating"));
    const text = String(fd.get("text") ?? "").trim();
    if (!text) return;
    await withBusy(`review:${appId}`, async () => {
      const d = await api("/api/reviews", "POST", { subjectUserId: tradieUserId, rating, text, authorRole: "builder" });
      if (d.ok) {
        setReviewFor(null);
        toast(`Review posted for ${name}`);
        router.refresh();
      } else {
        toast(d.error || "Could not post the review", { kind: "error" });
      }
    });
  }

  /* ---- reply publicly → POST /api/reviews/[id]/reply ---- */
  async function submitReply(e: React.FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault();
    const form = e.currentTarget;
    const reply = String(new FormData(form).get("reply") ?? "").trim();
    if (!reply) return;
    await withBusy(`reply:${id}`, async () => {
      const d = await api(`/api/reviews/${id}/reply`, "POST", { reply });
      if (d.ok) {
        form.reset();
        toast("Reply posted publicly under the review");
        router.refresh();
      } else {
        toast(d.error || "Could not post the reply", { kind: "error" });
      }
    });
  }

  function tierPill(n: number, key: string): Pill {
    if (vm.tierRank > n) return { label: `TIER ${n} · DONE`, cls: "navy" };
    if (vm.tierRank === n) return { label: `TIER ${n} · ACTIVE`, cls: "ok" };
    if (vm.pendingTiers.includes(key)) return { label: `TIER ${n} · PENDING REVIEW`, cls: "watch" };
    if (n === 3) return { label: `TIER 3 · ${vm.tier3Pct}%`, cls: "watch" };
    return { label: `TIER ${n} · NEXT`, cls: "watch" };
  }

  return (
    <>
      <div className="appbar">
        <button
          id="appburger"
          ref={burgerRef}
          className="burger"
          aria-label="Menu"
          aria-expanded={sideOpen}
          onClick={() => setSideOpen((o) => !o)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <b>BuildSafe · Builder</b>
        <Link href="/" className="exit">
          EXIT
        </Link>
      </div>

      <div className="app">
        {sideOpen && <button className="side-scrim" aria-label="Close menu" onClick={closeSide} />}
        <aside className={`side${sideOpen ? " open" : ""}`}>
          <Link className="logo" href="/">
            <span className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            BuildSafe
          </Link>
          <span className="role">BUILDER APP</span>
          {TABS.map((t) => (
            <button key={t.id} className={`sbtn${tab === t.id ? " on" : ""}`} onClick={() => go(t.id)} aria-current={tab === t.id ? "page" : undefined}>
              {t.icon}
              {t.label}
            </button>
          ))}
          <div className="me">
            <span className="avatar" style={{ background: "var(--av-1)" }}>{vm.companyInitials}</span>
            <div>
              <b>{vm.companyName}</b>
              <span>{vm.licenceLine}</span>
            </div>
          </div>
        </aside>

        <main className="main">
          {/* OVERVIEW */}
          <div className={`panel${tab === "b-dash" ? " on" : ""}`} id="b-dash">
            <div className="topbar">
              <h2>Overview</h2>
              {vm.tier !== "none" && (
                <span className="vbadge">
                  {CHECK}
                  {vm.tierLabel}
                </span>
              )}
            </div>
            <div className="kpis">
              <div className="kpi">
                <small>Your public status</small>
                <b className={vm.kpiCls}>{vm.statusLabel}</b>
              </div>
              <div className="kpi">
                <small>Profile rating</small>
                <b>{vm.ratingText} {STAR}</b>
              </div>
              <div className="kpi">
                <small>Open job posts</small>
                <b className="or" id="bk-jobs">{vm.kpis.openJobs}</b>
              </div>
              <div className="kpi">
                <small>New applicants</small>
                <b id="bk-apps">{vm.kpis.newApplicants}</b>
              </div>
            </div>
            <div className="stack">
              <div className="grid2">
                <div className="card">
                  <h3>Watching your clients {ARROW_UP}</h3>
                  <p>{vm.clientsIntro}</p>
                  <div className="list" style={{ marginTop: ".9rem" }}>
                    {vm.clients.map((c) => (
                      <div
                        key={c.companyId}
                        className={`item flat${c.pill?.cls === "risk" ? " alertcard" : c.pill?.cls === "watch" ? " alertcard w" : ""}`}
                      >
                        <span className="avatar" style={{ background: c.avatarBg }}>{c.initials}</span>
                        <div className="grow">
                          <b>{c.name}</b>
                          <span className="sub2">{c.sub2}</span>
                          {c.src && (
                            <div className="srcline">
                              New: {c.src.title} —{" "}
                              {c.src.url ? (
                                <a href={c.src.url} target="_blank" rel="noreferrer">
                                  {c.src.name} · {c.src.date}
                                </a>
                              ) : (
                                <span>
                                  {c.src.name} · {c.src.date}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {c.pill && <span className={`pill ${c.pill.cls}`}>{c.pill.label}</span>}
                        <button
                          {...busyBtn(`watch:${c.companyId}`, "btn btn-g btn-s")}
                          onClick={() => removeWatch(c.companyId, c.name)}
                          aria-label={`Stop watching ${c.name}`}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {vm.clients.length === 0 && (
                      <EmptyState
                        headline="No clients watched yet"
                        body="Add the developers and clients you build for below — monitoring runs continuously."
                      />
                    )}
                  </div>
                  {vm.clients.some((c) => c.pill?.cls === "risk") && (
                    <button
                      className="btn btn-g btn-s"
                      style={{ marginTop: ".9rem" }}
                      onClick={() => toast("Demo: tighten terms — invoice weekly, pause variations, get advice")}
                    >
                      What can I do? →
                    </button>
                  )}
                  {!vm.canSee && (
                    <div style={{ marginTop: ".9rem" }}>
                      <div className="hint">
                        Risk detail on watched companies (signals, status, exposure) is private to subscribers. Builder Pro is
                        $99/mo — no lock-in, cancel anytime.
                      </div>
                      <button {...busyBtn("billing:upgrade", "btn btn-p btn-s")} style={{ marginTop: ".6rem" }} onClick={upgrade}>
                        Unlock risk alerts →
                      </button>
                    </div>
                  )}
                  <form className="form" style={{ marginTop: ".9rem" }} onSubmit={addClientWatch}>
                    <label>
                      Add a developer / client
                      <input type="text" name="q" placeholder="Company name or ABN" />
                    </label>
                    <div className="actions">
                      <button {...busyBtn("watch:add", "btn btn-g btn-s")}>
                        {PLUS} Watch
                      </button>
                    </div>
                  </form>
                </div>
                <div className="card">
                  <h3>Watching your subbie panel {ARROW_DOWN}</h3>
                  <p>Licences &amp; insurance auto-tracked so nothing lapses mid-project:</p>
                  <div className="list" style={{ marginTop: ".9rem" }}>
                    {vm.subbies.map((s) => (
                      <div key={s.id} className="item flat">
                        <span className="avatar" style={{ background: s.avatarBg }}>{s.initials}</span>
                        <div className="grow">
                          <b>{s.name}</b>
                          <span className="sub2">{s.sub2}</span>
                        </div>
                        <span className={`pill ${s.pill.cls}`}>{s.pill.label}</span>
                      </div>
                    ))}
                    {vm.subbies.length === 0 && (
                      <EmptyState
                        headline="No subbies on your panel yet"
                        body="They're added automatically when you accept applicants."
                        cta={
                          <button className="btn btn-g btn-s" onClick={() => go("b-jobs")}>
                            Review applicants →
                          </button>
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="card">
                <h3>Your company health</h3>
                <p>
                  Your own view of what BuildSafe monitors against ABN {vm.abnFormatted} — facts from public records, every
                  signal cites its source. Licence {vm.licenceLine} · {vm.licenceStatus} · last checked {vm.lastChecked}.
                </p>
                <div className="list" style={{ marginTop: ".9rem" }}>
                  {vm.ownSignals.map((s) => (
                    <div key={s.id} className="item flat">
                      <div className="grow">
                        <b>{s.title}</b>
                        <span className="sub2">{s.date}</span>
                        <div className="srcline">
                          Source:{" "}
                          {s.sourceUrl ? (
                            <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                              {s.sourceName}
                            </a>
                          ) : (
                            s.sourceName
                          )}
                        </div>
                      </div>
                      <span className={`pill ${s.pill.cls}`}>{s.pill.label}</span>
                    </div>
                  ))}
                  {vm.ownSignals.length === 0 && (
                    <EmptyState
                      headline="No signals on record"
                      body="No approved signals on record for your ABN."
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* POST A JOB */}
          <div className={`panel${tab === "b-post" ? " on" : ""}`} id="b-post">
            <div className="topbar">
              <h2>Post a job</h2>
              <span className="hint">Flat fee per post at launch — never per lead</span>
            </div>
            <div className="stack">
              {vm.availableTradies.length > 0 && (
                <div className="card wrap-narrow">
                  <h3>
                    Available now{" "}
                    <span className="pill ok">{vm.availableTradies.length} ready for day work</span>
                  </h3>
                  <p className="hint" style={{ margin: ".2rem 0 .8rem" }}>
                    Tradies who flipped on their Available Now toggle. Post a day-hire job and they can one-tap apply.
                  </p>
                  <div className="list">
                    {vm.availableTradies.map((t, i) => (
                      <div key={i} className="item flat">
                        <span className="avatar" style={{ background: "var(--orange)" }}>{t.initials}</span>
                        <div className="grow">
                          <b>{t.name}</b>
                          <span className="sub2">{t.sub2}</span>
                        </div>
                        <span className="pill ok">AVAILABLE</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <form className="form card wrap-narrow" id="post-form" onSubmit={submitJob}>
                <label>
                  Job title
                  <input type="text" name="title" placeholder="e.g. Wall & floor tiler — 3 bathrooms" required />
                </label>
                <div className="f2">
                  <label>
                    Type
                    <select name="type" defaultValue="Day hire">
                      <option>Day hire</option>
                      <option>Subcontract package</option>
                    </select>
                  </label>
                  <label>
                    Rate / value
                    <input type="text" name="rate" placeholder="e.g. $620/day or $8,400 quote" required />
                  </label>
                </div>
                <div className="f2">
                  <label>
                    Location
                    <input type="text" name="location" placeholder="Suburb, state" required />
                  </label>
                  <label>
                    Start
                    <input type="text" name="start" placeholder="e.g. Monday / This week" required />
                  </label>
                </div>
                <div className="f2">
                  <label>
                    Duration
                    <input type="text" name="duration" placeholder="e.g. 3 days / 2 weeks" />
                  </label>
                  <label>
                    Trade
                    <select name="trade" defaultValue="">
                      <option value="">Select a trade…</option>
                      {ALL_TRADES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Requirements
                  <input type="text" name="requirement" placeholder="e.g. Own tools, white card" />
                </label>
                <div className="hint">
                  Your BuildSafe status (
                  <span className={`pill ${vm.statusCls}`}>{vm.statusLabel}</span>
                  ) is shown on the post automatically — that&rsquo;s why good tradies answer fast.
                </div>
                <div className="actions">
                  <button {...busyBtn("job:post", "btn btn-p btn-lg")}>
                    Publish job →
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* MY JOBS */}
          <div className={`panel${tab === "b-jobs" ? " on" : ""}`} id="b-jobs">
            <div className="topbar">
              <h2>My jobs &amp; applicants</h2>
            </div>
            <div className="list" id="myjobs">
              {vm.jobs.map((j) => (
                <div key={j.id} className="jobcard">
                  <div className="top">
                    <div>
                      <h4>{j.title}</h4>
                      <div className="meta">
                        <span>{j.loc}</span>
                        <span>Starts {j.start}</span>
                        <span>{j.dur}</span>
                        {j.status === "closed" && <span className="pill navy">CLOSED</span>}
                      </div>
                    </div>
                    <span className="rate">{j.rate}</span>
                  </div>
                  <div style={{ marginTop: "var(--s4)" }}>
                    <span className="mini-h">APPLICANTS ({j.apps.length})</span>
                    <div className="list" style={{ marginTop: ".6rem" }}>
                      {j.apps.map((a) => (
                        <div key={a.id}>
                          <div className="item flat">
                            <span className="avatar" style={{ background: "var(--av-1)" }}>{a.initials}</span>
                            <div className="grow">
                              <b>{a.name}</b>
                              <span className="sub2">{a.sub2}</span>
                            </div>
                            {a.status === "contacted" ? (
                              <span className="pill ok">Accepted {CHECK_S}</span>
                            ) : (
                              <button
                                {...busyBtn(`applicant:${a.id}`, "btn btn-p btn-s")}
                                onClick={() => acceptApplicant(a.id, a.name)}
                              >
                                Accept
                              </button>
                            )}
                            <button
                              className="btn btn-g btn-s"
                              onClick={() => setReviewFor(reviewFor === a.id ? null : a.id)}
                            >
                              {reviewFor === a.id ? "Cancel" : "Review"}
                            </button>
                          </div>
                          {reviewFor === a.id && (
                            <form
                              className="form card flat"
                              style={{ marginTop: "var(--s2)" }}
                              onSubmit={(e) => submitTradieReview(e, a.id, a.tradieUserId, a.name)}
                            >
                              <label>
                                Rating
                                <select name="rating" defaultValue="5">
                                  <option>5</option>
                                  <option>4</option>
                                  <option>3</option>
                                  <option>2</option>
                                  <option>1</option>
                                </select>
                              </label>
                              <label>
                                How were they on the job?{" "}
                                <span className="hint">— turned up, on time, quality, rehire?</span>
                                <textarea name="text" placeholder="Reliable, tidy work, would rehire…" required />
                              </label>
                              <div className="actions">
                                <button {...busyBtn(`review:${a.id}`, "btn btn-d btn-s")}>
                                  Post review
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      ))}
                      {j.apps.length === 0 && (
                        <EmptyState
                          headline="No applicants yet"
                          body="Verified tradies apply free — zero lead fees, ever."
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {vm.jobs.length === 0 && (
                <EmptyState
                  headline="No jobs posted yet"
                  body={<>Post your first — tradies apply free, and your BuildSafe status answers &ldquo;will I get paid?&rdquo; upfront.</>}
                  cta={
                    <button className="btn btn-p" onClick={() => go("b-post")}>
                      Post a job →
                    </button>
                  }
                />
              )}
            </div>
          </div>

          {/* VERIFY */}
          <div className={`panel${tab === "b-verify" ? " on" : ""}`} id="b-verify">
            <div className="topbar">
              <h2>Profile &amp; verification</h2>
              <Link className="btn btn-g btn-s" href={`/b/${vm.slug}`}>
                View public profile →
              </Link>
            </div>
            <div className="stack">
              <div className="phead">
                <span className="avatar av-lg" style={{ background: "var(--av-1)" }}>{vm.companyInitials}</span>
                <div className="grow">
                  <h3>{vm.companyName}</h3>
                  <div className="micro">
                    ABN {vm.abnFormatted} · {vm.licenceLine} · {vm.locationLine}
                  </div>
                  <div className="pstats">
                    <div>
                      <b>{vm.ratingText} {STAR}</b>
                      <span>{vm.reviewCount} reviews</span>
                    </div>
                    <div>
                      <b>{vm.tierRank > 0 ? `Tier ${vm.tierRank}` : "—"}</b>
                      <span>verification</span>
                    </div>
                    <div>
                      <b>{vm.paySummary.b}</b>
                      <span>{vm.paySummary.s}</span>
                    </div>
                  </div>
                </div>
                {vm.tier !== "none" ? (
                  <span className="vbadge">
                    {CHECK}
                    Verified
                  </span>
                ) : (
                  <span className="pill navy">NOT YET VERIFIED</span>
                )}
              </div>
              <div className="grid3">
                {TIER_CARDS.map((t) => {
                  const pill = tierPill(t.n, t.key);
                  const canApply = vm.tierRank < t.n && !vm.pendingTiers.includes(t.key);
                  return (
                    <div key={t.key} className={`card${vm.tierRank === t.n ? " tier-active" : ""}`}>
                      <span className={`pill ${pill.cls}`}>{pill.label}</span>
                      <h3 style={{ marginTop: ".7rem" }}>{t.title}</h3>
                      {t.key === "id_verified" && <p>ABN matched, licence confirmed with VBA, details validated.</p>}
                      {t.key === "buildsafe_verified" && (
                        <p>
                          Insurance confirmed, 12 months of clean public records, re-checked monthly. Badge live on your
                          profile &amp; job posts.
                        </p>
                      )}
                      {t.key === "track_record" && (
                        <p>
                          Needs 50 verified reviews incl. subbie payment ratings. You have {vm.reviewCount}.
                        </p>
                      )}
                      <ul className="criteria">
                        {t.criteria.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                      {(canApply || (t.key === "track_record" && vm.reviewCount < 50)) && (
                        <div className="actions" style={{ marginTop: "var(--s3)" }}>
                          {t.key === "track_record" && vm.reviewCount < 50 && (
                            <button
                              className="btn btn-p btn-s"
                              onClick={() => toast("Review invites sent to your last 9 completed jobs")}
                            >
                              Request reviews →
                            </button>
                          )}
                          {canApply && (
                            <button
                              {...busyBtn(`tier:${t.key}`, `btn ${t.key === "track_record" ? "btn-g" : "btn-p"} btn-s`)}
                              onClick={() => applyTier(t.key)}
                            >
                              Apply for Tier {t.n} →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="hint">
                Criteria are published for every tier. Badges are re-checked monthly and revoked instantly if criteria stop
                being met.
              </div>
            </div>
          </div>

          {/* REVIEWS */}
          <div className={`panel${tab === "b-rev" ? " on" : ""}`} id="b-rev">
            <div className="topbar">
              <h2>Reviews</h2>
              <span className="hint">Two-way &amp; verified — you can respond, never delete</span>
            </div>
            <div className="list" id="b-reviews">
              {vm.reviews.map((r) => (
                <div key={r.id}>
                  <div className="review">
                    <div className="rt">
                      <span className="avatar" style={{ background: "var(--av-1)" }}>{r.initials}</span>
                      <div>
                        <b>{r.name}</b>{" "}
                        <span className="pill navy">{r.roleLabel}</span>
                      </div>
                      <span style={{ marginLeft: "auto" }}>
                        <Stars rating={r.rating} />
                      </span>
                    </div>
                    <p>&ldquo;{r.text}&rdquo;</p>
                    {r.reply && (
                      <div className="reply">
                        <b>RESPONSE FROM BUILDER</b>
                        <br />
                        {r.reply}
                      </div>
                    )}
                  </div>
                  {!r.reply && (
                    <form
                      className="card form flat"
                      style={{ marginTop: "var(--s3)" }}
                      onSubmit={(e) => submitReply(e, r.id)}
                    >
                      <label>
                        Respond to &ldquo;{r.text.length > 44 ? `${r.text.slice(0, 44)}…` : r.text}&rdquo;
                        <textarea name="reply" placeholder="Write a public reply…" required />
                      </label>
                      <div className="actions">
                        <button {...busyBtn(`reply:${r.id}`, "btn btn-d btn-s")}>
                          Post reply
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
              {vm.reviews.length === 0 && (
                <EmptyState
                  headline="No reviews yet"
                  body="Reviews are two-way and verified — customers and subbies review you, you reply publicly."
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
