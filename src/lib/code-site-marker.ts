import { createHash } from "node:crypto";

// The middleware marks its internal rewrites to /code-sites/<slug>/… with this value.
// Only requests carrying it are served, so a code website can never be loaded on the
// platform's own address (where its JavaScript would run next to the admin panel).
export const CODE_SITE_HEADER = "x-code-site-auth";

let cached: string | null = null;
export function codeSiteMarker() {
  cached ??= createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}:code-site-rewrite`).digest("hex");
  return cached;
}
