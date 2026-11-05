// Connects this website to the oneKampus platform (no keys needed: the platform
// recognises the site from its web address).
//
//   sendEnquiry({...})  → the enquiry appears in the platform's Enquiries inbox and
//                         triggers the site's email / WhatsApp alerts and auto-reply.
//   trackPageView()     → anonymous page view for the Analytics tab.
//
// On localhost (npm run dev) nothing is sent; the call is only logged.

const isLocal = () => ["localhost", "127.0.0.1"].includes(window.location.hostname);

export async function sendEnquiry({ name, email = "", phone = "", message = "", formType = "contact", extra = {} }) {
  if (isLocal()) {
    console.info("[oneKampus] Enquiry not sent while developing locally:", { name, email, phone, message, formType, extra });
    return;
  }
  const res = await fetch("/api/public/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, message, formType, extra }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Sorry, the form could not be sent. Please try again.");
}

export function trackPageView() {
  if (isLocal()) return;
  const referrer = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : "";
  const body = JSON.stringify({ path: window.location.pathname, referrer });
  if (!navigator.sendBeacon?.("/api/track", body)) fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}
