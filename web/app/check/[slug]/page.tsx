import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { formatAbn, fmtDate, money } from "@/lib/format";
import LandingNav from "@/components/landing/LandingNav";

/**
 * PUBLIC shareable check result. Facts + statuses + counts ONLY — no risk
 * scores, no risk levels, no signal titles. Every fact links to the public
 * register it came from, with a "last checked" freshness line.
 */

const TIER_LABEL: Record<string, string> = {
  id_verified: "ID Verified",
  buildsafe_verified: "BuildSafe Verified",
  track_record: "Verified + Track Record",
};

const getCheck = cache(async (slug: string) => {
  const check = await db.query.builderChecks.findFirst({
    where: eq(tables.builderChecks.slug, slug),
  });
  if (!check) return null;
  const company = check.companyId
    ? await db.query.companies.findFirst({
        where: eq(tables.companies.id, check.companyId),
        columns: { slug: true },
      })
    : null;
  return { check, companySlug: company?.slug ?? null };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const p = await params;
  const data = await getCheck(p.slug);
  const name = data?.check.snapshot.name ?? data?.check.query ?? "builder";
  return {
    title: `Builder check — ${name}`,
    description: `Free BuildSafe builder check for ${name}: registration status, licence standing and public-record count — facts from public registers, with sources and a last-checked date.`,
  };
}

function SourceLinks({ sources }: { sources: { name: string; url?: string }[] }) {
  return (
    <>
      {sources.map((s, i) => (
        <span key={s.name}>
          {i > 0 && " · "}
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.name}
            </a>
          ) : (
            s.name
          )}
        </span>
      ))}
    </>
  );
}

/** Victoria domestic-building statutory deposit limits (general info, not advice):
 *  Domestic Building Contracts Act 1995 (Vic) — max 10% where contract price < $20,000,
 *  otherwise max 5%. */
function vicDepositCeiling(contractPrice: number): { pct: number; amount: number } {
  const pct = contractPrice < 20000 ? 10 : 5;
  return { pct, amount: Math.round((contractPrice * pct) / 100) };
}

