/**
 * Server/edge observability (Sentry) via Next's instrumentation hook.
 *
 * We deliberately use the INSTRUMENTATION HOOK, not the @sentry/nextjs webpack
 * build plugin: this project builds with Turbopack, and the webpack plugin would
 * break the build. This approach needs no wizard and does no source-map upload.
 *
 * SETUP: Create a free project at https://sentry.io, then put its DSN in the
 * SENTRY_DSN (server) and NEXT_PUBLIC_SENTRY_DSN (client) env vars.
 *
 * When SENTRY_DSN is unset, register() is a no-op and onRequestError falls back
 * to a plain console.error — Sentry is completely inert (no network, no init).
 */
import type { Instrumentation } from "next";

export async function register() {
  if (!process.env.SENTRY_DSN) return; // inert without a DSN

  const Sentry = await import("@sentry/nextjs");
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
      // Keep it lean by default; opt into more via env in production.
    });
  }
}

/**
 * Report server errors to Sentry when configured; otherwise log locally so the
 * hook is still useful in dev/without a DSN.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureRequestError(err, request, context);
  } else {
    console.error("[onRequestError]", err);
  }
};
