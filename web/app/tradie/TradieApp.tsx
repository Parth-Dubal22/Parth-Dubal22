"use client";
/** Tradie app shell — ported 1:1 from site/app-tradie.html (sbtn/panel tabs, mobile
 *  burger, prototype markup + copy). All mutations go through the API routes.
 *  R2 sweep: token-scale spacing, per-action busy states, SVG icons (no glyphs),
 *  <EmptyState> zero-states, error toasts, mobile drawer scrim/Escape/focus-return. */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Art from "@/components/Art";
import EmptyState from "@/components/EmptyState";
import Stars from "@/components/Stars";
import { toast } from "@/components/Toast";
import { ALL_TRADES, ST, centsToMoney, fmtDate, initials, timeAgo } from "@/lib/format";
import type {
  PortfolioItem, TradieAlert, TradieJob, TradieProfileData, TradieReview, TradieWatchItem,
} from "./types";

/* avatar colours keyed by risk status via tokens (neutral --av-1 when gated) */
const RISK_COL: Record<string, string> = {
  risk: "var(--risk)", watch: "var(--watch)", ok: "var(--clear)",
};
const NEUTRAL_COL = "var(--av-1)";
const alertCls = (lv: string | null) => (lv === "risk" ? "" : lv === "watch" ? " w" : " c");

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || data.ok === false) throw new Error(data.error || "Something went wrong");
  return data;
}

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

