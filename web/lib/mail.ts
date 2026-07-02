/** Alert email sender — email first, SMS (Twilio) later.
 *  Without SMTP env config, emails are logged to email_log with sentAt=null
 *  (visible in admin) so the pipeline is fully testable offline. */
import nodemailer from "nodemailer";
import { db, tables } from "@/lib/db";

const FOOTER =
  "\n\n—\nBuildSafe monitors public records and flags signals. " +
  "Information, not advice or a prediction. Every alert cites its public source. " +
  "Business-purpose use only. Manage alerts in your BuildSafe settings.";

export async function sendMail(opts: {
  userId?: number;
  to: string;
  subject: string;
  body: string;
  kind: string;
}) {
  const { userId, to, subject, body, kind } = opts;
  let sentAt: Date | null = null;
  let error: string | null = null;

  if (process.env.SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      await transporter.sendMail({
        from: process.env.MAIL_FROM ?? "BuildSafe <alerts@buildsafe.example>",
        to,
        subject,
        text: body + FOOTER,
      });
      sentAt = new Date();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  await db.insert(tables.emailLog).values({
    userId,
    toEmail: to,
    subject,
    body: body + FOOTER,
    kind,
    sentAt,
    error,
  });

  return { sent: sentAt != null, error };
}
