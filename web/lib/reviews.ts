/** Shared review helpers. */
import { and, avg, count, eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";

/** Recompute a company's ratingAvg (x10 int) and reviewCount from its PUBLISHED reviews.
 *  Reviews taken down for legal reasons (status 'removed_legal') are excluded. */
export async function recomputeCompanyRating(companyId: number) {
  const [agg] = await db
    .select({ avg: avg(tables.reviews.rating), n: count() })
    .from(tables.reviews)
    .where(
      and(
        eq(tables.reviews.subjectCompanyId, companyId),
        eq(tables.reviews.status, "published"),
      ),
    );
  const n = Number(agg?.n ?? 0);
  const ratingAvg = n > 0 && agg?.avg != null ? Math.round(Number(agg.avg) * 10) : null;
  await db
    .update(tables.companies)
    .set({ ratingAvg, reviewCount: n })
    .where(eq(tables.companies.id, companyId));
}
