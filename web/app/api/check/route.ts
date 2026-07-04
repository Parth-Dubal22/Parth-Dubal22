/**
 * POST /api/check — free builder check (public, no signup).
 * Body: { query: string } (builder name or ABN) → { ok: true, slug }.
 * Lightly rate-limited per IP (20/hour, in-memory, fail-open).
 */
import { NextResponse } from "next/server";
import { runCheck } from "@/app/check/run-check";
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Public, IP-keyed: 20 checks / hour / IP (shared limiter, fail-open).
  const rl = await rateLimit(`check:ip:${clientIp(req)}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) return tooMany(rl.retryAfter);

  let query = "";
  try {
    const body = (await req.json()) as { query?: unknown };
    query = String(body?.query ?? "").trim();
  } catch {
    query = "";
  }
  if (!query) {
    return NextResponse.json(
      { ok: false, error: "Enter a builder name or ABN." },
      { status: 400 },
    );
  }

  try {
    const slug = await runCheck(query);
    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    console.error("check failed:", err);
    return NextResponse.json(
      { ok: false, error: "Check failed — please try again." },
      { status: 500 },
    );
  }
}
