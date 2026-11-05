import { after } from "next/server";
import { db } from "./db";
import { runEnquiryAutomation } from "./enquiry-automation";

/** Saves an enquiry and runs the site's alerts / auto-reply after the response. */
export async function createEnquiry(data: {
  siteId: string;
  formType: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  extra?: { label: string; value: string }[];
}) {
  const enquiry = await db.enquiry.create({
    data: {
      siteId: data.siteId,
      formType: data.formType,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      message: data.message || null,
      extra: data.extra?.length ? data.extra : undefined,
    },
  });
  after(() => runEnquiryAutomation(enquiry.id).catch((e) => console.error("Enquiry automation failed", e)));
  return enquiry;
}
