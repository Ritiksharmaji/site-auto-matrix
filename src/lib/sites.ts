import { db } from "./db";
import { getModule, resolveContent, resolveTheme } from "@/modules/registry";

/** Find a site by its slug (subdomain) or its custom domain. */
export async function findSiteByKey(key: string) {
  const k = decodeURIComponent(key).toLowerCase();
  return db.site.findFirst({ where: { OR: [{ slug: k }, { customDomain: k }, { customDomain: `www.${k}` }] } });
}

type SiteRow = NonNullable<Awaited<ReturnType<typeof findSiteByKey>>>;

/** Everything SiteRenderer needs, with module defaults filled in. */
export function buildRenderProps(site: Pick<SiteRow, "id" | "moduleKey" | "enabledSections" | "theme" | "content">) {
  const mod = getModule(site.moduleKey);
  if (!mod) return null;
  const { brand, sections } = resolveContent(mod, site.content);
  return {
    siteId: site.id,
    module: mod,
    enabledSections: (site.enabledSections as string[]) ?? [],
    theme: resolveTheme(mod, site.theme),
    brand,
    sections,
  };
}

/** URL where a site can be viewed in this environment. */
export function siteUrl(site: { slug: string; customDomain: string | null }) {
  if (site.customDomain) return `https://${site.customDomain}`;
  const host = process.env.PLATFORM_HOST ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${site.slug}.${host}`;
}
