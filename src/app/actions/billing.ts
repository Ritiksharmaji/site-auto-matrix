"use server";

import type { BillingCycle } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { FormState } from "./admin";
import { requireSuperAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createInvoiceRecord, formatINR, generateDueInvoices, rupeesToPaise, sendDueReminders, sendInvoiceReminder } from "@/lib/billing";
import { db } from "@/lib/db";

// Billing is visible to the super admin only.

const CYCLES: BillingCycle[] = ["MONTHLY", "QUARTERLY", "YEARLY"];

function refresh(clientId?: string) {
  revalidatePath("/admin/billing");
  if (clientId) revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/portal/billing");
}

export async function saveClientPlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSuperAdmin();
  const clientId = String(formData.get("clientId"));
  const planName = String(formData.get("planName") ?? "").trim().slice(0, 100);
  const amountRaw = String(formData.get("planAmount") ?? "").trim();
  const cycle = String(formData.get("billingCycle")) as BillingCycle;
  const due = String(formData.get("nextDueDate") ?? "");
  const planAmount = amountRaw ? rupeesToPaise(amountRaw) : null;
  if (planAmount !== null && Number.isNaN(planAmount)) return { error: "Enter the fee as a number, e.g. 2500" };
  if (!CYCLES.includes(cycle)) return { error: "Choose a billing cycle" };
  const nextDueDate = due ? new Date(`${due}T00:00:00`) : null;
  if (planAmount && !nextDueDate) return { error: "Set the next due date" };

  const c = await db.client.update({ where: { id: clientId }, data: { planName: planName || null, planAmount, billingCycle: cycle, nextDueDate } });
  await logActivity(admin.id, "billing.plan", `${admin.name} set plan for ${c.name}: ${planAmount ? formatINR(planAmount) : "none"}`);
  refresh(clientId);
  return { ok: "Plan saved" };
}

export async function createInvoice(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSuperAdmin();
  const clientId = String(formData.get("clientId"));
  const description = String(formData.get("description") ?? "").trim().slice(0, 200);
  const amount = rupeesToPaise(String(formData.get("amount") ?? ""));
  const due = String(formData.get("dueDate") ?? "");
  if (!description) return { error: "Add a description" };
  if (!amount || Number.isNaN(amount)) return { error: "Enter an amount" };
  if (!due) return { error: "Choose a due date" };
  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) return { error: "Client not found" };
  const inv = await createInvoiceRecord({ clientId, description, amount, dueDate: new Date(`${due}T00:00:00`) });
  await logActivity(admin.id, "billing.invoice", `${admin.name} created ${inv.number} for ${client.name} (${formatINR(amount)})`);
  refresh(clientId);
  return { ok: `Invoice ${inv.number} created` };
}

export async function markInvoicePaid(formData: FormData) {
  const admin = await requireSuperAdmin();
  const id = String(formData.get("id"));
  const note = String(formData.get("paymentNote") ?? "").trim().slice(0, 200) || null;
  const inv = await db.invoice.update({ where: { id }, data: { status: "PAID", paidAt: new Date(), paymentNote: note }, include: { client: { select: { name: true } } } });
  await logActivity(admin.id, "billing.paid", `${admin.name} marked ${inv.number} (${inv.client.name}) as paid`);
  refresh(inv.clientId);
}

export async function cancelInvoice(formData: FormData) {
  const admin = await requireSuperAdmin();
  const inv = await db.invoice.update({ where: { id: String(formData.get("id")) }, data: { status: "CANCELLED" } });
  await logActivity(admin.id, "billing.cancel", `${admin.name} cancelled ${inv.number}`);
  refresh(inv.clientId);
}

export async function remindInvoice(formData: FormData) {
  const admin = await requireSuperAdmin();
  const id = String(formData.get("id"));
  const sent = await sendInvoiceReminder(id);
  const inv = await db.invoice.findUnique({ where: { id }, select: { number: true, clientId: true } });
  await logActivity(admin.id, "billing.remind", `${admin.name} sent a reminder for ${inv?.number} to ${sent} recipient(s)`);
  refresh(inv?.clientId);
}

export async function runBillingNow() {
  const admin = await requireSuperAdmin();
  const created = await generateDueInvoices();
  const reminded = await sendDueReminders();
  await logActivity(admin.id, "billing.run", `${admin.name} ran billing: ${created} invoice(s) created, ${reminded} reminder(s) sent`);
  refresh();
}
