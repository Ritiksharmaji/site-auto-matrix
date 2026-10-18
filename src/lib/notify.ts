import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "./db";

// Outbound messages. Every attempt is recorded in the Notification table.
// When a channel is not configured (no SMTP / WhatsApp keys, e.g. in local
// development) the message is recorded with status LOGGED instead of sent.

let transporter: Transporter | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  transporter = SMTP_HOST
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT ?? 587),
        secure: Number(SMTP_PORT) === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      })
    : null;
  return transporter;
}

type Ref = { enquiryId?: string };

export async function sendEmail(to: string, subject: string, text: string, ref: Ref = {}) {
  const t = getTransporter();
  const base = { channel: "EMAIL" as const, recipient: to, subject, body: text, enquiryId: ref.enquiryId };
  if (!t) return db.notification.create({ data: { ...base, status: "LOGGED" } });
  try {
    await t.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to, subject, text });
    return db.notification.create({ data: { ...base, status: "SENT" } });
  } catch (e) {
    return db.notification.create({ data: { ...base, status: "FAILED", error: errorText(e) } });
  }
}

/**
 * WhatsApp Cloud API text message. Note: Meta only delivers free-form text
 * inside a 24h customer-service window; for cold alerts configure an approved
 * template and set WHATSAPP_TEMPLATE (sent with the message as its one parameter).
 */
export async function sendWhatsApp(to: string, text: string, ref: Ref = {}) {
  const { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE } = process.env;
  const number = to.replace(/\D/g, "");
  const base = { channel: "WHATSAPP" as const, recipient: number, body: text, enquiryId: ref.enquiryId };
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) return db.notification.create({ data: { ...base, status: "LOGGED" } });

  const payload = WHATSAPP_TEMPLATE
    ? {
        messaging_product: "whatsapp",
        to: number,
        type: "template",
        template: {
          name: WHATSAPP_TEMPLATE,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "en" },
          components: [{ type: "body", parameters: [{ type: "text", text: text.slice(0, 1000) }] }],
        },
      }
    : { messaging_product: "whatsapp", to: number, type: "text", text: { body: text } };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return db.notification.create({ data: { ...base, status: "SENT" } });
  } catch (e) {
    return db.notification.create({ data: { ...base, status: "FAILED", error: errorText(e) } });
  }
}

function errorText(e: unknown) {
  return (e instanceof Error ? e.message : String(e)).slice(0, 500);
}
