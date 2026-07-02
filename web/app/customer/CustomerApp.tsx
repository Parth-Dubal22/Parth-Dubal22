"use client";
/** Customer app shell — ported 1:1 from site/app-customer.html (sbtn/panel tabs,
 *  mobile burger, prototype markup + copy). All mutations go through API routes.
 *  Customers see positive/neutral info only — verified badge or a neutral pill. */
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Art from "@/components/Art";
import Stars from "@/components/Stars";
import { toast } from "@/components/Toast";
import { initials, timeAgo } from "@/lib/format";
import type { CustomerMe, DirectoryBuilder, QuoteRequestItem } from "./types";

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    slug?: string;
  };
  if (!res.ok || data.ok === false) throw new Error(data.error || "Something went wrong");
  return data;
}

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

type TabId = "c-find" | "c-check" | "c-req";

const TABS: { id: TabId; label: string; ic: React.ReactNode }[] = [
  {
    id: "c-find",
    label: "Find a builder",
    ic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    ),
  },
  {
    id: "c-check",
    label: "Deposit-safety check",
    ic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "c-req",
    label: "My requests",
    ic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 11.5a8.5 8.5 0 01-8.5 8.5 8.4 8.4 0 01-4-.98L3 20l1-5.5a8.5 8.5 0 1117-3z" />
      </svg>
    ),
  },
];

type DirFilter = "all" | "verified" | "townhouses" | "renovations";

const FILTER_CHIPS: { id: DirFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "verified", label: "Verified only" },
  { id: "townhouses", label: "Townhouses" },
  { id: "renovations", label: "Renovations" },
];

/* quote-request status → prototype pill (sent = "AWAITING REPLY") */
const REQ_PILL: Record<QuoteRequestItem["status"], [string, string]> = {
  sent: ["AWAITING REPLY", "navy"],
  replied: ["REPLIED", "ok"],
  closed: ["CLOSED", "navy"],
};

/* ------- builder card (prototype bcard, customer variant) -------
 * Verified badge or a NEUTRAL pill only — never a risk status on the customer side. */
