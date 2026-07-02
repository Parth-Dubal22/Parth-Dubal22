import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";

/**
 * PUT /api/profile — any signed-in role; role-aware partial update.
 * Fields are explicitly whitelisted per role. role/tier/riskLevel/verified/
 * licenceVerified/insuranceVerified/reliabilityScore are NEVER writable here.
 *  - tradie: name (users.name), businessName, trades, suburb, licenceNumber,
 *            insuranceProvider, insuranceExpiry, bio, portfolio
 *  - customer: suburb, projectType
 *  - builder: company claim fields (location, tags, artKind) — only on the
 *             company the builder has claimed (claimedByUserId = me)
 */

const ART_KINDS = ["crane", "frame", "house", "tower", "tile"] as const;

const tradieSchema = z.object({
  name: z.string().trim().min(1, "Display name can't be empty.").max(120).optional(),
  businessName: z.string().trim().max(200).nullish(),
  trades: z.array(z.string().trim().min(1).max(60)).max(24).optional(),
  suburb: z.string().trim().max(120).nullish(),
  licenceNumber: z.string().trim().max(80).nullish(),
  insuranceProvider: z.string().trim().max(160).nullish(),
  insuranceExpiry: z.string().trim().max(30).nullish(), // yyyy-mm-dd; null/"" clears
  bio: z.string().trim().max(2000).nullish(),
  portfolio: z
    .array(
      z.object({
        art: z.enum(ART_KINDS),
        caption: z.string().trim().max(200),
      }),
    )
    .max(24)
    .optional(),
});

const customerSchema = z.object({
  suburb: z.string().trim().max(120).nullish(),
  projectType: z.string().trim().max(120).nullish(),
});

const builderSchema = z.object({
  location: z.string().trim().max(160).nullish(),
  tags: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  artKind: z.enum(ART_KINDS).optional(),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function PUT(req: Request) {
  const user = await apiUser();
  if (!user) return bad("Sign in to update your profile.", 401);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }

  if (user.role === "tradie") {
    const parsed = tradieSchema.safeParse(raw);
    if (!parsed.success) {
      return bad(parsed.error.issues[0]?.message ?? "Invalid profile fields.");
    }
    const d = parsed.data;

    // Display name lives on users, not the tradie profile row.
    if (d.name !== undefined) {
      await db.update(tables.users).set({ name: d.name }).where(eq(tables.users.id, user.id));
    }

    const set: Partial<typeof tables.tradieProfiles.$inferInsert> = {};
    if (d.businessName !== undefined) set.businessName = d.businessName || null;
    if (d.trades !== undefined) set.trades = d.trades;
    if (d.suburb !== undefined) set.suburb = d.suburb || null;
    if (d.licenceNumber !== undefined) set.licenceNumber = d.licenceNumber || null;
    if (d.insuranceProvider !== undefined) set.insuranceProvider = d.insuranceProvider || null;
    if (d.bio !== undefined) set.bio = d.bio || null;
    if (d.portfolio !== undefined) set.portfolio = d.portfolio;
    if (d.insuranceExpiry !== undefined) {
      if (!d.insuranceExpiry) {
        set.insuranceExpiry = null;
      } else {
        const dt = new Date(d.insuranceExpiry);
        if (Number.isNaN(dt.getTime())) return bad("Invalid insurance expiry date.");
        set.insuranceExpiry = dt;
      }
    }

    if (Object.keys(set).length === 0) return NextResponse.json({ ok: true });
    const [updated] = await db
      .update(tables.tradieProfiles)
      .set(set)
      .where(eq(tables.tradieProfiles.userId, user.id))
      .returning({ id: tables.tradieProfiles.id });
    if (!updated) return bad("No tradie profile found for your account.", 404);
    return NextResponse.json({ ok: true });
  }

  if (user.role === "customer") {
    const parsed = customerSchema.safeParse(raw);
    if (!parsed.success) {
      return bad(parsed.error.issues[0]?.message ?? "Invalid profile fields.");
    }
    const d = parsed.data;

    const set: Partial<typeof tables.customerProfiles.$inferInsert> = {};
    if (d.suburb !== undefined) set.suburb = d.suburb || null;
    if (d.projectType !== undefined) set.projectType = d.projectType || null;

    if (Object.keys(set).length === 0) return NextResponse.json({ ok: true });
    const [updated] = await db
      .update(tables.customerProfiles)
      .set(set)
      .where(eq(tables.customerProfiles.userId, user.id))
      .returning({ id: tables.customerProfiles.id });
    if (!updated) return bad("No customer profile found for your account.", 404);
    return NextResponse.json({ ok: true });
  }

  if (user.role === "builder") {
    const parsed = builderSchema.safeParse(raw);
    if (!parsed.success) {
      return bad(parsed.error.issues[0]?.message ?? "Invalid profile fields.");
    }
    const d = parsed.data;

    const profile = await db.query.builderProfiles.findFirst({
      where: eq(tables.builderProfiles.userId, user.id),
      with: { company: true },
    });
    if (!profile?.company) return bad("No builder profile found for your account.", 404);
    if (profile.company.claimedByUserId !== user.id) {
      return bad("Only the account that claimed this company can edit its page.", 403);
    }

    const set: Partial<typeof tables.companies.$inferInsert> = {};
    if (d.location !== undefined) set.location = d.location || null;
    if (d.tags !== undefined) set.tags = d.tags;
    if (d.artKind !== undefined) set.artKind = d.artKind;

    if (Object.keys(set).length === 0) return NextResponse.json({ ok: true });
    await db.update(tables.companies).set(set).where(eq(tables.companies.id, profile.company.id));
    return NextResponse.json({ ok: true });
  }

  // Admin accounts have no editable marketplace profile.
  return bad("No editable profile for this account role.", 400);
}
