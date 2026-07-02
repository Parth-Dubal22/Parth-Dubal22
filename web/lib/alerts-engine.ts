/**
 * Alert engine core — fan out one APPROVED signal to everyone watching the
 * company. In-app alert row for every watcher; email (via lib/mail, logged to
 * email_log when SMTP is unset) for watchers with emailAlerts on. SMS (Twilio)
 * comes later on the same fan-out.
 *
 * Legal guardrails: alerts state FACTS with a named public source and date —
 * never verdicts or predictions. The "what you can consider" line is general
 * information, not legal or financial advice, and says so.
 */
import { and, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { centsToMoney, fmtDate, formatAbn } from "@/lib/format";
import { recomputeCompanyRisk } from "@/lib/risk";

/** Info-not-advice line per signal level (prototype tone, app-customer.html). */
const CONSIDER: Record<"ok" | "watch" | "risk", string> = {
  risk:
    "What you can consider: read the cited source document, keep your logged exposure current, " +
    "and consider talking to a construction lawyer before signing, paying or extending further credit.",
  watch:
    "What you can consider: keep your logged exposure current, keep deposits at the legal minimum, " +
    "insist on staged payments, and re-check before each stage.",
  ok:
    "Nothing to action — we'll keep watching and alert you if anything changes.",
};

const NOT_ADVICE = "General information from public records — not legal or financial advice.";

export async function dispatchAlertsForSignal(
  signalId: number
): Promise<{ alerted: number }> {
  const signal = await db.query.signals.findFirst({
    where: eq(tables.signals.id, signalId),
    with: { company: true },
  });
  // Only approved signals ever reach watchers (human-in-the-loop).
  if (!signal || signal.status !== "approved" || !signal.company) {
    return { alerted: 0 };
  }
  const company = signal.company;

  const watchers = await db.query.watchlistItems.findMany({
    where: eq(tables.watchlistItems.companyId, company.id),
    with: { user: true },
  });

  let alerted = 0;
  for (const w of watchers) {
    if (!w.user) continue;

    // Idempotent fan-out: never alert the same user twice for one signal.
    const existing = await db.query.alerts.findFirst({
      where: and(
        eq(tables.alerts.userId, w.userId),
        eq(tables.alerts.signalId, signal.id)
      ),
    });
    if (existing) continue;

    await db.insert(tables.alerts).values({
      userId: w.userId,
      signalId: signal.id,
      channel: "in_app",
      deliveredAt: new Date(),
    });
    alerted++;

    if (w.user.emailAlerts) {
      // The watcher's logged $ exposure to this company, if any.
      const exposure = await db.query.exposureEntries.findMany({
        where: and(
          eq(tables.exposureEntries.userId, w.userId),
          eq(tables.exposureEntries.companyId, company.id)
        ),
      });
      const exposedCents = exposure.reduce((a, e) => a + e.amountCents, 0);

      const lines = [
        signal.title,
        "",
        `Company: ${company.name} — ABN ${formatAbn(company.abn)}`,
        `Occurred: ${fmtDate(signal.occurredOn)}`,
        `Source: ${signal.sourceName}${signal.sourceUrl ? ` — ${signal.sourceUrl}` : ""}`,
      ];
      if (signal.detail) lines.push("", signal.detail);
      if (exposedCents > 0) {
        lines.push(
          "",
          `You have ${centsToMoney(exposedCents)} logged against this company in your exposure tracker.`
        );
      }
      lines.push("", CONSIDER[signal.level], NOT_ADVICE);

      await sendMail({
        userId: w.userId,
        to: w.user.email,
        subject: `[BuildSafe] ${signal.title} — ${company.name}`,
        body: lines.join("\n"),
        kind: "signal_alert",
      });
    }
  }

  await recomputeCompanyRisk(company.id);
  return { alerted };
}
