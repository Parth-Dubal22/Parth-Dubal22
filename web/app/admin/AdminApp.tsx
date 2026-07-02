"use client";
/** Admin app shell — same app-shell sidebar style as the tradie/builder apps.
 *  Panels: Signal review · Verification · Disputes (48h SLA) · Payment reports · Email log.
 *  Every decision goes through the /api/admin/* routes. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";
import { ST } from "@/lib/format";

export type AdminVM = {
  adminName: string;
  adminInitials: string;
  signals: {
    id: number;
    title: string;
    detail: string | null;
    level: "ok" | "watch" | "risk";
    sourceName: string;
    sourceUrl: string | null;
    sourceRef: string | null;
    occurred: string;
    companyName: string;
    abn: string;
    createdAgo: string;
  }[];
  verifications: {
    id: number;
    tierLabel: string;
    companyName: string;
    abn: string;
    currentTier: string;
    requestedBy: string;
    createdAgo: string;
    criteria: { label: string; ok: boolean }[];
  }[];
  granted: { requestId: number; companyName: string; tierLabel: string; grantedAt: string }[];
  disputes: {
    id: number;
    targetType: string;
    targetLabel: string;
    reason: string;
    raisedBy: string;
    slaDueAtIso: string;
    createdAgo: string;
  }[];
  payReports: {
    id: number;
    companyName: string;
    daysLate: number;
    hasInvoiceEvidence: boolean;
    reporter: string;
    createdAgo: string;
  }[];
  emails: {
    id: number;
    to: string;
    subject: string;
    kind: string;
    sentAt: string | null;
    error: string | null;
    createdAgo: string;
  }[];
};

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const CROSS = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const TABS: { id: string; label: string; icon: React.ReactNode }[] = [
  {
    id: "a-sig",
    label: "Signal review",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    id: "a-ver",
    label: "Verification",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "a-dis",
    label: "Disputes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 16.5v.5" />
      </svg>
    ),
  },
  {
    id: "a-pay",
    label: "Payment reports",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h4" />
      </svg>
    ),
  },
  {
    id: "a-mail",
    label: "Email log",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
];

async function api(url: string, body?: unknown): Promise<{ ok?: boolean; error?: string; [k: string]: unknown }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    return (await res.json()) as { ok?: boolean; error?: string };
  } catch {
    return { ok: false, error: "Network error — please try again" };
  }
}

/** Hours/minutes left to an SLA deadline; refreshed every 30s after mount. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function slaText(dueIso: string, now: number): { text: string; late: boolean } {
  const ms = new Date(dueIso).getTime() - now;
  if (ms <= 0) return { text: "SLA BREACHED", late: true };
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return { text: `${h}h ${String(m).padStart(2, "0")}m left`, late: h < 12 };
}

export default function AdminApp({ vm }: { vm: AdminVM }) {
  const router = useRouter();
  const now = useNow();
  const [tab, setTab] = useState("a-sig");
  const [sideOpen, setSideOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function go(id: string) {
    setTab(id);
    setSideOpen(false);
    window.scrollTo({ top: 0 });
  }

  /* ---- signal review → POST /api/admin/signals/[id] ---- */
  async function decideSignal(id: number, action: "approve" | "reject") {
    setBusy(true);
    const d = await api(`/api/admin/signals/${id}`, { action });
    setBusy(false);
    if (d.ok) {
      toast(
        action === "approve"
          ? `Signal approved — fact published, ${Number(d.alerted ?? 0)} watcher${Number(d.alerted ?? 0) === 1 ? "" : "s"} alerted`
          : "Signal rejected — it never reaches watchers",
      );
      router.refresh();
    } else {
      toast(d.error || "Could not update the signal");
    }
  }

  /* ---- verification decisions → POST /api/admin/verifications/[id] ---- */
  async function decideVerification(id: number, action: "approve" | "reject", note?: string) {
    setBusy(true);
    const d = await api(`/api/admin/verifications/${id}`, { action, note: note || undefined });
    setBusy(false);
    if (d.ok) {
      toast(action === "approve" ? "Badge granted — re-checked monthly, revoked instantly if criteria lapse" : "Request rejected");
      router.refresh();
    } else {
      toast(d.error || "Could not update the request");
    }
  }

  async function revoke(e: React.FormEvent<HTMLFormElement>, requestId: number) {
    e.preventDefault();
    const form = e.currentTarget;
    const note = String(new FormData(form).get("note") ?? "").trim();
    if (!note) {
      toast("A note explaining the revocation is required");
      return;
    }
    setBusy(true);
    const d = await api(`/api/admin/verifications/${requestId}`, { action: "revoke", note });
    setBusy(false);
    if (d.ok) {
      form.reset();
      toast("Badge revoked instantly — the public profile no longer shows it");
      router.refresh();
    } else {
      toast(d.error || "Could not revoke the badge");
    }
  }

  /* ---- disputes → POST /api/admin/disputes/[id] ---- */
  async function resolveDispute(form: HTMLFormElement, id: number, action: "corrected" | "rejected") {
    const resolution = String(new FormData(form).get("resolution") ?? "").trim();
    if (!resolution) {
      toast("Write a resolution note first — every decision is documented");
      return;
    }
    setBusy(true);
    const d = await api(`/api/admin/disputes/${id}`, { action, resolution });
    setBusy(false);
    if (d.ok) {
      toast(
        action === "corrected"
          ? "Dispute upheld — correction applied (disputed signals come down immediately)"
          : "Dispute rejected — record stands, resolution documented",
      );
      router.refresh();
    } else {
      toast(d.error || "Could not resolve the dispute");
    }
  }

  /* ---- payment reports → POST /api/admin/payment-reports/[id] ---- */
  async function verifyReport(id: number) {
    setBusy(true);
    const d = await api(`/api/admin/payment-reports/${id}`);
    setBusy(false);
    if (d.ok) {
      toast("Report verified — it only ever surfaces aggregated & anonymised");
      router.refresh();
    } else {
      toast(d.error || "Could not verify the report");
    }
  }

  const counts: Record<string, number> = {
    "a-sig": vm.signals.length,
    "a-ver": vm.verifications.length,
    "a-dis": vm.disputes.length,
    "a-pay": vm.payReports.length,
  };

  return (
    <>
      <div className="appbar">
        <button
          id="appburger"
          className="burger"
          style={{ display: "flex" }}
          aria-label="Menu"
          aria-expanded={sideOpen}
          onClick={() => setSideOpen((o) => !o)}
        >
          <span style={{ background: "#fff" }}></span>
          <span style={{ background: "#fff" }}></span>
          <span style={{ background: "#fff" }}></span>
        </button>
        <b style={{ fontFamily: "var(--fd)" }}>BuildSafe · Admin</b>
        <Link href="/" className="mono" style={{ fontSize: ".62rem", color: "#9DB0CC" }}>
          EXIT
        </Link>
      </div>

      <div className="app">
        <aside className={`side${sideOpen ? " open" : ""}`}>
          <Link className="logo" href="/">
            <span className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            BuildSafe
          </Link>
          <span className="role">ADMIN APP</span>
          {TABS.map((t) => (
            <button key={t.id} className={`sbtn${tab === t.id ? " on" : ""}`} onClick={() => go(t.id)} aria-current={tab === t.id}>
              {t.icon}
              {t.label}
              {counts[t.id] > 0 && (
                <span className="mono" style={{ marginLeft: "auto", fontSize: ".62rem", color: "#FF5A1F" }}>{counts[t.id]}</span>
              )}
            </button>
          ))}
          <div className="me">
            <span className="avatar" style={{ background: "#2E5E8F" }}>{vm.adminInitials}</span>
            <div>
              <b>{vm.adminName}</b>
              <span>Trust &amp; accuracy team</span>
            </div>
          </div>
        </aside>

        <main className="main">
          {/* SIGNAL REVIEW QUEUE */}
          <div className={`panel${tab === "a-sig" ? " on" : ""}`} id="a-sig">
            <div className="topbar">
              <h2>Signal review queue</h2>
              <span className="hint">Publish facts, not verdicts — every signal must cite its source</span>
            </div>
            <div className="card" style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: ".85rem" }}>
                <b>Accuracy discipline:</b> approve only signals that state a verifiable FACT from a named public
                source with a date. No predictions, no verdicts, no adjectives. If the source doesn&apos;t support the
                exact wording, reject it. Approved signals fan out instantly to every watcher.
              </p>
            </div>
            <div className="list">
              {vm.signals.length === 0 && (
                <div className="item"><div className="grow"><b>Queue clear</b><span className="sub2">No pending signals — new pipeline finds land here for human review before anything is published.</span></div><span className="pill ok">CLEAR</span></div>
              )}
              {vm.signals.map((s) => (
                <div className="item" key={s.id}>
                  <div className="grow">
                    <b>{s.title}</b>
                    <span className="sub2">{s.companyName} · ABN {s.abn} · occurred {s.occurred} · queued {s.createdAgo}</span>
                    {s.detail && <p style={{ fontSize: ".82rem", color: "var(--slate)", marginTop: ".35rem" }}>{s.detail}</p>}
                    <div className="srcline">
                      Source: {s.sourceUrl ? (
                        <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{s.sourceName}</a>
                      ) : (
                        s.sourceName
                      )}
                      {s.sourceRef ? ` · ref ${s.sourceRef}` : ""}
                    </div>
                  </div>
                  <span className={`pill ${ST[s.level][1]}`}>{ST[s.level][0]}</span>
                  <button className="btn btn-p btn-s" disabled={busy} onClick={() => decideSignal(s.id, "approve")}>
                    Approve &amp; alert watchers
                  </button>
                  <button className="btn btn-g btn-s" disabled={busy} onClick={() => decideSignal(s.id, "reject")}>
                    Reject
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* VERIFICATION QUEUE */}
          <div className={`panel${tab === "a-ver" ? " on" : ""}`} id="a-ver">
            <div className="topbar">
              <h2>Verification queue</h2>
              <span className="hint">Published criteria · re-checked monthly · revoked instantly</span>
            </div>
            <div className="list">
              {vm.verifications.length === 0 && (
                <div className="item"><div className="grow"><b>No pending applications</b><span className="sub2">Builder tier applications appear here with their criteria checklist.</span></div><span className="pill ok">CLEAR</span></div>
              )}
              {vm.verifications.map((v) => (
                <div className="item" key={v.id}>
                  <div className="grow">
                    <b>{v.companyName} → {v.tierLabel}</b>
                    <span className="sub2">ABN {v.abn} · currently {v.currentTier} · requested by {v.requestedBy} · {v.createdAgo}</span>
                    <ul style={{ listStyle: "none", marginTop: ".55rem", display: "grid", gap: ".3rem" }}>
                      {v.criteria.map((c) => (
                        <li key={c.label} style={{ display: "flex", alignItems: "center", gap: ".45rem", fontSize: ".8rem", color: "var(--slate)" }}>
                          <span style={{ width: 14, height: 14, display: "inline-flex", color: c.ok ? "var(--clear)" : "var(--risk)" }} aria-hidden="true">
                            {c.ok ? CHECK : CROSS}
                          </span>
                          {c.label}
                          <span className="mono" style={{ fontSize: ".58rem", color: "var(--slate2)" }}>{c.ok ? "MET" : "NOT MET"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button className="btn btn-p btn-s" disabled={busy} onClick={() => decideVerification(v.id, "approve")}>
                    Approve tier
                  </button>
                  <button className="btn btn-g btn-s" disabled={busy} onClick={() => decideVerification(v.id, "reject")}>
                    Reject
                  </button>
                </div>
              ))}
            </div>

            {vm.granted.length > 0 && (
              <>
                <div className="topbar" style={{ marginTop: "1.8rem" }}>
                  <h2 style={{ fontSize: "1.1rem" }}>Live badges</h2>
                  <span className="hint">Revocation is instant and always documented</span>
                </div>
                <div className="list">
                  {vm.granted.map((g) => (
                    <div className="item" key={g.requestId}>
                      <div className="grow">
                        <b>{g.companyName}</b>
                        <span className="sub2">{g.tierLabel} · granted {g.grantedAt}</span>
                      </div>
                      <form onSubmit={(e) => revoke(e, g.requestId)} style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          name="note"
                          type="text"
                          placeholder="Reason (required)"
                          aria-label={`Reason for revoking ${g.companyName}`}
                          style={{ maxWidth: 220 }}
                        />
                        <button className="btn btn-d btn-s" disabled={busy} type="submit">Revoke now</button>
                      </form>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* DISPUTES QUEUE */}
          <div className={`panel${tab === "a-dis" ? " on" : ""}`} id="a-dis">
            <div className="topbar">
              <h2>Disputes &amp; corrections</h2>
              <span className="hint">48-hour SLA — upheld disputes are corrected immediately</span>
            </div>
            <div className="list">
              {vm.disputes.length === 0 && (
                <div className="item"><div className="grow"><b>No open disputes</b><span className="sub2">Anyone can dispute a signal, review, check or profile — each gets a documented decision within 48 hours.</span></div><span className="pill ok">CLEAR</span></div>
              )}
              {vm.disputes.map((d) => {
                const sla = slaText(d.slaDueAtIso, now);
                return (
                  <div className="item" key={d.id}>
                    <div className="grow">
                      <b>{d.targetLabel}</b>
                      <span className="sub2">raised by {d.raisedBy} · {d.createdAgo}</span>
                      <p style={{ fontSize: ".84rem", color: "var(--slate)", marginTop: ".35rem" }}>&ldquo;{d.reason}&rdquo;</p>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                          resolveDispute(e.currentTarget, d.id, submitter?.value === "rejected" ? "rejected" : "corrected");
                        }}
                        style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap", marginTop: ".6rem" }}
                      >
                        <input
                          name="resolution"
                          type="text"
                          placeholder="Resolution note (required, kept on record)"
                          aria-label={`Resolution note for dispute on ${d.targetLabel}`}
                          style={{ minWidth: 260, flex: 1 }}
                        />
                        <button className="btn btn-p btn-s" disabled={busy} type="submit" name="action" value="corrected">
                          Uphold &amp; correct
                        </button>
                        <button className="btn btn-g btn-s" disabled={busy} type="submit" name="action" value="rejected">
                          Reject dispute
                        </button>
                      </form>
                    </div>
                    <span
                      className="mono"
                      suppressHydrationWarning
                      style={{ fontSize: ".66rem", fontWeight: 600, color: sla.late ? "var(--risk)" : "var(--slate2)" }}
                    >
                      {sla.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PAYMENT REPORT VERIFICATION */}
          <div className={`panel${tab === "a-pay" ? " on" : ""}`} id="a-pay">
            <div className="topbar">
              <h2>Payment reports</h2>
              <span className="hint">Only ever displayed aggregated &amp; anonymised — never verbatim</span>
            </div>
            <div className="list">
              {vm.payReports.length === 0 && (
                <div className="item"><div className="grow"><b>Nothing to verify</b><span className="sub2">Tradie late-payment reports land here for evidence checks before counting toward aggregates.</span></div><span className="pill ok">CLEAR</span></div>
              )}
              {vm.payReports.map((r) => (
                <div className="item" key={r.id}>
                  <div className="grow">
                    <b>{r.companyName} — paid {r.daysLate} day{r.daysLate === 1 ? "" : "s"} late</b>
                    <span className="sub2">
                      reported by {r.reporter} · {r.createdAgo} · {r.hasInvoiceEvidence ? "invoice evidence attached" : "no invoice evidence"}
                    </span>
                  </div>
                  <span className={`pill ${r.hasInvoiceEvidence ? "watch" : "navy"}`}>{r.hasInvoiceEvidence ? "EVIDENCE" : "UNSWORN"}</span>
                  <button className="btn btn-p btn-s" disabled={busy} onClick={() => verifyReport(r.id)}>
                    Mark verified
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* EMAIL LOG */}
          <div className={`panel${tab === "a-mail" ? " on" : ""}`} id="a-mail">
            <div className="topbar">
              <h2>Email log</h2>
              <span className="hint">Latest 50 outbound emails — logged even when SMTP is off</span>
            </div>
            <div className="list">
              {vm.emails.length === 0 && (
                <div className="item"><div className="grow"><b>No emails yet</b><span className="sub2">Alert and workflow emails appear here as they are sent (or logged).</span></div></div>
              )}
              {vm.emails.map((m) => (
                <div className="item" key={m.id}>
                  <div className="grow">
                    <b>{m.subject}</b>
                    <span className="sub2">
                      to {m.to} · {m.kind} · {m.createdAgo}
                      {m.error ? ` · error: ${m.error}` : ""}
                    </span>
                  </div>
                  <span className={`pill ${m.error ? "risk" : m.sentAt ? "ok" : "navy"}`}>
                    {m.error ? "FAILED" : m.sentAt ? `SENT ${m.sentAt}` : "LOGGED"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
