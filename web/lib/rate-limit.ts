/**
 * Shared rate limiter for BuildSafe API routes.
 *
 * Two backends, chosen automatically at runtime:
 *   1. Upstash Redis (sliding window) — used when both UPSTASH_REDIS_REST_URL
 *      and UPSTASH_REDIS_REST_TOKEN are set. Correct across serverless replicas.
 *   2. In-memory sliding window — the fallback for local dev / single instance.
 *      Emits a ONE-TIME warning because it is per-process and does NOT coordinate
 *      across replicas, so on Vercel/multi-instance it under-counts.
 *
 * DESIGN TRADEOFF — FAIL OPEN: if the limiter (or Redis) throws for any reason we
 * return `{ ok: true }`. A rate limiter is a guard rail, not a gate: a Redis
 * outage must never lock legitimate users out of the whole product. We accept
 * that an infra failure temporarily disables throttling rather than the app.
 */
import { NextResponse } from "next/server";
import type { Ratelimit as RatelimitType } from "@upstash/ratelimit";

export type RateLimitResult = { ok: boolean; retryAfter: number };
export type RateLimitOpts = { limit: number; windowMs: number };

/* ------------------------------------------------------------------ *
 * Backend selection
 * ------------------------------------------------------------------ */

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let warnedInMemory = false;
function warnInMemoryOnce() {
  if (warnedInMemory) return;
  warnedInMemory = true;
  console.warn(
    "[rate-limit] Using in-memory rate limiting. This is per-instance only and " +
      "is NOT safe across serverless replicas — set UPSTASH_REDIS_REST_URL and " +
      "UPSTASH_REDIS_REST_TOKEN for shared, replica-correct limiting.",
  );
}

/* --- Upstash backend (lazy, one Ratelimit instance per limit+window) --- */

let upstashRedis: unknown;
const upstashLimiters = new Map<string, RatelimitType>();

async function upstashCheck(
  key: string,
  { limit, windowMs }: RateLimitOpts,
): Promise<RateLimitResult> {
  // Lazy-load so the SDKs never touch the network unless configured.
  const [{ Ratelimit }, { Redis }] = await Promise.all([
    import("@upstash/ratelimit"),
    import("@upstash/redis"),
  ]);
  if (!upstashRedis) {
    upstashRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  const bucket = `${limit}:${windowMs}`;
  let limiter = upstashLimiters.get(bucket);
  if (!limiter) {
    limiter = new Ratelimit({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      redis: upstashRedis as any,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "buildsafe/rl",
    });
    upstashLimiters.set(bucket, limiter);
  }
  const res = await limiter.limit(key);
  const retryAfter = res.success
    ? 0
    : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
  return { ok: res.success, retryAfter };
}

/* --- In-memory backend (sliding window over timestamps) --- */

const memHits = new Map<string, number[]>();

function memoryCheck(
  key: string,
  { limit, windowMs }: RateLimitOpts,
): RateLimitResult {
  warnInMemoryOnce();
  const now = Date.now();
  const recent = (memHits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    memHits.set(key, recent);
    const oldest = recent[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { ok: false, retryAfter };
  }
  recent.push(now);
  memHits.set(key, recent);
  // Bound memory: periodically sweep fully-expired keys.
  if (memHits.size > 5000) {
    for (const [k, times] of memHits) {
      if (times.every((t) => now - t >= windowMs)) memHits.delete(k);
    }
  }
  return { ok: true, retryAfter: 0 };
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

/**
 * Consume one token for `key`. Returns `{ ok, retryAfter }` where `retryAfter`
 * is seconds until the caller may retry (0 when allowed). Fails open on error.
 */
export async function rateLimit(
  key: string,
  opts: RateLimitOpts,
): Promise<RateLimitResult> {
  try {
    if (hasUpstash) return await upstashCheck(key, opts);
    return memoryCheck(key, opts);
  } catch (err) {
    // FAIL OPEN — never let a limiter fault take the route down.
    console.error("[rate-limit] check failed, failing open:", err);
    return { ok: true, retryAfter: 0 };
  }
}

/**
 * Best-effort client IP. Next 16 has no `req.ip`, so read the standard proxy
 * headers: first hop of x-forwarded-for, then x-real-ip, then "unknown".
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Build a rate-limit key for an authenticated route: prefer the user id, fall
 * back to the client IP if somehow unauthenticated. `scope` namespaces routes so
 * one route's traffic never eats another's budget.
 */
export function userKey(
  scope: string,
  user: { id: number } | null | undefined,
  req?: Request,
): string {
  if (user) return `${scope}:u:${user.id}`;
  return `${scope}:ip:${req ? clientIp(req) : "unknown"}`;
}

/** Standard 429 response with a Retry-After header (seconds). */
export function tooMany(retryAfter: number): NextResponse {
  return NextResponse.json(
    { ok: false, error: "Too many requests — try again shortly." },
    { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfter)) } },
  );
}
