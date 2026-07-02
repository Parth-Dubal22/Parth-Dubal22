import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { cleanAbn, slugify } from "@/lib/format";

/**
 * POST /api/register — public.
 * { role:'customer'|'tradie'|'builder', name, email, password, profile:{…role fields} } → { ok }
 * Client then signs in via next-auth signIn("credentials").
 */

const profileSchema = z.object({
  suburb: z.string().trim().max(120).optional(),
  projectType: z.string().trim().max(120).optional(),
  abn: z.string().trim().max(20).optional(),
  trades: z.array(z.string().trim().max(60)).max(20).optional(),
  licenceNumber: z.string().trim().max(80).optional(),
  insurance: z.string().trim().max(160).optional(),
  insuranceExpiry: z.string().trim().max(20).optional(), // yyyy-mm-dd
  companyName: z.string().trim().max(200).optional(),
  builds: z.array(z.string().trim().max(60)).max(12).optional(),
});

const bodySchema = z.object({
  role: z.enum(["customer", "tradie", "builder"]),
  name: z.string().trim().min(1, "Please enter your full name.").max(160),
  email: z.email("Please enter a valid email address.").max(320),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
  profile: profileSchema.optional().default({}),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Thrown inside the registration transaction when the ABN's company is already claimed. */
class AlreadyClaimedError extends Error {}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return bad(first?.message ?? "Invalid registration details.");
  }

  const { role, name, password, profile } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

  // Role-specific requirements.
  let builderAbn = "";
  if (role === "builder") {
    if (!profile.companyName) return bad("Please enter your company name.");
    builderAbn = cleanAbn(profile.abn ?? "");
    if (builderAbn.length !== 11) return bad("Please enter a valid 11-digit ABN for your company.");
  }

  const existing = await db.query.users.findFirst({ where: eq(tables.users.email, email) });
  if (existing) {
    return bad("An account with that email already exists — try signing in instead.", 409);
  }

  const passwordHash = await hash(password, 10);

  const insuranceExpiry = profile.insuranceExpiry ? new Date(profile.insuranceExpiry) : null;
  const insuranceExpiryValid =
    insuranceExpiry && !Number.isNaN(insuranceExpiry.getTime()) ? insuranceExpiry : null;

  try {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(tables.users)
        .values({ email, passwordHash, name, role })
        .returning();

      if (role === "customer") {
        await tx.insert(tables.customerProfiles).values({
          userId: user.id,
          suburb: profile.suburb || null,
          projectType: profile.projectType || null,
        });
      } else if (role === "tradie") {
        const abnDigits = cleanAbn(profile.abn ?? "");
        await tx.insert(tables.tradieProfiles).values({
          userId: user.id,
          abn: abnDigits.length === 11 ? abnDigits : null,
          trades: profile.trades ?? [],
          suburb: profile.suburb || null,
          licenceNumber: profile.licenceNumber || null,
          insuranceProvider: profile.insurance || null,
          insuranceExpiry: insuranceExpiryValid,
        });
      } else {
        // Builder: upsert the ABN-anchored company record, claim it, link builder profile.
        const companyName = profile.companyName!;
        const found = await tx.query.companies.findFirst({
          where: eq(tables.companies.abn, builderAbn),
        });
        let companyId: number;
        if (found) {
          // A company record already exists for this ABN. If someone has already
          // claimed it, do NOT attach this new account to it — that would let an
          // impostor post jobs and reply to reviews as the real business.
          if (found.claimedByUserId) {
            throw new AlreadyClaimedError();
          }
          companyId = found.id;
          await tx
            .update(tables.companies)
            .set({ claimedByUserId: user.id })
            .where(eq(tables.companies.id, found.id));
        } else {
          let slug = slugify(companyName) || `builder-${builderAbn}`;
          const slugTaken = await tx.query.companies.findFirst({
            where: eq(tables.companies.slug, slug),
          });
          if (slugTaken) slug = `${slug}-${builderAbn.slice(-4)}`.slice(0, 260);
          const [company] = await tx
            .insert(tables.companies)
            .values({
              abn: builderAbn,
              name: companyName,
              slug,
              location: profile.suburb || null,
              licenceNumber: profile.licenceNumber || null,
              tags: profile.builds ?? [],
              claimedByUserId: user.id,
            })
            .returning();
          companyId = company.id;
        }
        await tx.insert(tables.builderProfiles).values({ userId: user.id, companyId });
      }
    });
  } catch (err: unknown) {
    if (err instanceof AlreadyClaimedError) {
      return bad(
        "That ABN is already registered to a BuildSafe account. If this is your business, contact support to claim it.",
        409,
      );
    }
    // Unique-violation race on email (or slug) → clear message, not a 500.
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      return bad("An account with that email already exists — try signing in instead.", 409);
    }
    console.error("register failed", err);
    return bad("Something went wrong creating your account. Please try again.", 500);
  }

  return NextResponse.json({ ok: true });
}
