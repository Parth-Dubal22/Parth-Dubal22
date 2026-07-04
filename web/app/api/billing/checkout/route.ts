import { NextResponse } from "next/server";
import { z } from "zod";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { rateLimit, tooMany, userKey } from "@/lib/rate-limit";
import { appUrl, getStripe, isStripeLive, planPriceId, PLANS, type Plan } from "@/lib/stripe";

/**
 * POST /api/billing/checkout — tradie/builder (admin bypass).
 * { plan:'tradie_watch'|'builder_pro' } →
 *   live: { ok, url }  (Stripe Checkout, subscription mode — no lock-ins)
 *   demo: { ok, demo:true } (no Stripe keys: subscription activates instantly)
 */

const postSchema = z.object({
  plan: z.enum(["tradie_watch", "builder_pro"]),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  const user = await apiUser("tradie", "builder");
  if (!user) return bad("Sign in as a tradie or builder to subscribe.", 401);

  const rl = await rateLimit(userKey("billing-checkout", user, req), { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooMany(rl.retryAfter);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) return bad("plan must be 'tradie_watch' or 'builder_pro'.");
  const plan: Plan = parsed.data.plan;

  // Plan ↔ role: Tradie Watch for tradies, Builder Pro for builders (admin bypass).
  if (user.role !== "admin" && user.role !== PLANS[plan].role) {
    return bad(`${PLANS[plan].label} is for ${PLANS[plan].role} accounts.`, 403);
  }

  const existing = await db.query.subscriptions.findFirst({
    where: (s, { eq }) => eq(s.userId, user.id),
  });

  /* ---------- DEMO MODE: no Stripe keys — activate instantly ---------- */
  if (!isStripeLive()) {
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db
      .insert(tables.subscriptions)
      .values({ userId: user.id, plan, status: "active", currentPeriodEnd })
      .onConflictDoUpdate({
        target: tables.subscriptions.userId,
        set: { plan, status: "active", currentPeriodEnd },
      });
    return NextResponse.json({ ok: true, demo: true });
  }

  /* ---------- LIVE MODE: Stripe Checkout (subscription) ---------- */
  const priceId = planPriceId(plan);
  if (!priceId) return bad(`Missing ${PLANS[plan].priceEnv} price id configuration.`, 500);

  const stripe = getStripe();

  // Create or reuse the Stripe customer, persisting the id on our row.
  let customerId = existing?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { buildsafeUserId: String(user.id) },
    });
    customerId = customer.id;
  }
  await db
    .insert(tables.subscriptions)
    .values({ userId: user.id, plan, status: "incomplete", stripeCustomerId: customerId })
    .onConflictDoUpdate({
      target: tables.subscriptions.userId,
      set: { plan, stripeCustomerId: customerId },
    });

  const base = appUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/pricing?status=success`,
    cancel_url: `${base}/pricing?status=canceled`,
    client_reference_id: String(user.id),
    metadata: { userId: String(user.id), plan },
    subscription_data: { metadata: { userId: String(user.id), plan } },
  });

  if (!session.url) return bad("Stripe did not return a checkout URL.", 502);
  return NextResponse.json({ ok: true, url: session.url });
}
