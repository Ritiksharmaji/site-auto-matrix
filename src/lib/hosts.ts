// Host rules shared by the middleware, server actions and the TLS check (edge-safe).
//
//   PLATFORM_HOST     where the admin panel and client portal live   (sites.onekampus.com)
//   SITE_BASE_DOMAIN  client sites are <slug>.SITE_BASE_DOMAIN       (onekampus.com)
//
// Locally both default to localhost:3000, so sites are <slug>.localhost:3000.

export function platformHost() {
  return (process.env.PLATFORM_HOST ?? "localhost:3000").toLowerCase();
}

export function siteBaseDomain() {
  return (process.env.SITE_BASE_DOMAIN ?? platformHost()).toLowerCase();
}

/**
 * Subdomains no client may use: platform/infrastructure names plus anything in
 * RESERVED_SUBDOMAINS (comma-separated), e.g. other apps on the same domain.
 */
const BUILT_IN_RESERVED = [
  "www", "admin", "api", "app", "portal", "login", "mail", "smtp", "imap", "ftp",
  "cdn", "static", "assets", "dev", "staging", "test", "ns1", "ns2", "sites", "status",
];

export function isReservedSlug(slug: string) {
  const extra = (process.env.RESERVED_SUBDOMAINS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return BUILT_IN_RESERVED.includes(slug) || extra.includes(slug) || platformHost().split(".")[0] === slug;
}

/** The slug for a client-site host such as advera.onekampus.com, or null. */
export function slugFromHost(host: string) {
  const base = siteBaseDomain();
  if (!host.endsWith(`.${base}`)) return null;
  const sub = host.slice(0, -(base.length + 1));
  return sub && !sub.includes(".") ? sub : null;
}

/** Public URL scheme for a host: http only for localhost. */
export function protocolFor(host: string) {
  return host.startsWith("localhost") || host.includes(".localhost") ? "http" : "https";
}
