/** Admin app — review queues that keep BuildSafe accurate and defensible:
 *  signal review (human-in-the-loop), verification badges, 48h dispute SLA,
 *  payment-report verification, outbound email log.
 *  Server component: queries the DB directly; all decisions go through
 *  the /api/admin/* routes. */
import type { Metadata } from "next";
import { asc, desc, eq, inArray, ne, and } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { fmtDate, formatAbn, initials, timeAgo } from "@/lib/format";
import AdminApp, { type AdminVM } from "./AdminApp";

export const metadata: Metadata = {
  title: "Admin — BuildSafe",
  description: "Signal review, verification, disputes and payment-report queues.",
};

const TIER_LABEL: Record<string, string> = {
  none: "Not verified",
  id_verified: "Tier 1 · Identity Verified",
  buildsafe_verified: "Tier 2 · BuildSafe Verified",
  track_record: "Tier 3 · Verified + Track Record",
};

/** Published criteria keys → human labels (matches the verification request snapshot). */
const CRITERIA_LABEL: Record<string, string> = {
  abnActive: "ABN registered & active",
  abnMatched: "ABN matches the registered entity",
  licenceCurrent: "Builder licence current (registry checked)",
  insuranceSighted: "Insurance certificate sighted & current",
  fiftyVerifiedReviews: "50+ verified reviews incl. subbie payment ratings",
};

