/**
 * Scheduled ingest — Vercel Cron entrypoint (see web/vercel.json).
 *
 * Re-checks the STALEST companies first (data-freshness discipline, CLAUDE.md
 * §ACL "show data freshness"; badge monthly re-check §7): for each it re-runs
 * the ABR + VBA + source pipeline via ingestAbn(), which upserts the record,
 * bumps lastCheckedAt, and files any NEW signals as PENDING (never auto-approved
 * — the human review queue still gates every alert per §4.1).
 *
 * Auth: Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when the
 * CRON_SECRET env var is set. We reject anything else in production so the
 * endpoint can't be triggered by the public. In fixture mode (no ABR_GUID) it
 * still runs against the seeded demo ABNs, which is handy for local testing.
 */
import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { ingestAbn } from "@/lib/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds — stay within the platform function limit

/** How many companies to refresh per run (stalest first). Tune with the cron
 *  cadence: BATCH × runs-per-month should cover the whole book each month. */
const BATCH = Number(process.env.INGEST_BATCH ?? 25);

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // No secret configured (local/dev): allow, so `curl` testing works offline.
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const companies = await db
    .select({ id: tables.companies.id, abn: tables.companies.abn, name: tables.companies.name })
    .from(tables.companies)
    // NULLS FIRST → never-checked companies get priority, then the stalest.
    .orderBy(asc(tables.companies.lastCheckedAt))
    .limit(BATCH);

  let ok = 0;
  let failed = 0;
  let newSignals = 0;
  const errors: { abn: string; error: string }[] = [];

  for (const c of companies) {
    try {
      const r = await ingestAbn(c.abn);
      if (r) {
        ok++;
        newSignals += r.signalsInsertedPending;
      } else {
        failed++;
        errors.push({ abn: c.abn, error: "no ABR record" });
      }
    } catch (e) {
      failed++;
      errors.push({ abn: c.abn, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const fixture = !process.env.ABR_GUID;
  return NextResponse.json({
    ok: true,
    mode: fixture ? "fixture" : "live",
    checked: companies.length,
    refreshed: ok,
    failed,
    newSignalsPending: newSignals,
    durationMs: Date.now() - started,
    ...(errors.length ? { errors: errors.slice(0, 10) } : {}),
  });
}
