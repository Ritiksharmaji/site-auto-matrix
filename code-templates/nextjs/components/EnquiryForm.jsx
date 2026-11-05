"use client";

import { useState } from "react";
import { sendEnquiry } from "../lib/onekampus";

/** Contact form connected to the platform's enquiry inbox, alerts and auto-reply. */
export default function EnquiryForm({ formType = "contact", buttonLabel = "Send" }) {
  const [state, setState] = useState({ sending: false, done: false, error: "" });

  async function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get("company_website")) return; // spam trap
    setState({ sending: true, done: false, error: "" });
    try {
      await sendEnquiry({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        message: form.get("message"),
        formType,
      });
      setState({ sending: false, done: true, error: "" });
    } catch (err) {
      setState({ sending: false, done: false, error: err.message });
    }
  }

  if (state.done) return <p className="form-done">Thank you! We have received your details and will get back to you soon.</p>;
  return (
    <form className="form" onSubmit={onSubmit}>
      <input name="name" placeholder="Your name" required minLength={2} />
      <div className="form-row">
        <input name="phone" placeholder="Phone" />
        <input name="email" type="email" placeholder="Email" />
      </div>
      <textarea name="message" rows={4} placeholder="Message" />
      <input name="company_website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      {state.error && <p className="form-error">{state.error}</p>}
      <button disabled={state.sending}>{state.sending ? "Sending…" : buttonLabel}</button>
    </form>
  );
}