const humanize = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export default async function AdminPage() {
  const user = await requireUser("admin");

  const [pendingSignals, pendingVerifs, grantedVerifs, openDisputes, unverifiedReports, emails] =
    await Promise.all([
      db.query.signals.findMany({
        where: eq(tables.signals.status, "pending"),
        orderBy: asc(tables.signals.createdAt),
        with: { company: true },
      }),
      db
        .select({ req: tables.verificationRequests, company: tables.companies, requester: tables.users })
        .from(tables.verificationRequests)
        .innerJoin(tables.companies, eq(tables.verificationRequests.companyId, tables.companies.id))
        .innerJoin(tables.users, eq(tables.verificationRequests.requestedByUserId, tables.users.id))
        .where(eq(tables.verificationRequests.status, "pending"))
        .orderBy(asc(tables.verificationRequests.createdAt)),
      db
        .select({ req: tables.verificationRequests, company: tables.companies })
        .from(tables.verificationRequests)
        .innerJoin(tables.companies, eq(tables.verificationRequests.companyId, tables.companies.id))
        .where(and(eq(tables.verificationRequests.status, "approved"), ne(tables.companies.tier, "none")))
        .orderBy(desc(tables.verificationRequests.decidedAt)),
      db
        .select({ dispute: tables.disputes, raisedBy: tables.users })
        .from(tables.disputes)
        .innerJoin(tables.users, eq(tables.disputes.raisedByUserId, tables.users.id))
        .where(eq(tables.disputes.status, "open"))
        .orderBy(asc(tables.disputes.slaDueAt)),
      db
        .select({ report: tables.paymentReports, company: tables.companies, reporter: tables.users })
        .from(tables.paymentReports)
        .innerJoin(tables.companies, eq(tables.paymentReports.companyId, tables.companies.id))
        .innerJoin(tables.users, eq(tables.paymentReports.reporterUserId, tables.users.id))
        .where(eq(tables.paymentReports.verified, false))
        .orderBy(asc(tables.paymentReports.createdAt)),
      db.select().from(tables.emailLog).orderBy(desc(tables.emailLog.createdAt)).limit(50),
    ]);

  /* --- enrich dispute targets with a human label --- */
  const idsBy = (t: string) => openDisputes.filter((d) => d.dispute.targetType === t).map((d) => d.dispute.targetId);
  const [dSignals, dReviews, dCompanies, dChecks] = await Promise.all([
    idsBy("signal").length
      ? db.select().from(tables.signals).where(inArray(tables.signals.id, idsBy("signal")))
      : Promise.resolve([]),
    idsBy("review").length
      ? db.select().from(tables.reviews).where(inArray(tables.reviews.id, idsBy("review")))
      : Promise.resolve([]),
    idsBy("profile").length
      ? db.select().from(tables.companies).where(inArray(tables.companies.id, idsBy("profile")))
      : Promise.resolve([]),
    idsBy("check").length
      ? db.select().from(tables.builderChecks).where(inArray(tables.builderChecks.id, idsBy("check")))
      : Promise.resolve([]),
  ]);
  const targetLabel = (type: string, id: number): string => {
    if (type === "signal") {
      const s = dSignals.find((x) => x.id === id);
      return s ? `Signal — "${s.title}"` : `Signal #${id}`;
    }
    if (type === "review") {
      const r = dReviews.find((x) => x.id === id);
      return r ? `Review — "${r.text.slice(0, 80)}${r.text.length > 80 ? "…" : ""}"` : `Review #${id}`;
    }
    if (type === "profile") {
      const c = dCompanies.find((x) => x.id === id);
      return c ? `Profile — ${c.name}` : `Profile #${id}`;
    }
    const c = dChecks.find((x) => x.id === id);
    return c ? `Builder check — "${c.query}"` : `Check #${id}`;
  };

  const vm: AdminVM = {
    adminName: user.name,
    adminInitials: initials(user.name || "Admin"),
    signals: pendingSignals.map((s) => ({
      id: s.id,
      title: s.title,
      detail: s.detail,
      level: s.level,
      sourceName: s.sourceName,
      sourceUrl: s.sourceUrl,
      sourceRef: s.sourceRef,
      occurred: fmtDate(s.occurredOn),
      companyName: s.company?.name ?? "—",
      abn: formatAbn(s.company?.abn),
      createdAgo: timeAgo(s.createdAt),
    })),
    verifications: pendingVerifs.map(({ req, company, requester }) => ({
      id: req.id,
      tierLabel: TIER_LABEL[req.tier] ?? req.tier,
      companyName: company.name,
      abn: formatAbn(company.abn),
      currentTier: TIER_LABEL[company.tier] ?? company.tier,
      requestedBy: requester.name,
      createdAgo: timeAgo(req.createdAt),
      criteria: Object.entries(req.criteria ?? {}).map(([k, ok]) => ({
        label: CRITERIA_LABEL[k] ?? humanize(k),
        ok: Boolean(ok),
      })),
    })),
    granted: grantedVerifs.map(({ req, company }) => ({
      requestId: req.id,
      companyName: company.name,
      tierLabel: TIER_LABEL[company.tier] ?? company.tier,
      grantedAt: company.tierGrantedAt ? fmtDate(company.tierGrantedAt) : "—",
    })),
    disputes: openDisputes.map(({ dispute, raisedBy }) => ({
      id: dispute.id,
      targetType: dispute.targetType,
      targetLabel: targetLabel(dispute.targetType, dispute.targetId),
      reason: dispute.reason,
      raisedBy: raisedBy.name,
      slaDueAtIso: dispute.slaDueAt.toISOString(),
      createdAgo: timeAgo(dispute.createdAt),
    })),
    payReports: unverifiedReports.map(({ report, company, reporter }) => ({
      id: report.id,
      companyName: company.name,
      daysLate: report.daysLate,
      hasInvoiceEvidence: report.hasInvoiceEvidence,
      reporter: reporter.name,
      createdAgo: timeAgo(report.createdAt),
    })),
    emails: emails.map((e) => ({
      id: e.id,
      to: e.toEmail,
      subject: e.subject,
      kind: e.kind,
      sentAt: e.sentAt ? fmtDate(e.sentAt) : null,
      error: e.error,
      createdAgo: timeAgo(e.createdAt),
    })),
  };

  return <AdminApp vm={vm} />;
}
