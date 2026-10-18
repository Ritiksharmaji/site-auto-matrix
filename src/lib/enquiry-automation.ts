import "server-only";
import { db } from "./db";
import { fillTemplate, parseEmails, resolveAutomation } from "./automation";
import { sendEmail, sendWhatsApp } from "./notify";
import { getModule } from "@/modules/registry";

/** Runs after a public enquiry is saved: team/client alerts + visitor auto-reply. */
export async function runEnquiryAutomation(enquiryId: string) {
  const enquiry = await db.enquiry.findUnique({
    where: { id: enquiryId },
    include: {
      site: {
        include: {
          client: { include: { owner: { select: { email: true, isActive: true } }, users: { select: { email: true, isActive: true } } } },
        },
      },
    },
  });
  if (!enquiry) return;
  const { site } = enquiry;
  const settings = resolveAutomation(site.automation);
  const siteName = ((site.content as { brand?: { siteName?: string } })?.brand?.siteName || site.name).trim();
  const formLabel = getModule(site.moduleKey)?.sections.find((s) => s.key === enquiry.formType)?.label ?? enquiry.formType;
  const ref = { enquiryId };

  const summary = [
    `New ${formLabel} enquiry on ${siteName}`,
    "",
    `Name: ${enquiry.name}`,
    enquiry.phone && `Phone: ${enquiry.phone}`,
    enquiry.email && `Email: ${enquiry.email}`,
    enquiry.message && `Message: ${enquiry.message}`,
  ]
    .filter((l): l is string => typeof l === "string")
    .join("\n");

  const recipients = new Set<string>();
  if (settings.notifyClient) site.client.users.filter((u) => u.isActive).forEach((u) => recipients.add(u.email));
  if (settings.notifyOwner && site.client.owner.isActive) recipients.add(site.client.owner.email);
  parseEmails(settings.extraEmails).forEach((e) => recipients.add(e));

  const jobs: Promise<unknown>[] = [];
  for (const to of recipients) jobs.push(sendEmail(to, `New enquiry: ${enquiry.name} (${siteName})`, summary, ref));
  if (settings.whatsappNotify && settings.whatsappNumber) jobs.push(sendWhatsApp(settings.whatsappNumber, summary, ref));
  if (settings.autoReply && enquiry.email) {
    const vars = { name: enquiry.name, site: siteName };
    jobs.push(sendEmail(enquiry.email, fillTemplate(settings.autoReplySubject, vars), fillTemplate(settings.autoReplyBody, vars), ref));
  }
  await Promise.allSettled(jobs);
}
