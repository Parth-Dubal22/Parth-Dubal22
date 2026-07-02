/** POST /api/quotes — customer requests a quote from a builder company.
 *  Body: { companyId, projectType?, note? } → { ok } */
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tables } from "@/lib/db";
import { apiUser } from "@/lib/session";
import { sendMail } from "@/lib/mail";

const schema = z.object({
  companyId: z.number().int().positive(),
  projectType: z.string().trim().max(160).optional(),
  note: z.string().trim().max(800).optional(),
});

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  const user = await apiUser("customer");
  if (!user) return bad("Sign in as a customer to request quotes.", 401);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid quote request.");
  const { companyId, projectType, note } = parsed.data;

  const company = await db.query.companies.findFirst({
    where: eq(tables.companies.id, companyId),
    with: { claimedBy: true },
  });
  if (!company) return bad("Company not found.", 404);

  await db.insert(tables.quoteRequests).values({
    customerUserId: user.id,
    companyId,
    projectType: projectType || null,
    note: note || null,
  });

  // Notify the builder who claimed this company (logged to email_log when SMTP is unset).
  if (company.claimedBy) {
    await sendMail({
      userId: company.claimedBy.id,
      to: company.claimedBy.email,
      subject: `[BuildSafe] New quote request — ${projectType || "project"}`,
      body:
        `${user.name} requested a quote from ${company.name} via BuildSafe.` +
        (projectType ? `\nProject: ${projectType}` : "") +
        (note ? `\nNote: ${note}` : "") +
        "\n\nReply from your builder dashboard.",
      kind: "quote_request",
    });
  }

  return NextResponse.json({ ok: true });
}
