"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "../lib/onekampus";

/** Counts an anonymous page view on every page change (for the oneKampus Analytics tab). */
export default function PageViews() {
  const pathname = usePathname();
  useEffect(() => trackPageView(), [pathname]);
  return null;
}
