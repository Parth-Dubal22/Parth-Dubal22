/** Customer app — ported 1:1 from site/app-customer.html.
 *  Server component: queries the DB directly; all mutations go through API routes.
 *  Legal design: the customer side shows positive/neutral facts only — verified
 *  badge or a neutral pill. No risk level, signals or exposure ever reach this app. */
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatAbn, ratingX10ToNumber, hasVerifiedBadge } from "@/lib/format";
import CustomerApp from "./CustomerApp";
import type { CustomerMe, DirectoryBuilder, QuoteRequestItem } from "./types";

export const metadata = { title: "Customer app — BuildSafe" };
export const dynamic = "force-dynamic";

export default async function CustomerPage() {
  const user = await requireUser("customer");

  const [profile, companyRows, requestRows] = await Promise.all([
    db.query.customerProfiles.findFirst({
      where: eq(tables.customerProfiles.userId, user.id),
    }),
    db.query.companies.findMany({
      orderBy: (c, { asc }) => [asc(c.id)],
    }),
    db.query.quoteRequests.findMany({
      where: eq(tables.quoteRequests.customerUserId, user.id),
      orderBy: (q, { desc }) => [desc(q.createdAt)],
    }),
  ]);

  // Positive/neutral facts only — riskLevel/signals are never mapped for customers.
  const directory: DirectoryBuilder[] = companyRows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    abn: formatAbn(c.abn),
    licence: [c.licenceNumber, c.licenceStatus].filter(Boolean).join(" · "),
    location: c.location ?? "",
    artKind: c.artKind,
    tags: c.tags,
    verified: hasVerifiedBadge(c.tier),
    rating: ratingX10ToNumber(c.ratingAvg),
    reviewCount: c.reviewCount,
  }));

  // Verified-first sort, then by rating (prototype directory order).
  directory.sort(
    (a, b) => Number(b.verified) - Number(a.verified) || (b.rating ?? 0) - (a.rating ?? 0),
  );

  const companyById = new Map(directory.map((c) => [c.id, c]));
  const requests: QuoteRequestItem[] = requestRows.map((r) => {
    const c = companyById.get(r.companyId);
    return {
      id: r.id,
      companyName: c?.name ?? "Builder",
      verified: c?.verified ?? false,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    };
  });

  const me: CustomerMe = {
    name: user.name,
    subline:
      [[profile?.suburb, profile?.state].filter(Boolean).join(" "), profile?.projectType]
        .filter(Boolean)
        .join(" · ") || "Homeowner",
  };

  return <CustomerApp me={me} directory={directory} requests={requests} />;
}
