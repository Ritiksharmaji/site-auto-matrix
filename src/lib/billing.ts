import "server-only";
import type { BillingCycle, Invoice } from "@prisma/client";
import { db } from "./db";
import { sendEmail } from "./notify";

export const CYCLE_LABEL: Record<BillingCycle, string> = { MONTHLY: "Monthly", QUARTERLY: "Quarterly", YEARLY: "Yearly" };
const CYCLE_MONTHS: Record<BillingCycle, number> = { MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 };

export function formatINR(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: paise % 100 ? 2 : 0 }).format(paise / 100);
}

export function rupeesToPaise(input: string) {
  const n = Number(String(input).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
}

export function addCycle(date: Date, cycle: BillingCycle) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + CYCLE_MONTHS[cycle]);
  return d;
}

export function isOverdue(inv: Pick<Invoice, "status" | "dueDate">) {
  return inv.status === "UNPAID" && inv.dueDate.getTime() < startOfToday().getTime();
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const last = await db.invoice.findFirst({ where: { number: { startsWith: `INV-${year}-` } }, orderBy: { number: "desc" }, select: { number: true } });
  const seq = last ? Number(last.number.split("-")[2]) + 1 : 1;
  return `INV-${year}-${String(seq).padStart(4, "0")}`;
}

export async function createInvoiceRecord(data: Omit<Parameters<typeof db.invoice.create>[0]["data"], "number">) {
  // Retry on the rare number collision from concurrent creation.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.invoice.create({ data: { ...data, number: await nextInvoiceNumber() } as Parameters<typeof db.invoice.create>[0]["data"] });
    } catch (e) {
      if (attempt === 2 || !(e instanceof Error) || !e.message.includes("Unique constraint")) throw e;
    }
  }
  throw new Error("Could not create invoice");
}

/**
 * Create invoices for every client whose next due date falls within `daysAhead`
 * days, and move their next due date forward by one billing cycle.
 */
export async function generateDueInvoices(daysAhead = 7) {
  const horizon = new Date(startOfToday().getTime() + daysAhead * 86_400_000);
  const clients = await db.client.findMany({ where: { planAmount: { gt: 0 }, nextDueDate: { lte: horizon } } });
  let created = 0;
  for (const c of clients) {
    let due = c.nextDueDate!;
    // Catch up if several cycles were missed, but never more than 12 at once.
    for (let i = 0; i < 12 && due <= horizon; i++) {
      const end = addCycle(due, c.billingCycle);
      await createInvoiceRecord({
        clientId: c.id,
        description: `${c.planName || "Website plan"} (${CYCLE_LABEL[c.billingCycle]})`,
        amount: c.planAmount!,
        periodStart: due,
        periodEnd: end,
        dueDate: due,
      });
      created++;
      due = end;
    }
    await db.client.update({ where: { id: c.id }, data: { nextDueDate: due } });
  }
  return created;
}

/** Email a payment reminder for one invoice to the client's contact + logins. */
export async function sendInvoiceReminder(invoiceId: string) {
  const inv = await db.invoice.findUnique({ where: { id: invoiceId }, include: { client: { include: { users: { where: { isActive: true }, select: { email: true } } } } } });
  if (!inv || inv.status !== "UNPAID") return 0;
  const to = new Set([inv.client.email, ...inv.client.users.map((u) => u.email)].map((e) => e.toLowerCase()));
  const overdue = isOverdue(inv);
  const subject = `${overdue ? "Overdue" : "Payment due"}: invoice ${inv.number} – ${formatINR(inv.amount)}`;
  const body = [
    `Dear ${inv.client.contactName},`,
    "",
    `This is a ${overdue ? "reminder that the following invoice is overdue" : "friendly reminder that the following invoice is due"}:`,
    "",
    `Invoice: ${inv.number}`,
    `For: ${inv.description}`,
    `Amount: ${formatINR(inv.amount)}`,
    `Due date: ${inv.dueDate.toLocaleDateString("en-IN", { dateStyle: "long" })}`,
    "",
    "Please ignore this message if you have already paid. Thank you!",
  ].join("\n");
  for (const email of to) await sendEmail(email, subject, body);
  await db.invoice.update({ where: { id: inv.id }, data: { lastReminderAt: new Date() } });
  return to.size;
}

/** Remind clients about unpaid invoices due within 3 days or overdue, at most once every 3 days. */
export async function sendDueReminders() {
  const now = Date.now();
  const invoices = await db.invoice.findMany({
    where: {
      status: "UNPAID",
      dueDate: { lte: new Date(now + 3 * 86_400_000) },
      OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: new Date(now - 3 * 86_400_000) } }],
    },
    select: { id: true },
  });
  for (const i of invoices) await sendInvoiceReminder(i.id);
  return invoices.length;
}
