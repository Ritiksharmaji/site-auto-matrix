"use client";

import { useActionState } from "react";
import { submitEnquiry, type EnquiryState } from "@/app/actions/enquiry";

/** An extra question on the form, resolved by the renderer (select options already filled in). */
export type ExtraField = { key: string; label: string; type: "text" | "url" | "select"; placeholder?: string; options?: string[] };

export default function EnquiryForm({
  siteId,
  formType,
  buttonLabel,
  messagePlaceholder = "Message",
  extraFields = [],
}: {
  siteId: string;
  formType: string;
  buttonLabel: string;
  messagePlaceholder?: string;
  extraFields?: ExtraField[];
}) {
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
      {extraFields.map((f) =>
        f.type === "select" ? (
          <select key={f.key} name={`extra.${f.key}`} aria-label={f.label} defaultValue="">
            <option value="">{f.placeholder || f.label}</option>
            {f.options?.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ) : (
          <input
            key={f.key}
            name={`extra.${f.key}`}
            aria-label={f.label}
            placeholder={f.placeholder || f.label}
            inputMode={f.type === "url" ? "url" : undefined}
          />
        ),
      )}
      <textarea name="message" rows={4} placeholder={messagePlaceholder} />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="site-btn w-full text-center">
        {pending ? "Sending…" : buttonLabel}
      </button>
    </form>
  );
}
