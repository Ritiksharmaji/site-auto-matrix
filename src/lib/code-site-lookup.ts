import { db } from "./db";

// Which site keys (subdomain slug or custom domain) are code websites. Used by the
// middleware on every client-site request, so answers are cached for a short time.

const TTL_MS = 15_000;
const cache = new Map<string, { slug: string | null; until: number }>();

/** The slug of the code website for this key, or null for builder sites / unknown keys. */
export async function codeSiteSlug(key: string): Promise<string | null> {
  const k = key.toLowerCase();
  const hit = cache.get(k);
  if (hit && hit.until > Date.now()) return hit.slug;
  const site = await db.site.findFirst({
    where: { OR: [{ slug: k }, { customDomain: k }, { customDomain: `www.${k}` }] },
    select: { slug: true, moduleKey: true },
  });
  const slug = site?.moduleKey === "code" ? site.slug : null;
  if (cache.size > 5000) cache.clear();
  cache.set(k, { slug, until: Date.now() + TTL_MS });
  return slug;
}

export function forgetCodeSiteLookups() {
  cache.clear();
}
