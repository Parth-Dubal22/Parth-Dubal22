"use client";
/** Customer app shell — ported 1:1 from site/app-customer.html (sbtn/panel tabs,
 *  mobile burger, prototype markup + copy). All mutations go through API routes.
 *  Customers see positive/neutral info only — verified badge or a neutral pill. */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Art from "@/components/Art";
import EmptyState from "@/components/EmptyState";
import Stars from "@/components/Stars";
import { toast } from "@/components/Toast";
import { initials, timeAgo } from "@/lib/format";
import CategoryPicker from "@/components/CategoryPicker";
import { popularLabel } from "@/lib/data/categories";
import type { TileData } from "@/lib/find";
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
      {/* .photo recipe over the Art scene — company-specific cover photos arrive in R4.
          16:8 header ratio is the kept bcard spec (promote `.bcard .photo` to app.css). */}
      <div className="photo" style={{ aspectRatio: "16 / 8", borderRadius: 0 }} aria-hidden="true">
        <Art kind={b.artKind} label={b.location} style={{ position: "absolute", inset: 0 }} />
      </div>
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
            className={"btn btn-g btn-s" + (busy ? " busy" : "")}
            onClick={() => onQuote(b)}
            disabled={busy}
            aria-busy={busy || undefined}
            aria-label={`Request quote from ${b.name}`}
          >
            {busy ? "Sending…" : "Request quote"}
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
  categoryTiles,
}: {
  me: CustomerMe;
  directory: DirectoryBuilder[];
  requests: QuoteRequestItem[];
  categoryTiles: TileData[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("c-find");
  const [sideOpen, setSideOpen] = useState(false);

  /* directory filters (prototype renderDir) */
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<DirFilter>("all");
  /* R5: "what do you need done?" popular-grid category filter (single-select). */
  const [cat, setCat] = useState<string | null>(null);

  const { list, catFallback } = useMemo(() => {
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

    // Category relevance: "Builders" (building) = every builder; any other
    // category keeps companies listed under it (primary or secondary). Never
    // dead-end — if nothing matches, show verified-first and flag a fallback.
    let fallback = false;
    if (cat && cat !== "building") {
      const matched = l.filter((b) => b.categorySlugs.includes(cat));
      if (matched.length > 0) {
        l = matched;
      } else {
        fallback = true;
        l = [...l].sort((a, b) => Number(b.verified) - Number(a.verified));
      }
    }
    return { list: l, catFallback: fallback };
  }, [directory, q, filter, cat]);

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
      toast(msg(err), { kind: "error" });
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
      toast("No match found — try Harbourline, Bassline, Redgum or Southpoint", { kind: "error" });
    }
  }

  function pick(id: TabId) {
    setTab(id);
    setSideOpen(false);
    window.scrollTo({ top: 0 });
  }

  /* MASTER §7 mobile drawer contract: scrim + Escape-close + body scroll lock,
     focus returned to the burger. */
  const burgerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!sideOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSideOpen(false);
        burgerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sideOpen]);

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
        <b>BuildSafe · Customer</b>
        <Link href="/" className="exit">EXIT</Link>
      </div>

      <div className="app">
        {sideOpen ? (
          <button
            className="side-scrim"
            aria-label="Close menu"
            onClick={() => {
              setSideOpen(false);
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
            <span className="avatar" style={{ background: "var(--av-1)" }}>{initials(me.name)}</span>
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

            {/* R5: "what do you need done?" popular-category grid (compact). */}
            <div className="topbar" style={{ marginBottom: "var(--s2)" }}>
              <h3 style={{ fontSize: "1.05rem" }}>What do you need done?</h3>
              {cat ? (
                <button className="btn btn-g btn-s" onClick={() => setCat(null)}>
                  Clear “{popularLabel(cat)}”
                </button>
              ) : null}
            </div>
            <CategoryPicker
              tiles={categoryTiles}
              selected={cat ? [cat] : []}
              onToggle={(slug) => setCat((c) => (c === slug ? null : slug))}
              ariaLabel="Filter builders by category"
            />
            <p className="hint" style={{ margin: "var(--s3) 0 var(--s4)" }}>
              Browse the full list on <Link href="/find">Find a pro</Link> — 200+ trades, each pro
              checked against public records.
            </p>

            {cat && catFallback ? (
              <p className="note info" role="status">
                No builder is listed under <b>{popularLabel(cat)}</b> yet — showing verified
                builders you can still check by ABN. Every builder can be checked whether or not
                they have a profile.
              </p>
            ) : null}

            <div className="filters">
              <input
                type="text"
                className="w-m"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search builders…"
                aria-label="Search builders"
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
            {list.length === 0 ? (
              <EmptyState
                icon={
                  <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
                    <circle cx="31" cy="31" r="17" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M24 31a7 7 0 017-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M44 44l14 14" stroke="var(--orange)" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                }
                headline="No matches"
                body="Try clearing filters — or check any builder by ABN in the Deposit-safety tab; they don't need a profile for you to check them."
                cta={
                  <button
                    className="btn btn-g"
                    onClick={() => {
                      setQ("");
                      setFilter("all");
                      setCat(null);
                    }}
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <div className="grid3" id="dir">
                {list.map((b) => (
                  <BuilderCard key={b.id} b={b} busy={quoteBusy === b.id} onQuote={requestQuote} />
                ))}
              </div>
            )}
            <p className="hint" style={{ marginTop: "var(--s4)" }}>
              Ratings include reviews from the subbies each builder pays — a trust signal no
              other directory has.
            </p>
          </div>

          {/* CHECK */}
          <div className={"panel" + (tab === "c-check" ? " on" : "")} id="c-check">
            <div className="topbar"><h2>Deposit-safety check</h2><span className="pill ok">FREE FOREVER</span></div>
            <div className="grid2">
              <form className="card form" id="chk-form" onSubmit={runCheck}>
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
                <div className="actions">
                  <button
                    className={"btn btn-p btn-lg" + (chkBusy ? " busy" : "")}
                    disabled={chkBusy}
                    aria-busy={chkBusy || undefined}
                  >
                    {chkBusy ? "Checking…" : "Run check →"}
                  </button>
                </div>
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
                <EmptyState
                  icon={
                    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
                      <rect x="10" y="18" width="52" height="38" rx="6" stroke="currentColor" strokeWidth="2.5" />
                      <path
                        d="M13 22l23 19 23-19"
                        stroke="var(--orange)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                  headline="No requests yet"
                  body={
                    <>
                      Find a builder and tap <b>Request quote</b>. They reply here with their
                      Verified status attached.
                    </>
                  }
                  cta={
                    <button className="btn btn-p" onClick={() => pick("c-find")}>
                      Find a builder
                    </button>
                  }
                />
              ) : (
                requests.map((r) => {
                  const pill = REQ_PILL[r.status];
                  return (
                    <div className="item" key={r.id}>
                      <span className="avatar" style={{ background: "var(--av-1)" }}>{initials(r.companyName)}</span>
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