function BuilderCard({
  b,
  busy,
  onQuote,
}: {
  b: DirectoryBuilder;
  busy: boolean;
  onQuote: (b: DirectoryBuilder) => void;
}) {
  return (
    <div className="bcard rv">
      <Art kind={b.artKind} label={b.location} />
      <div className="bod">
        <div className="nm">
          <div>
            <h4>{b.name}</h4>
            <div className="loc">{b.licence} · ABN {b.abn}</div>
          </div>
          {b.verified ? (
            <span className="vbadge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Verified
            </span>
          ) : (
            <span className="pill navy">MONITORED</span>
          )}
        </div>
        <div className="rw">
          {b.rating != null ? (
            <>
              <Stars rating={b.rating} /> <b>{b.rating}</b> · {b.reviewCount} reviews
            </>
          ) : (
            <>No reviews yet</>
          )}
        </div>
        <div className="cta">
          <Link className="btn btn-d btn-s" href={`/b/${b.slug}`}>View profile</Link>
          <button
            className="btn btn-g btn-s"
            onClick={() => onQuote(b)}
            disabled={busy}
            aria-label={`Request quote from ${b.name}`}
          >
            Request quote
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerApp({
  me,
  directory,
  requests,
}: {
  me: CustomerMe;
  directory: DirectoryBuilder[];
  requests: QuoteRequestItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("c-find");
  const [sideOpen, setSideOpen] = useState(false);

  /* directory filters (prototype renderDir) */
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<DirFilter>("all");
  const list = useMemo(() => {
    const ql = q.toLowerCase();
    let l = directory.filter((b) => b.name.toLowerCase().includes(ql));
    if (filter === "verified") l = l.filter((b) => b.verified);
    if (filter === "townhouses")
      l = l.filter((b) => {
        const t = b.tags.join(" ").toLowerCase();
        return t.includes("town") || t.includes("multi");
      });
    if (filter === "renovations")
      l = l.filter((b) => b.tags.join(" ").toLowerCase().includes("renov"));
    return l;
  }, [directory, q, filter]);

  /* quote request → my requests */
  const [quoteBusy, setQuoteBusy] = useState<number | null>(null);
  async function requestQuote(b: DirectoryBuilder) {
    if (quoteBusy != null) return;
    setQuoteBusy(b.id);
    try {
      await api("/api/quotes", "POST", { companyId: b.id });
      toast("Quote request sent to " + b.name + " — they'll reply in-app");
      router.refresh();
    } catch (err) {
      toast(msg(err));
    } finally {
      setQuoteBusy(null);
    }
  }

  /* deposit check */
  const [chkQ, setChkQ] = useState("");
  const [chkAmt, setChkAmt] = useState("");
  const [chkBusy, setChkBusy] = useState(false);
  const [chkFail, setChkFail] = useState(false);
  async function runCheck(e: React.FormEvent) {
    e.preventDefault();
    const query = chkQ.trim();
    if (!query || chkBusy) return;
    setChkBusy(true);
    setChkFail(false);
    try {
      const data = await api("/api/check", "POST", { query });
      if (!data.slug) throw new Error("No result");
      const amt = Number(chkAmt) || 0;
      router.push(`/check/${data.slug}${amt ? `?deposit=${amt}` : ""}`);
    } catch {
      setChkFail(true);
      setChkBusy(false);
    }
  }

  function pick(id: TabId) {
    setTab(id);
    setSideOpen(false);
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      <div className="appbar">
        <button
          className="burger" style={{ display: "flex" }} aria-label="Menu"
          aria-expanded={sideOpen} onClick={() => setSideOpen(!sideOpen)}
        >
          <span style={{ background: "#fff" }}></span>
          <span style={{ background: "#fff" }}></span>
          <span style={{ background: "#fff" }}></span>
        </button>
        <b style={{ fontFamily: "var(--fd)" }}>BuildSafe · Customer</b>
        <Link href="/" className="mono" style={{ fontSize: ".62rem", color: "#9DB0CC" }}>EXIT</Link>
      </div>

      <div className="app">
        <aside className={"side" + (sideOpen ? " open" : "")}>
          <Link className="logo" href="/">
            <span className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            BuildSafe
          </Link>
          <span className="role">CUSTOMER APP</span>
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
            <span className="avatar" style={{ background: "#2E5E8F" }}>{initials(me.name)}</span>
            <div>
              <b>{me.name}</b>
              <span>{me.subline}</span>
            </div>
          </div>
        </aside>

        <main className="main">
          {/* FIND */}
          <div className={"panel" + (tab === "c-find" ? " on" : "")} id="c-find">
            <div className="topbar"><h2>Find a builder you can trust with a deposit</h2></div>
            <div className="filters">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search builders…"
                aria-label="Search builders"
                style={{ maxWidth: 260 }}
              />
              {FILTER_CHIPS.map((c) => (
                <button
                  key={c.id}
                  className={"chip" + (filter === c.id ? " on" : "")}
                  onClick={() => setFilter(c.id)}
                  aria-pressed={filter === c.id}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="grid3" id="dir">
              {list.map((b) => (
                <BuilderCard key={b.id} b={b} busy={quoteBusy === b.id} onQuote={requestQuote} />
              ))}
              {list.length === 0 ? (
                <div className="card">
                  <h3>No matches</h3>
                  <p>
                    Try clearing filters — or check any builder by ABN in the Deposit-safety
                    tab; they don&apos;t need a profile for you to check them.
                  </p>
                </div>
              ) : null}
            </div>
            <p className="hint" style={{ marginTop: "1rem" }}>
              Ratings include reviews from the subbies each builder pays — a trust signal no
              other directory has.
            </p>
          </div>

          {/* CHECK */}
          <div className={"panel" + (tab === "c-check" ? " on" : "")} id="c-check">
            <div className="topbar"><h2>Deposit-safety check</h2><span className="pill ok">FREE FOREVER</span></div>
            <div className="grid2">
              <form className="card form" style={{ padding: "1.6rem" }} id="chk-form" onSubmit={runCheck}>
                <label>
                  Builder name or ABN
                  <input
                    type="text"
                    value={chkQ}
                    onChange={(e) => setChkQ(e.target.value)}
                    placeholder="Try: Harbourline / Redgum / Bassline / Southpoint"
                  />
                </label>
                <label>
                  Deposit you&apos;re about to pay (optional)
                  <input
                    type="number"
                    value={chkAmt}
                    onChange={(e) => setChkAmt(e.target.value)}
                    placeholder="e.g. 35000"
                  />
                </label>
                <button className="btn btn-p btn-lg" style={{ justifySelf: "start" }} disabled={chkBusy}>
                  Run check →
                </button>
                <p className="hint">
                  Pulls company status, licence standing and adverse public records into one
                  plain-English answer — with sources.
                </p>
              </form>
              <div id="chk-out">
                {chkFail ? (
                  <div className="card">
                    <h3>Demo dataset</h3>
                    <p>
                      Try: Harbourline, Bassline, Redgum or Southpoint. At launch this searches
                      every registered Australian builder.
                    </p>
                  </div>
                ) : (
                  <div className="card">
                    <h3>What you&apos;ll see</h3>
                    <p>
                      A plain-English snapshot of published facts — registration status, licence
                      standing and a count of adverse public records, each linked to its source,
                      with the date we checked. Keep deposits within Victoria&apos;s statutory limits
                      and pay by stages.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* REQUESTS */}
          <div className={"panel" + (tab === "c-req" ? " on" : "")} id="c-req">
            <div className="topbar"><h2>My quote requests</h2></div>
            <div className="list" id="reqs">
              {requests.length === 0 ? (
                <div className="card">
                  <p>
                    No requests yet — find a builder and tap <b>Request quote</b>. They reply
                    here with their Verified status attached.
                  </p>
                </div>
              ) : (
                requests.map((r) => {
                  const pill = REQ_PILL[r.status];
                  return (
                    <div className="item" key={r.id}>
                      <span className="avatar" style={{ background: "#2E5E8F" }}>{initials(r.companyName)}</span>
                      <div className="grow">
                        <b>Quote request — {r.companyName}</b>
                        <span className="sub2" suppressHydrationWarning>
                          Sent {timeAgo(r.createdAt)}{r.verified ? " · VERIFIED BUILDER" : ""}
                        </span>
                      </div>
                      <span className={`pill ${pill[1]}`}>{pill[0]}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
