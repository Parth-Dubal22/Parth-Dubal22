import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";

/**
 * POST /api/availability — tradie.
 * { availableNow:boolean } → { ok, availableNow } ("Available Now" toggle for day work)
 */

const postSchema = z.object({
  availableNow: z.boolean(),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  const user = await apiUser("tradie");
  if (!user) return bad("Sign in as a tradie to set your availability.", 401);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    return bad(parsed.error.issues[0]?.message ?? "availableNow must be true or false.");
  }

  const [updated] = await db
    .update(tables.tradieProfiles)
    .set({ availableNow: parsed.data.availableNow })
    .where(eq(tables.tradieProfiles.userId, user.id))
    .returning({ availableNow: tables.tradieProfiles.availableNow });

  if (!updated) return bad("No tradie profile found for your account.", 404);
  return NextResponse.json({ ok: true, availableNow: updated.availableNow });
}
