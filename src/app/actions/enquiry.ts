"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { createEnquiry } from "@/lib/enquiries";
import { getModule } from "@/modules/registry";

// Public form submissions from client websites. Each one triggers the
// site's automation (email / WhatsApp alerts, visitor auto-reply).

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

  const parsed = schema.safeParse(Object.fromEntries([...formData].filter(([k]) => !k.startsWith("extra."))));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;
  if (!d.email && !d.phone) return { error: "Please give an email or phone number." };

  const site = await db.site.findUnique({ where: { id: d.siteId }, select: { id: true, moduleKey: true } });
  if (!site) return { error: "This site is not available." };

  // Only questions the module defines for this form are kept, with their labels.
  const formFields = getModule(site.moduleKey)?.sections.find((s) => s.key === d.formType)?.formFields ?? [];
  const extra = formFields
    .map((f) => ({ label: f.label, value: String(formData.get(`extra.${f.key}`) ?? "").trim().slice(0, 500) }))
    .filter((x) => x.value);

  await createEnquiry({ ...d, extra });
  return { ok: true };
}
