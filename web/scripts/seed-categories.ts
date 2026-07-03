/** R5 EXTENDED — seed the `categories` table from lib/data/categories.json
 *  (232 top-level + 854 subcategories = 1086 rows) plus our own one-line
 *  descriptions for the popular 26. Invoked by scripts/seed.ts; also safe to
 *  run standalone: `npx tsx scripts/seed-categories.ts` (upserts, no wipe). */
import { sql } from "drizzle-orm";
import { CATEGORIES } from "../lib/data/categories";
import { CATEGORY_DESCRIPTIONS } from "../lib/data/category-descriptions";
import { db, tables } from "../lib/db";

export async function seedCategories() {
  const rows = CATEGORIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    parent: c.parent,
    synonyms: c.synonyms,
    description: CATEGORY_DESCRIPTIONS[c.slug] ?? null,
  }));

  // Batch upsert (chunked to keep parameter counts sane).
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await db
      .insert(tables.categories)
      .values(chunk)
      .onConflictDoUpdate({
        target: tables.categories.slug,
        set: {
          name: sql`excluded.name`,
          parent: sql`excluded.parent`,
          synonyms: sql`excluded.synonyms`,
          description: sql`excluded.description`,
        },
      });
  }
  return rows.length;
}

// Standalone entrypoint (no-op when imported by seed.ts).
if (process.argv[1]?.endsWith("seed-categories.ts")) {
  seedCategories()
    .then((n) => {
      console.log(`Seeded ${n} categories.`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
