/**
 * Stripe client — lazy-initialised so the whole app runs without keys.
 * No STRIPE_SECRET_KEY ⇒ demo mode: subscriptions activate instantly in the DB
 * and the UI shows a "demo mode — Stripe keys not configured" toast.
 * Business rules baked in: no lock-ins, cancel anytime (cancel_at_period_end).
 */
import Stripe from "stripe";

let client: Stripe | null = null;

/** True when a real Stripe secret key is configured. */
export function isStripeLive(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Lazily construct (and cache) the Stripe client. Throws in demo mode. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY unset — demo mode).");
  if (!client) client = new Stripe(key);
  return client;
}

export type Plan = "tradie_watch" | "builder_pro";

export const PLANS: Record<
  Plan,
  { label: string; priceCents: number; priceEnv: string; role: "tradie" | "builder" }
> = {
  tradie_watch: { label: "Tradie Watch", priceCents: 2900, priceEnv: "STRIPE_PRICE_TRADIE", role: "tradie" },
  builder_pro: { label: "Builder Pro", priceCents: 9900, priceEnv: "STRIPE_PRICE_BUILDER", role: "builder" },
};

/** Stripe price id for a plan (live mode only). */
export function planPriceId(plan: Plan): string | undefined {
  return process.env[PLANS[plan].priceEnv];
}

/** App origin for Checkout success/cancel URLs. */
export function appUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (req) return new URL(req.url).origin;
  return "http://localhost:3000";
}

/**
 * Current period end. Stripe API 2025-03-31+ moved current_period_end from the
 * Subscription object onto its items; read it from the first item.
 */
export function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const end = sub.items?.data?.[0]?.current_period_end;
  return typeof end === "number" ? new Date(end * 1000) : null;
}

/** Map a Stripe subscription status onto our subscription_status enum. */
export function mapStripeStatus(
  status: Stripe.Subscription.Status,
): "active" | "past_due" | "canceled" | "incomplete" {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}
