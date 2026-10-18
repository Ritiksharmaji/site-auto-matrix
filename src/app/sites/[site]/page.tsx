import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteRenderer from "@/components/site/SiteRenderer";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteScope } from "@/lib/permissions";
import { buildRenderProps, findSiteByKey } from "@/lib/sites";

type Params = { params: Promise<{ site: string }> };

export const dynamic = "force-dynamic";

/** Draft sites are visible only to signed-in users who manage them (for preview). */
async function loadVisibleSite(key: string) {
  const site = await findSiteByKey(key);
  if (!site) return null;
  if (site.status === "PUBLISHED") return site;
  const user = await getCurrentUser();
  if (!user) return null;
  const allowed = await db.site.count({ where: { id: site.id, ...siteScope(user) } });
  return allowed ? site : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const site = await findSiteByKey((await params).site);
  if (!site) return {};
  const props = buildRenderProps(site);
  return { title: props?.brand.siteName ?? site.name, description: props?.brand.tagline };
}

export default async function SitePage({ params }: Params) {
  const site = await loadVisibleSite((await params).site);
  if (!site) notFound();
  const props = buildRenderProps(site);
  if (!props) notFound();

  return (
    <>
      {site.status === "DRAFT" && (
        <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
          Draft preview — this site is not public yet
        </div>
      )}
      <SiteRenderer {...props} />
    </>
  );
}
