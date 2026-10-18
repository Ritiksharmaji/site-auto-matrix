"use client";

import { useActionState } from "react";
import { submitEnquiry, type EnquiryState } from "@/app/actions/enquiry";

export default function EnquiryForm({ siteId, formType, buttonLabel }: { siteId: string; formType: string; buttonLabel: string }) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, {});

  if (state.ok) {
    return <p className="py-6 text-center font-medium">Thank you! We have received your details and will contact you soon.</p>;
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="formType" value={formType} />
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input name="name" placeholder="Your name" required />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="phone" placeholder="Phone" inputMode="tel" />
        <input name="email" type="email" placeholder="Email" />
      </div>
      <textarea name="message" rows={4} placeholder="Message" />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="site-btn w-full text-center">
        {pending ? "Sending…" : buttonLabel}
      </button>
    </form>
  );
}
