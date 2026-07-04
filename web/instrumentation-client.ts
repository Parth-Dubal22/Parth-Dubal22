/**
 * Client-side Sentry init (Next 16 instrumentation-client hook). Runs after the
 * document loads and before React hydration.
 *
 * SETUP: Create a free project at https://sentry.io, then put its DSN in
 * NEXT_PUBLIC_SENTRY_DSN (and SENTRY_DSN for the server side).
 *
 * When NEXT_PUBLIC_SENTRY_DSN is unset this is fully inert — no init, no network.
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
}

// Surface router navigation errors to Sentry when configured (no-op otherwise).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