/* ------- small inline icons (24-grid stroke SVGs — no text glyphs) ------- */
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function CheckIcon({ size = 12, stroke }: { size?: number; stroke?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={stroke ?? "currentColor"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function StarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="var(--star)" aria-hidden="true" style={{ verticalAlign: "-.08em" }}>
      <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96z" />
    </svg>
  );
}

/* ------- 72px line-art empty-state illustrations (MASTER §9 contexts) ------- */
function ArtWatchEmpty() {
  return (
    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="23" cy="46" r="11" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="49" cy="46" r="11" stroke="currentColor" strokeWidth="2.5" />
      <path d="M34 43h4M19 36l4-16h5M53 36l-4-16h-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="23" cy="46" r="4" fill="var(--osoft)" stroke="var(--orange)" strokeWidth="2.5" />
    </svg>
  );
}
function ArtBellEmpty() {
  return (
    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path d="M50 43a14 14 0 10-28 0c0 9-4.5 12-4.5 12h37S50 52 50 43z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M41 60a5 5 0 01-10 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="51" cy="19" r="6" fill="var(--osoft)" stroke="var(--orange)" strokeWidth="2.5" />
    </svg>
  );
}
function ArtDollarEmpty() {
  return (
    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="25" stroke="currentColor" strokeWidth="2.5" />
      <path d="M36 21v30M43 27.5c-1.3-2.1-3.9-3-7-3-3.9 0-6.6 1.9-6.6 5 0 6.8 13.9 3.3 13.9 10 0 3.3-3 5.3-7.5 5.3-3.6 0-6.3-1.3-7.5-3.5" stroke="var(--orange)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function ArtHatEmpty() {
  return (
    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path d="M14 47a22 22 0 0144 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M9 47h54v6H9z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 28v-9h12v9" stroke="var(--orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArtStarsEmpty() {
  return (
    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path d="M32 14l5.5 11.2 12.4 1.8-9 8.7 2.1 12.3L32 42.2 21 48l2.1-12.3-9-8.7 12.4-1.8z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M54 42l2.6 5.3 5.9.9-4.3 4.1 1 5.9L54 55.4 48.8 58.2l1-5.9-4.3-4.1 5.9-.9z" fill="var(--osoft)" stroke="var(--orange)" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}
function ArtCameraEmpty() {
  return (
    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <rect x="10" y="23" width="52" height="35" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M26 23l4-7h12l4 7" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="36" cy="40" r="10" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="36" cy="40" r="4" fill="var(--osoft)" stroke="var(--orange)" strokeWidth="2.5" />
    </svg>
  );
}

/* ------- upgrade prompt (risk detail is for subscribers — facts stay hidden) ------- */
function UpgradePrompt({ what }: { what: string }) {
  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <span className="pill navy">TRADIE WATCH · SUBSCRIBERS</span>
      <h3 style={{ margin: "var(--s3) 0 var(--s1)" }}>{what} is part of Tradie Watch</h3>
      <p>
        BuildSafe monitors public records and flags signals — every one citing its source.
        Signal history, builder risk status and your $ exposure tracker are private to
        subscribers. $29/mo · no lock-in contracts · cancel anytime.
      </p>
      <Link className="btn btn-p" href="/pricing" style={{ marginTop: "var(--s4)" }}>
        Upgrade — cancel anytime
      </Link>
    </div>
  );
}

/* ------- add-to-watchlist form (prototype #add-watch) ------- */
function AddWatchForm({
  onDone, inputRef,
}: { onDone: () => void; inputRef?: React.Ref<HTMLInputElement> }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query || busy) return;
    setBusy(true);
    try {
      const digits = query.replace(/\D/g, "");
      const body =
        digits.length === 11
          ? { abn: digits, kind: "builder" as const }
          : { name: query, kind: "builder" as const };
      await api("/api/watchlist", "POST", body);
      setQ("");
      toast(query + " added — monitoring is on");
      onDone();
    } catch (err) {
      toast(msg(err), { kind: "error" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="actions">
      <input
        ref={inputRef}
        type="text"
        className="w-m"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Add builder by name/ABN…"
        aria-label="Add builder by name or ABN"
      />
      <button
        className={"btn btn-d btn-s" + (busy ? " busy" : "")}
        type="submit" disabled={busy} aria-busy={busy || undefined}
      >
        <PlusIcon />
        Watch
      </button>
    </form>
  );
}

/* ------- report a payment delay (aggregated & anonymised — never verbatim) ------- */
function ReportDelay({ companyId, companyName }: { companyId: number; companyName: string }) {
  const [open, setOpen] = useState(false);
  const [daysLate, setDaysLate] = useState("");
  const [evidence, setEvidence] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const days = parseInt(daysLate, 10);
    if (!Number.isFinite(days) || days < 1) {
      toast("Enter how many days late the payment is", { kind: "error" });
      return;
    }
    setBusy(true);
    try {
      await api("/api/payment-reports", "POST", { companyId, daysLate: days, hasInvoiceEvidence: evidence });
      toast("Report logged — only ever shown aggregated & anonymised");
      setOpen(false); setDaysLate(""); setEvidence(false);
    } catch (err) {
      toast(msg(err), { kind: "error" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ flexBasis: "100%" }}>
      {!open ? (
        <button className="btn btn-g btn-s" onClick={() => setOpen(true)}>
          Report a payment delay
        </button>
      ) : (
        <form className="form" onSubmit={submit} style={{ marginTop: "var(--s2)" }}>
          <div className="f2">
            <label>
              Days late
              <input
                type="number" min={1} value={daysLate}
                onChange={(e) => setDaysLate(e.target.value)}
                aria-label={`Days late on payment from ${companyName}`}
              />
            </label>
            <label className="check-row" style={{ alignSelf: "end" }}>
              <input
                type="checkbox" checked={evidence}
                onChange={(e) => setEvidence(e.target.checked)}
              />
              I can provide the unpaid invoice as evidence
            </label>
          </div>
          <span className="hint">
            Your report is only ever displayed aggregated &amp; anonymised — e.g. “3 verified
            reports of 60+ day delays” — never published verbatim, never attributed to you.
          </span>
          <div className="actions">
            <button
              className={"btn btn-p btn-s" + (busy ? " busy" : "")}
              type="submit" disabled={busy} aria-busy={busy || undefined}
            >
              Submit report
            </button>
            <button className="btn btn-g btn-s" type="button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ------- watchlist card (prototype renderWatch item) ------- */
function WatchCard({
  w, seeRisk, history, onRemoved,
}: { w: TradieWatchItem; seeRisk: boolean; history: boolean; onRemoved: () => void }) {
  const [busy, setBusy] = useState(false);
  const st = w.risk ? ST[w.risk] : null;
  const latest = w.signals[0];
  async function remove() {
    setBusy(true);
    try {
      await api(`/api/watchlist?companyId=${w.companyId}`, "DELETE");
      toast(w.name + " removed from your watchlist");
      onRemoved();
    } catch (err) {
      toast(msg(err), { kind: "error" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={"item" + (seeRisk ? " alertcard" + alertCls(w.risk) : "")}>
      <span className="avatar" style={{ background: st ? RISK_COL[w.risk!] : NEUTRAL_COL }}>
        {initials(w.name)}
      </span>
      <div className="grow">
        <b>{w.name}</b>
        <span className="sub2">ABN {w.abn} · {w.licence}</span>
        {seeRisk && !history && latest ? (
          <div className="srcline">
            Latest: {latest.title} —{" "}
            {latest.sourceUrl ? (
              <a href={latest.sourceUrl} target="_blank" rel="noopener noreferrer">{latest.sourceName}</a>
            ) : (
              latest.sourceName
            )}
          </div>
        ) : null}
        {seeRisk && history
          ? w.signals.map((s, i) => (
              <div className="srcline" key={i}>
                {fmtDate(s.date)} — {s.title} —{" "}
                {s.sourceUrl ? (
                  <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{s.sourceName}</a>
                ) : (
                  s.sourceName
                )}
              </div>
            ))
          : null}
        {seeRisk && history && w.lastCheckedAt ? (
          <div className="srcline">Last checked {fmtDate(w.lastCheckedAt)}</div>
        ) : null}
      </div>
      <div style={{ textAlign: "right" }}>
        {st ? <span className={`pill ${st[1]}`}>{st[0]}</span> : null}
        {seeRisk ? (
          <div className="micro" style={{ marginTop: "var(--s1)" }}>
            {w.exposureCents ? centsToMoney(w.exposureCents) + " exposed" : "no $ logged"}
          </div>
        ) : null}
      </div>
      <Link className="btn btn-g btn-s" href={`/b/${w.slug}`}>Profile</Link>
      {history ? (
        <button
          className={"btn btn-g btn-s" + (busy ? " busy" : "")}
          onClick={remove} disabled={busy} aria-busy={busy || undefined}
          aria-label={`Remove ${w.name} from watchlist`}
        >
          Remove
        </button>
      ) : null}
      {history && seeRisk && w.risk === "risk" ? (
        <ReportDelay companyId={w.companyId} companyName={w.name} />
      ) : null}
    </div>
  );
}

/* ------- job card (prototype jobCard, tradie mode) ------- */
function JobCard({ j, onApplied }: { j: TradieJob; onApplied: () => void }) {
  const [busy, setBusy] = useState(false);
  const st = j.builderRisk ? ST[j.builderRisk] : null;
  async function apply() {
    setBusy(true);
    try {
      await api(`/api/jobs/${j.id}/apply`, "POST", {});
      toast("Application sent — the builder can see your verified profile");
      onApplied();
    } catch (err) {
      toast(msg(err), { kind: "error" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="jobcard">
      <div className="top">
        <div>
          <h4>{j.title}</h4>
          <div className="meta">
            <span>{j.location}</span><span>Starts {j.startText}</span><span>{j.duration}</span>
            {j.requirement ? <span>{j.requirement}</span> : null}
          </div>
        </div>
        <span className="rate">{j.rate}</span>
      </div>
      <div className="paycheck">
        <span className="who">
          {st ? (
            <span className={`pill ${st[1]}`}>Builder: {st[0]}</span>
          ) : (
            <Link className="pill navy" href="/pricing">Pay-status: upgrade to see</Link>
          )}{" "}
          <b>{j.builderName}</b>
        </span>
        {j.applied ? (
          <span className="pill ok">
            Applied
            <CheckIcon />
          </span>
        ) : (
          <button
            className={"btn btn-p btn-s" + (busy ? " busy" : "")}
            onClick={apply} disabled={busy} aria-busy={busy || undefined}
          >
            Apply now
          </button>
        )}
      </div>
    </div>
  );
}

/* ------- exposure row ------- */
function ExposureRow({ w, onSaved }: { w: TradieWatchItem; onSaved: () => void }) {
  const [val, setVal] = useState(w.exposureCents ? String(Math.round(w.exposureCents / 100)) : "");
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const dollars = parseFloat(val || "0");
      await api("/api/exposure", "PUT", {
        companyId: w.companyId,
        amountCents: Math.max(0, Math.round((Number.isFinite(dollars) ? dollars : 0) * 100)),
        kind: "owed",
      });
      toast("Exposure updated for " + w.name);
      onSaved();
    } catch (err) {
      toast(msg(err), { kind: "error" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="item" onSubmit={save}>
      <span className="avatar" style={{ background: w.risk ? RISK_COL[w.risk] : NEUTRAL_COL }}>
        {initials(w.name)}
      </span>
      <div className="grow">
        <b>{w.name}</b>
        <span className="sub2">ABN {w.abn}</span>
      </div>
      <span className="micro">OWED ($)</span>
      <input
        type="number" min={0} step={1} value={val}
        className="w-s"
        onChange={(e) => setVal(e.target.value)}
        aria-label={`Amount owed to you by ${w.name}, in dollars`}
      />
      <button
        className={"btn btn-d btn-s" + (busy ? " busy" : "")}
        type="submit" disabled={busy} aria-busy={busy || undefined}
      >
        Save
      </button>
    </form>
  );
}

/* ------- alert card (prototype alertfeed item) + mark read ------- */
function AlertCard({ a, onRead }: { a: TradieAlert; onRead: () => void }) {
  const [busy, setBusy] = useState(false);
  async function markRead() {
    setBusy(true);
    try {
      await api("/api/alerts/read", "POST", { alertId: a.id });
      onRead();
    } catch (err) {
      toast(msg(err), { kind: "error" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={"item alertcard" + alertCls(a.level)}>
      <div className="grow">
        <b>{a.title} — {a.companyName}</b>
        {a.detail ? (
          <p style={{ fontSize: ".86rem", color: "var(--slate)", marginTop: "var(--s1)" }}>{a.detail}</p>
        ) : null}
        <div className="srcline">
          Source:{" "}
          {a.sourceUrl ? (
            <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer">{a.sourceName}</a>
          ) : (
            a.sourceName
          )}{" "}
          · {fmtDate(a.occurredOn)}
        </div>
      </div>
      <span className="micro" suppressHydrationWarning>
        {timeAgo(a.createdAt)}
      </span>
      {a.read ? (
        <span className="pill navy">READ</span>
      ) : (
        <button
          className={"btn btn-g btn-s" + (busy ? " busy" : "")}
          onClick={markRead} disabled={busy} aria-busy={busy || undefined}
          aria-label={`Mark alert about ${a.companyName} as read`}
        >
          Mark read
        </button>
      )}
    </div>
  );
}

/* ------- review (prototype reviewHTML) ------- */
function ReviewCard({ r }: { r: TradieReview }) {
  return (
    <div className="review">
      <div className="rt">
        <span className="avatar" style={{ background: "var(--av-1)" }}>{initials(r.author)}</span>
        <div>
          <b>{r.author}</b>{" "}
          <span className="pill navy">{r.role}</span>
        </div>
        <span style={{ marginLeft: "auto" }}><Stars rating={r.rating} /></span>
      </div>
      <p>“{r.text}”</p>
      {r.reply ? (
        <div className="reply"><b>RESPONSE FROM BUILDER</b><br />{r.reply}</div>
      ) : null}
    </div>
  );
}

/* ------- sidebar icons (inline SVG, prototype stroke style — no emoji) ------- */
const IC = {
  dash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  ),
  watch: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  exp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" /><path d="M17 6.5c-1-1.6-2.8-2.2-5-2.2-2.7 0-4.6 1.3-4.6 3.5 0 4.7 9.9 2.3 9.9 7 0 2.3-2.1 3.7-5.3 3.7-2.6 0-4.4-.9-5.3-2.4" />
    </svg>
  ),
  alerts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  ),
  jobs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  prof: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0114 0v1" />
    </svg>
  ),
};

const TABS: { id: string; label: string; ic: React.ReactNode }[] = [
  { id: "t-dash", label: "Dashboard", ic: IC.dash },
  { id: "t-watch", label: "Watchlist", ic: IC.watch },
  { id: "t-exp", label: "Exposure", ic: IC.exp },
  { id: "t-alerts", label: "Alerts", ic: IC.alerts },
  { id: "t-jobs", label: "Job board", ic: IC.jobs },
  { id: "t-prof", label: "My profile", ic: IC.prof },
];

/* ==================================================================== */

export default function TradieApp({
  seeRisk, profile, watch, alerts, jobs, reviews,
}: {
  seeRisk: boolean;
  profile: TradieProfileData;
  watch: TradieWatchItem[];
  alerts: TradieAlert[];
  jobs: TradieJob[];
  reviews: TradieReview[];
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const [tab, setTab] = useState("t-dash");
  const [sideOpen, setSideOpen] = useState(false);
  const [avail, setAvail] = useState(profile.availableNow);
  const [availBusy, setAvailBusy] = useState(false);
  const [jobFilter, setJobFilter] = useState<"all" | "day" | "sub">("all");

  const burgerRef = useRef<HTMLButtonElement | null>(null);
  const dashAddRef = useRef<HTMLInputElement | null>(null);
  const watchAddRef = useRef<HTMLInputElement | null>(null);

  // Saved profile state drives the header/sidebar (updates after a successful save).
  const [saved, setSaved] = useState(profile);
  const [eNm, setENm] = useState(profile.name);
  const [eSb, setESb] = useState(profile.suburb);
  const [eTrades, setETrades] = useState<string[]>(profile.trades);
  const [eLic, setELic] = useState(profile.licenceNumber);
  const [eIns, setEIns] = useState(profile.insuranceProvider);
  const [eInsExp, setEInsExp] = useState(profile.insuranceExpiry);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(profile.portfolio);
  const [profBusy, setProfBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const first = saved.name.split(/\s+/)[0] || saved.name;
  const tradeLine = saved.trades.join(" & ");
  const totalExposure = watch.reduce((a, w) => a + (w.exposureCents ?? 0), 0);
  const openAlerts = alerts.filter((a) => !a.read).length;
  const rating = saved.ratingAvg;
  const insCurrent =
    saved.insuranceExpiry !== "" && new Date(saved.insuranceExpiry) > new Date();
  const tradeChips = useMemo(
    () => [...new Set([...profile.trades, ...ALL_TRADES])],
    [profile.trades],
  );

  const filteredJobs = jobs.filter((j) =>
    jobFilter === "all" ? true : jobFilter === "day" ? j.type === "day_hire" : j.type === "subcontract",
  );

  function pick(id: string) {
    setTab(id);
    closeSide();
    window.scrollTo({ top: 0 });
  }

  function closeSide() {
    setSideOpen(false);
  }

  // Mobile drawer contract (MASTER §7): Escape closes + focus returns to the
  // burger; body scroll locks while open; a scrim sits under the drawer.
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

  async function toggleAvail() {
    if (availBusy) return;
    const next = !avail;
    setAvailBusy(true);
    setAvail(next);
    try {
      await api("/api/availability", "POST", { availableNow: next });
      toast(next ? "You're live — nearby builders can book your day" : "Availability off");
      refresh();
    } catch (err) {
      setAvail(!next);
      toast(msg(err), { kind: "error" });
    } finally {
      setAvailBusy(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfBusy(true);
    try {
      await api("/api/profile", "PUT", {
        name: eNm.trim(),
        suburb: eSb.trim(),
        trades: eTrades,
        licenceNumber: eLic.trim(),
        insuranceProvider: eIns.trim(),
        insuranceExpiry: eInsExp || null,
      });
      setSaved({
        ...saved,
        name: eNm.trim(), suburb: eSb.trim(), trades: eTrades,
        licenceNumber: eLic.trim(), insuranceProvider: eIns.trim(), insuranceExpiry: eInsExp,
      });
      toast("Profile saved — builders now see the update");
      refresh();
    } catch (err) {
      toast(msg(err), { kind: "error" });
    } finally {
      setProfBusy(false);
    }
  }

  async function addPhoto() {
    if (photoBusy) return;
    const prev = portfolio;
    const next = [...prev, { art: "tile", caption: "New upload" }];
    setPhotoBusy(true);
    setPortfolio(next);
    try {
      await api("/api/profile", "PUT", { portfolio: next });
      toast("Photo added to portfolio");
      refresh();
    } catch (err) {
      setPortfolio(prev);
      toast(msg(err), { kind: "error" });
    } finally {
      setPhotoBusy(false);
    }
  }

  const toggleTrade = (t: string) =>
    setETrades(eTrades.includes(t) ? eTrades.filter((x) => x !== t) : [...eTrades, t]);

  return (
    <>
      <div className="appbar">
        <button
          ref={burgerRef}
          className="burger" aria-label="Menu"
          aria-expanded={sideOpen} onClick={() => setSideOpen(!sideOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <b>BuildSafe · Tradie</b>
        <Link href="/" className="exit">EXIT</Link>
      </div>

      <div className="app">
        {sideOpen ? (
          <button
            className="side-scrim"
            aria-label="Close menu"
            onClick={() => {
              closeSide();
              burgerRef.current?.focus();
            }}
          />
        ) : null}
        <aside className={"side" + (sideOpen ? " open" : "")}>
          <Link className="logo" href="/">
            <span className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            BuildSafe
          </Link>
          <span className="role">TRADIE APP</span>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={"sbtn" + (tab === t.id ? " on" : "")}
              onClick={() => pick(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
            >
              {t.ic}
              {t.label}
            </button>
          ))}
          <div className="me">
            <span className="avatar" style={{ background: "var(--orange)" }}>{initials(saved.name)}</span>
            <div>
              <b>{saved.name}</b>
              <span>{tradeLine || "Tradie"}</span>
            </div>
          </div>
        </aside>

        <main className="main">
          {/* DASHBOARD */}
          <div className={"panel" + (tab === "t-dash" ? " on" : "")} id="t-dash">
            <div className="topbar">
              <h2>G&apos;day {first}</h2>
              <button className="tog" onClick={toggleAvail} aria-pressed={avail} disabled={availBusy} aria-busy={availBusy || undefined}>
                <span>{avail ? "Available now — visible to builders" : "Available for day work"}</span>
                <span className="knob"></span>
              </button>
            </div>
            <div className="kpis">
              <div className="kpi"><small>Builders watched</small><b>{watch.length}</b></div>
              <div className="kpi">
                <small>Total exposure</small>
                <b className="or">{seeRisk ? centsToMoney(totalExposure) : "—"}</b>
              </div>
              <div className="kpi">
                <small>Open alerts</small>
                <b className={openAlerts > 0 ? "risk" : "ok"}>{seeRisk ? openAlerts : "—"}</b>
              </div>
              <div className="kpi">
                <small>Profile rating</small>
                <b className="ok">{rating != null ? <>{rating.toFixed(1)} <StarIcon /></> : "—"}</b>
              </div>
            </div>
            <div className="topbar" style={{ marginTop: "var(--s1)" }}>
              <h3>Your watchlist</h3>
              <AddWatchForm onDone={refresh} inputRef={dashAddRef} />
            </div>
            <div className="list">
              {watch.map((w) => (
                <WatchCard key={w.companyId} w={w} seeRisk={seeRisk} history={false} onRemoved={refresh} />
              ))}
              {watch.length === 0 ? (
                <EmptyState
                  icon={<ArtWatchEmpty />}
                  headline="No builders watched yet"
                  body="Add the builders you work under — monitoring runs continuously."
                  cta={
                    <button className="btn btn-p" onClick={() => dashAddRef.current?.focus()}>
                      Add a builder
                    </button>
                  }
                />
              ) : null}
            </div>
            {seeRisk ? (
              <>
                <div className="topbar" style={{ marginTop: "var(--stack-gap)" }}>
                  <h3>Latest alerts</h3>
                  <span className="hint">Every alert cites a public source</span>
                </div>
                <div className="list">
                  {alerts.slice(0, 3).map((a) => <AlertCard key={a.id} a={a} onRead={refresh} />)}
                  {alerts.length === 0 ? (
                    <EmptyState
                      icon={<ArtBellEmpty />}
                      headline="No alerts yet"
                      body="We'll flag new signals on your watched builders here."
                      cta={
                        <button className="btn btn-g" onClick={() => pick("t-watch")}>
                          Watch a builder
                        </button>
                      }
                    />
                  ) : null}
                </div>
              </>
            ) : (
              <div style={{ marginTop: "var(--stack-gap)" }}>
                <UpgradePrompt what="The alert feed" />
              </div>
            )}
          </div>

          {/* WATCHLIST */}
          <div className={"panel" + (tab === "t-watch" ? " on" : "")} id="t-watch">
            <div className="topbar">
              <h2>Watchlist</h2>
              <AddWatchForm onDone={refresh} inputRef={watchAddRef} />
            </div>
            {!seeRisk ? (
              <div style={{ marginBottom: "var(--s5)" }}>
                <UpgradePrompt what="Signal history" />
              </div>
            ) : null}
            <div className="list">
              {watch.map((w) => (
                <WatchCard key={w.companyId} w={w} seeRisk={seeRisk} history={true} onRemoved={refresh} />
              ))}
              {watch.length === 0 ? (
                <EmptyState
                  icon={<ArtWatchEmpty />}
                  headline="No builders watched yet"
                  body="Add a builder by name or ABN to start continuous monitoring."
                  cta={
                    <button className="btn btn-p" onClick={() => watchAddRef.current?.focus()}>
                      Add a builder
                    </button>
                  }
                />
              ) : null}
            </div>
          </div>

          {/* EXPOSURE */}
          <div className={"panel" + (tab === "t-exp" ? " on" : "")} id="t-exp">
            <div className="topbar">
              <h2>Exposure tracker</h2>
              <span className="hint">Log what each builder owes you — alerts show how much of your money is affected</span>
            </div>
            {seeRisk ? (
              <>
                <div className="kpis" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
                  <div className="kpi"><small>Total exposure</small><b className="or">{centsToMoney(totalExposure)}</b></div>
                  <div className="kpi"><small>Builders watched</small><b>{watch.length}</b></div>
                </div>
                <div className="list">
                  {watch.map((w) => <ExposureRow key={w.companyId} w={w} onSaved={refresh} />)}
                  {watch.length === 0 ? (
                    <EmptyState
                      icon={<ArtDollarEmpty />}
                      headline="Nothing to track yet"
                      body="Watch a builder first, then log the invoices and retention they hold."
                      cta={
                        <button className="btn btn-p" onClick={() => pick("t-watch")}>
                          Watch a builder
                        </button>
                      }
                    />
                  ) : null}
                </div>
              </>
            ) : (
              <UpgradePrompt what="The exposure tracker" />
            )}
          </div>

          {/* ALERTS */}
          <div className={"panel" + (tab === "t-alerts" ? " on" : "")} id="t-alerts">
            <div className="topbar">
              <h2>Alerts</h2>
              <span className="hint">Every alert cites a public source</span>
            </div>
            {seeRisk ? (
              <div className="list">
                {alerts.map((a) => <AlertCard key={a.id} a={a} onRead={refresh} />)}
                {alerts.length === 0 ? (
                  <EmptyState
                    icon={<ArtBellEmpty />}
                    headline="No alerts yet"
                    body="We'll flag new signals on your watched builders here."
                    cta={
                      <button className="btn btn-p" onClick={() => pick("t-watch")}>
                        Watch a builder
                      </button>
                    }
                  />
                ) : null}
              </div>
            ) : (
              <UpgradePrompt what="The alert inbox" />
            )}
          </div>

          {/* JOB BOARD */}
          <div className={"panel" + (tab === "t-jobs" ? " on" : "")} id="t-jobs">
            <div className="topbar">
              <h2>Job board</h2>
              <span className="pill ok">ZERO LEAD FEES</span>
            </div>
            <div className="filters">
              {([["all", "All"], ["day", "Day hire"], ["sub", "Subcontract"]] as const).map(([f, label]) => (
                <button
                  key={f}
                  className={"chip" + (jobFilter === f ? " on" : "")}
                  onClick={() => setJobFilter(f)}
                  aria-pressed={jobFilter === f}
                >
                  {label}
                </button>
              ))}
              <span style={{ marginLeft: "auto" }} className="hint">
                Builder pay-status shown on every job — apply free.
              </span>
            </div>
            <div className="grid2">
              {filteredJobs.map((j) => <JobCard key={j.id} j={j} onApplied={refresh} />)}
              {filteredJobs.length === 0 ? (
                <div style={{ gridColumn: "1 / -1" }}>
                  <EmptyState
                    icon={<ArtHatEmpty />}
                    headline="No open jobs match"
                    body="Try another filter — new packages and day hire land here first."
                    cta={
                      <button className="btn btn-g" onClick={() => setJobFilter("all")}>
                        Show all jobs
                      </button>
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* PROFILE */}
          <div className={"panel" + (tab === "t-prof" ? " on" : "")} id="t-prof">
            <div className="topbar">
              <h2>My profile</h2>
              <span className="hint">This is what builders see when you apply</span>
            </div>
            <div className="phead">
              <span className="avatar av-lg" style={{ background: "var(--orange)" }}>{initials(saved.name)}</span>
              <div className="grow">
                <h3 style={{ fontSize: "1.3rem" }}>{saved.name}</h3>
                <div className="micro">
                  {[tradeLine, [saved.suburb, saved.state].filter(Boolean).join(" "), saved.abn ? `ABN ${saved.abn}` : ""]
                    .filter(Boolean).join(" · ").toUpperCase()}
                </div>
                <div className="pstats">
                  <div><b>{rating != null ? <>{rating.toFixed(1)} <StarIcon /></> : "—"}</b><span>rating</span></div>
                  <div><b>{saved.jobsCompleted}</b><span>jobs via BuildSafe</span></div>
                  <div><b>{saved.reliabilityScore != null ? `${saved.reliabilityScore}%` : "—"}</b><span>reliability score</span></div>
                  <div>
                    <b>
                      {insCurrent ? (
                        <>
                          <CheckIcon size={16} stroke="var(--clear)" />
                          <span className="vh">Yes</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </b>
                    <span>insurance current</span>
                  </div>
                </div>
              </div>
              {saved.licenceVerified || saved.insuranceVerified ? (
                <span className="vbadge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  ID Verified
                </span>
              ) : null}
            </div>

            <h3 style={{ margin: "var(--stack-gap) 0 var(--s3)" }}>Edit details</h3>
            <form className="form card" onSubmit={saveProfile}>
              <div className="f2">
                <label>
                  Display name
                  <input type="text" value={eNm} onChange={(e) => setENm(e.target.value)} />
                </label>
                <label>
                  Suburb
                  <input type="text" value={eSb} onChange={(e) => setESb(e.target.value)} />
                </label>
              </div>
              <div>
                <span className="field-legend">Trades</span>
                <div className="filters" style={{ marginBottom: 0 }}>
                  {tradeChips.map((t) => (
                    <button
                      key={t} type="button"
                      className={"chip" + (eTrades.includes(t) ? " on" : "")}
                      onClick={() => toggleTrade(t)}
                      aria-pressed={eTrades.includes(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="f2">
                <label>
                  Licence number
                  <input type="text" value={eLic} onChange={(e) => setELic(e.target.value)} />
                </label>
                <label>
                  Insurance (insurer · amount)
                  <input type="text" value={eIns} onChange={(e) => setEIns(e.target.value)} />
                </label>
              </div>
              <div className="f2">
                <label>
                  Insurance expiry
                  <input type="date" value={eInsExp} onChange={(e) => setEInsExp(e.target.value)} />
                </label>
              </div>
              <div className="actions">
                <button
                  className={"btn btn-p" + (profBusy ? " busy" : "")}
                  disabled={profBusy} aria-busy={profBusy || undefined}
                >
                  Save profile
                </button>
              </div>
            </form>

            <h3 style={{ margin: "var(--stack-gap) 0 var(--s3)" }}>Portfolio</h3>
            {portfolio.length > 0 ? (
              <>
                <div className="portfolio">
                  {portfolio.map((p, i) => (
                    <Art key={i} kind={p.art} label={p.caption} style={{ aspectRatio: "16/10" }} />
                  ))}
                </div>
                <button
                  className={"btn btn-g btn-s" + (photoBusy ? " busy" : "")}
                  style={{ marginTop: "var(--s3)" }}
                  onClick={addPhoto} disabled={photoBusy} aria-busy={photoBusy || undefined}
                >
                  <PlusIcon />
                  Add work photo
                </button>
              </>
            ) : (
              <EmptyState
                icon={<ArtCameraEmpty />}
                headline="No work photos yet"
                body="Show builders what you do — your portfolio backs up every application."
                cta={
                  <button
                    className={"btn btn-p" + (photoBusy ? " busy" : "")}
                    onClick={addPhoto} disabled={photoBusy} aria-busy={photoBusy || undefined}
                  >
                    Add work photo
                  </button>
                }
              />
            )}

            <h3 style={{ margin: "var(--stack-gap) 0 var(--s3)" }}>Reviews from builders &amp; clients</h3>
            <div className="list">
              {reviews.map((r) => <ReviewCard key={r.id} r={r} />)}
              {reviews.length === 0 ? (
                <EmptyState
                  icon={<ArtStarsEmpty />}
                  headline="No reviews yet"
                  body="Reviews land here after builders and clients you've worked with rate you."
                  cta={
                    <button className="btn btn-g" onClick={() => pick("t-jobs")}>
                      Browse the job board
                    </button>
                  }
                />
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
