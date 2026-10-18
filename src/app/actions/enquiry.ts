"use server";

import { z } from "zod";
import { db } from "@/lib/db";

// Public form submissions from client websites. These are the hook for
// Phase 2 automation (email / WhatsApp alerts, CRM sync).

const schema = z.object({
  siteId: z.string().min(1),
  formType: z.string().min(1).max(50),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(2000).optional(),
});

export type EnquiryState = { ok?: boolean; error?: string };

export async function submitEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  // Simple honeypot against bots.
  if (formData.get("company_website")) return { ok: true };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;
  if (!d.email && !d.phone) return { error: "Please give an email or phone number." };

  const site = await db.site.findUnique({ where: { id: d.siteId }, select: { id: true } });
  if (!site) return { error: "This site is not available." };

  await db.enquiry.create({
    data: { siteId: d.siteId, formType: d.formType, name: d.name, email: d.email || null, phone: d.phone || null, message: d.message || null },
  });
  return { ok: true };
}
