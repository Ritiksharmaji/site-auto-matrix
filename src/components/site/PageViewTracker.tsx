"use client";

import { useEffect } from "react";

/** Sends one anonymous page view per page load (skipped in builder previews). */
export default function PageViewTracker({ siteId }: { siteId: string }) {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("preview")) return;
    const ref = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : "";
    const body = JSON.stringify({ siteId, path: window.location.pathname, referrer: ref });
    if (!navigator.sendBeacon?.("/api/track", body)) {
      fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  }, [siteId]);
  return null;
}
