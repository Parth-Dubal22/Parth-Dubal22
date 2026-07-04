/**
 * Proxy (Next 16's renamed `middleware`) — runs before routes.
 *
 * Sole job here: IP-throttle credential sign-in. NextAuth is a catch-all route
 * (`/api/auth/[...nextauth]`), so we can't add a limiter inside a single handler
 * — we gate the one sensitive path (`POST /api/auth/callback/credentials`) here
 * instead: 10 attempts / 10 min / IP, then 429. This blunts password-guessing
 * without touching the rest of the auth flow (session, csrf, providers).
 *
 * FAIL OPEN: any limiter error lets the request through — a limiter fault must
 * never block legitimate logins. Kept deliberately minimal.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit";

export const config = {
  matcher: ["/api/auth/callback/credentials"],
};

export async function proxy(req: NextRequest) {
  // Only the credential login POST is throttled; let everything else pass.
  if (req.method !== "POST") return NextResponse.next();

  try {
    const rl = await rateLimit(`login:ip:${clientIp(req)}`, {
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!rl.ok) return tooMany(rl.retryAfter);
  } catch {
    // Fail open — never lock users out on a limiter fault.
  }

  return NextResponse.next();
}
