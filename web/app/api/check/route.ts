/**
 * POST /api/check — free builder check (public, no signup).
 * Body: { query: string } (builder name or ABN) → { ok: true, slug }.
 * Lightly rate-limited per IP (20/hour, in-memory, fail-open).
 */
import { NextResponse } from "next/server";
import { runCheck } from "@/app/check/run-check";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

/** True when this IP is over the limit. Fail-open: any error means "not limited". */
function rateLimited(ip: string): boolean {
  try {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_PER_WINDOW) {
      hits.set(ip, recent);
      return true;
    }
    recent.push(now);
    hits.set(ip, recent);
    // Keep the map from growing unbounded.
    if (hits.size > 5000) {
      for (const [key, times] of hits) {
        if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
      }
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many checks from this connection — try again in an hour." },
      { status: 429 },
    );
  }

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
