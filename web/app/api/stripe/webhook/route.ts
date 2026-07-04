import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db, tables } from "@/lib/db";
import { getStripe, isStripeLive, mapStripeStatus, subscriptionPeriodEnd } from "@/lib/stripe";

/**
 * POST /api/stripe/webhook — Stripe signature auth.
 * Verifies the signature against the RAW body, then syncs subscription state:
 *   checkout.session.completed        → activate sub, store stripe ids
 *   customer.subscription.updated     → sync status + currentPeriodEnd
 *   customer.subscription.deleted     → mark canceled
 * 400 on bad/missing signature.
 */

export const runtime = "nodejs";

type Plan = "tradie_watch" | "builder_pro";
const isPlan = (v: unknown): v is Plan => v === "tradie_watch" || v === "builder_pro";

// NOT rate-limited on purpose: this endpoint is authenticated by Stripe's
// signature (constructEvent below), and throttling it risks dropping legitimate
// Stripe webhook events (Stripe retries, but a 429 during a burst could delay
// subscription state sync). Signature verification is the guard here.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!isStripeLive() || !secret || !signature) {
    return NextResponse.json({ ok: false, error: "Webhook not configured or unsigned." }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription") break;

      const userId = Number(session.metadata?.userId ?? session.client_reference_id);
      if (!Number.isInteger(userId) || userId <= 0) break;

      const stripeSubscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

      let currentPeriodEnd: Date | null = null;
      if (stripeSubscriptionId) {
        const sub = await getStripe().subscriptions.retrieve(stripeSubscriptionId);
        currentPeriodEnd = subscriptionPeriodEnd(sub);
      }

      const plan = isPlan(session.metadata?.plan) ? session.metadata.plan : undefined;
      await db
        .insert(tables.subscriptions)
        .values({
          userId,
          plan: plan ?? "tradie_watch",
          status: "active",
          stripeCustomerId,
          stripeSubscriptionId,
          currentPeriodEnd,
        })
        .onConflictDoUpdate({
          target: tables.subscriptions.userId,
          set: {
            ...(plan ? { plan } : {}),
            status: "active",
            stripeCustomerId,
            stripeSubscriptionId,
            currentPeriodEnd,
          },
        });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const status = event.type === "customer.subscription.deleted" ? "canceled" : mapStripeStatus(sub.status);
      const currentPeriodEnd = subscriptionPeriodEnd(sub);

      const updated = await db
        .update(tables.subscriptions)
        .set({ status, currentPeriodEnd })
        .where(eq(tables.subscriptions.stripeSubscriptionId, sub.id))
        .returning({ id: tables.subscriptions.id });

      // Fallback: match by the userId we stamped into subscription metadata.
      if (updated.length === 0) {
        const userId = Number(sub.metadata?.userId);
        if (Number.isInteger(userId) && userId > 0) {
          await db
            .update(tables.subscriptions)
            .set({ status, currentPeriodEnd, stripeSubscriptionId: sub.id })
            .where(eq(tables.subscriptions.userId, userId));
        }
      }
      break;
    }

    default:
      break; // acknowledge everything else
  }

  return NextResponse.json({ ok: true });
}
