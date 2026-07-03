/** R5 — sitemap (SPEC_V2_CATEGORIES §4). Home, /find, the 26 popular category
 *  pages, popular × launch-suburb location pages, public company profiles, and
 *  the core marketing routes. Suburb pages are limited to popular × launch
 *  suburbs (the same guard as generateStaticParams) so we never emit thin
 *  doorway URLs. */
import type { MetadataRoute } from "next";
import { db, tables } from "@/lib/db";
import { POPULAR } from "@/lib/data/categories";
import { LAUNCH_SUBURBS } from "@/lib/data/launch-suburbs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = (path: string) => `${SITE_URL}${path}`;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: u("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: u("/find"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: u("/jobs"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: u("/pricing"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: u("/check"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = POPULAR.map((p) => ({
    url: u(`/find/${p.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const suburbRoutes: MetadataRoute.Sitemap = POPULAR.flatMap((p) =>
    LAUNCH_SUBURBS.map((s) => ({
      url: u(`/find/${p.slug}/${s.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  );

  let profileRoutes: MetadataRoute.Sitemap = [];
  try {
    const companies = await db
      .select({ slug: tables.companies.slug })
      .from(tables.companies);
    profileRoutes = companies.map((c) => ({
      url: u(`/b/${c.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    // DB unavailable at build time — static + category routes still emit.
  }

  return [...staticRoutes, ...categoryRoutes, ...suburbRoutes, ...profileRoutes];
}
