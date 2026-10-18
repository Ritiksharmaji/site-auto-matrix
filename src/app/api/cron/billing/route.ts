import { generateDueInvoices, sendDueReminders } from "@/lib/billing";

/**
 * Daily billing job: create upcoming invoices and send payment reminders.
 * Call from a scheduler (cron, Vercel Cron, GitHub Actions) with
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const created = await generateDueInvoices();
  const reminded = await sendDueReminders();
  return Response.json({ created, reminded });
}
