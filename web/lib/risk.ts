/**
 * Derived company risk level — highest level among APPROVED signals in the
 * last 12 months (risk > watch > ok; default ok). This is a private-facing
 * summary for subscribers/admin only (see lib/access.ts) — public pages never
 * render it, and it is framed as an opinion based on disclosed public
 * records, never a verdict or prediction.
 */
import { and, eq, gte } from "drizzle-orm";
import { db, tables } from "@/lib/db";

export async function recomputeCompanyRisk(
  companyId: number
): Promise<"ok" | "watch" | "risk"> {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);

  const rows = await db
    .select({ level: tables.signals.level })
    .from(tables.signals)
    .where(
      and(
        eq(tables.signals.companyId, companyId),
        eq(tables.signals.status, "approved"),
        gte(tables.signals.occurredOn, since)
      )
    );

  let level: "ok" | "watch" | "risk" = "ok";
  for (const r of rows) {
    if (r.level === "risk") { level = "risk"; break; }
    if (r.level === "watch") level = "watch";
  }

  await db
    .update(tables.companies)
    .set({ riskLevel: level, lastCheckedAt: new Date() })
    .where(eq(tables.companies.id, companyId));

  return level;
}
