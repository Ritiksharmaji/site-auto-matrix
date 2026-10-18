// Per-site automation settings, stored in Site.automation (JSONB).

export type AutomationSettings = {
  /** Email the client's login addresses when a new enquiry arrives. */
  notifyClient: boolean;
  /** Email the team member who manages the client. */
  notifyOwner: boolean;
  /** Extra comma-separated email addresses to notify. */
  extraEmails: string;
  /** Send a WhatsApp alert for new enquiries. */
  whatsappNotify: boolean;
  /** Number to alert, with country code, e.g. 919876543210. */
  whatsappNumber: string;
  /** Send an automatic thank-you email to the visitor (if they gave an email). */
  autoReply: boolean;
  autoReplySubject: string;
  autoReplyBody: string;
};

export const DEFAULT_AUTOMATION: AutomationSettings = {
  notifyClient: true,
  notifyOwner: true,
  extraEmails: "",
  whatsappNotify: false,
  whatsappNumber: "",
  autoReply: true,
  autoReplySubject: "Thank you for contacting {{site}}",
  autoReplyBody:
    "Hi {{name}},\n\nThank you for reaching out to {{site}}. We have received your enquiry and our team will get back to you within one working day.\n\nRegards,\n{{site}}",
};

export function resolveAutomation(stored: unknown): AutomationSettings {
  return { ...DEFAULT_AUTOMATION, ...((stored as Partial<AutomationSettings>) ?? {}) };
}

/** Replace {{name}}, {{site}} placeholders. */
export function fillTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => vars[k] ?? "");
}

export function parseEmails(list: string) {
  return list
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
}