export default async function CheckResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ deposit?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const data = await getCheck(p.slug);
  if (!data) notFound();
  const { check, companySlug } = data;
  const snap = check.snapshot;

  const depositAmt = Number(sp.deposit);
  const deposit = Number.isFinite(depositAmt) && depositAmt > 0 ? depositAmt : null;

  const found = check.companyId != null;
  const abnSource = snap.sources.find((s) => s.name === "ABN Lookup");
  const vbaSource = snap.sources.find((s) => s.name === "VBA register");
  const asicSource = snap.sources.find((s) => s.name === "ASIC published notices");
  const checkedAt = new Date(snap.checkedAt);
  const tierLabel = snap.verifiedTier ? TIER_LABEL[snap.verifiedTier] : undefined;

  return (
    <>
      <LandingNav />

      <section>
        <div className="wrap-narrow">
          <span className="eyebrow">Free builder check · Public-record snapshot</span>
          <div className="actions" style={{ marginTop: "var(--s4)" }}>
            <h2>{snap.name ?? check.query}</h2>
            {tierLabel && (
              <span className="vbadge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {tierLabel}
              </span>
            )}
          </div>
          <div className="micro" style={{ marginTop: "var(--s2)" }}>
            {snap.abn ? `ABN ${formatAbn(snap.abn)} · ` : ""}CHECKED {fmtDate(checkedAt)} · QUERY: {check.query.toUpperCase()}
          </div>

          {found ? (
            <div className="list" style={{ marginTop: "var(--stack-gap)" }}>
              {/* Registration */}
              <div className="item">
                <div className="grow">
                  <b>Business registration</b>
                  <div className="srcline">
                    {snap.entityType ? `${snap.entityType} · ` : ""}
                    Source:{" "}
                    {abnSource?.url ? (
                      <a href={abnSource.url} target="_blank" rel="noopener noreferrer">
                        ABN Lookup
                      </a>
                    ) : (
                      "ABN Lookup"
                    )}
                  </div>
                </div>
                <span className={`pill ${snap.abnStatus?.toLowerCase() === "active" ? "ok" : "navy"}`}>
                  {snap.abnStatus ? snap.abnStatus.toUpperCase() : "NOT ON FILE"}
                </span>
              </div>

              {/* Licence */}
              <div className="item">
                <div className="grow">
                  <b>Builder licence</b>
                  <div className="srcline">
                    {snap.licenceNumber ? `${snap.licenceNumber} · ` : ""}
                    Source:{" "}
                    {vbaSource?.url ? (
                      <a href={vbaSource.url} target="_blank" rel="noopener noreferrer">
                        {snap.licenceSource || "VBA register"}
                      </a>
                    ) : (
                      snap.licenceSource || "VBA register"
                    )}
                  </div>
                </div>
                <span className={`pill ${["active", "current", "registered"].includes(snap.licenceStatus?.toLowerCase() ?? "") ? "ok" : "navy"}`}>
                  {snap.licenceStatus ? snap.licenceStatus.toUpperCase() : "NOT ON FILE"}
                </span>
              </div>

              {/* Verification tier */}
              <div className="item">
                <div className="grow">
                  <b>BuildSafe verification</b>
                  <div className="srcline">
                    Published criteria · re-checked monthly · revoked instantly if standing changes
                  </div>
                </div>
                {tierLabel ? (
                  <span className="vbadge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {tierLabel}
                  </span>
                ) : (
                  <span className="pill navy">NOT VERIFIED YET</span>
                )}
              </div>

              {/* Public record count — a count is a fact */}
              <div className="item">
                <div className="grow">
                  <b>
                    Public records found in the last 24 months:{" "}
                    {snap.publicRecordCount ?? 0}
                  </b>
                  <div className="srcline">
                    Adverse records published by the registers we monitor. Verify at the source:{" "}
                    <SourceLinks sources={snap.sources} />
                  </div>
                </div>
                <span className={`pill ${(snap.publicRecordCount ?? 0) > 0 ? "navy" : "ok"}`}>
                  {(snap.publicRecordCount ?? 0) > 0
                    ? `${snap.publicRecordCount} ON RECORD`
                    : "NONE LOCATED"}
                </span>
              </div>
            </div>
          ) : (
            <div className="card" style={{ marginTop: "var(--stack-gap)" }}>
              <h3>No record found</h3>
              <p>
                We couldn&rsquo;t match &ldquo;{check.query}&rdquo; in the public registers we
                checked ({snap.sources.map((s) => s.name).join(", ")}). That is all this result
                means — we never guess and we never fill gaps. Try the exact 11-digit ABN from a
                quote or invoice, or check the spelling of the trading name.
              </p>
              <div className="srcline" style={{ marginTop: "var(--s3)" }}>
                Search the registers yourself: <SourceLinks sources={snap.sources} />
              </div>
            </div>
          )}

          {deposit ? (
            <div className="card strip-ok" style={{ marginTop: "var(--stack-gap)" }}>
              <h3 style={{ marginBottom: "var(--s2)" }}>Your deposit: {money(deposit)}</h3>
              <p style={{ margin: 0 }}>
                For a Victorian domestic building contract of {money(deposit)}, the statutory
                deposit ceiling is{" "}
                <b>
                  {vicDepositCeiling(deposit).pct}% ({money(vicDepositCeiling(deposit).amount)})
                </b>{" "}
                — {deposit < 20000 ? "contracts under $20,000" : "contracts of $20,000 or more"}{" "}
                are capped by the Domestic Building Contracts Act 1995 (Vic). Pay by staged progress
                claims tied to completed work, and re-check the builder before each stage. General
                information only, not legal or financial advice.
              </p>
            </div>
          ) : null}

          <p className="micro" style={{ marginTop: "var(--s4)" }}>
            LAST CHECKED {fmtDate(checkedAt)} · RECORDS CAN CHANGE — RE-CHECK BEFORE PAYING
          </p>

          {/* CTAs */}
          <div className="actions" style={{ marginTop: "var(--stack-gap)" }}>
            <a className="btn btn-p" href="/onboarding?role=tradie">
              Watch this builder 24/7 →
            </a>
            <a className="btn btn-d" href="/onboarding?role=customer">
              Get a deposit-safety read →
            </a>
            {companySlug && (
              <a className="btn btn-g" href={`/b/${companySlug}`}>
                Full profile &amp; reviews
              </a>
            )}
            <Link className="btn btn-g" href="/check">
              Run another free check
            </Link>
          </div>

          {/* Disclaimer */}
          <p className="f-legal" style={{ marginTop: "var(--s7)" }}>
            This is a snapshot of facts drawn from public registers at the time of the check
            shown above — registration and licence statuses as published, and a count of adverse
            public records from the last 24 months, each verifiable at its source. It is general
            information for business purposes only, not legal, financial or credit advice, and
            not a consumer credit report. It is not a prediction of any company&rsquo;s future
            performance or solvency. Records change: always re-check before signing or paying,
            and verify anything important at the linked source. Builders may request corrections
            at any time — we review disputes within 48 hours.
          </p>
        </div>
      </section>
    </>
  );
}
