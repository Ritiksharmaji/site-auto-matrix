import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import PageViewTracker from "@/components/site/PageViewTracker";
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
  if (!props) return {};
  const { brand, sections } = props;
  const title = brand.tagline ? `${brand.siteName} – ${brand.tagline}` : brand.siteName;
  const description = brand.metaDescription || (sections.hero?.subheadline as string) || brand.tagline;
  const heroImage = (sections.hero?.image as string) || brand.logo;
  const host = (await headers()).get("host") ?? "";
  const origin = `${host.includes("localhost") ? "http" : "https"}://${host}`;
  const image = heroImage ? new URL(heroImage, origin).toString() : undefined;
  return {
    title,
    description,
    alternates: { canonical: `${origin}/` },
    robots: site.status === "PUBLISHED" ? undefined : { index: false, follow: false },
    openGraph: { title, description, siteName: brand.siteName, type: "website", url: `${origin}/`, images: image ? [image] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
    icons: brand.logo ? { icon: brand.logo } : undefined,
  };
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
      {site.status === "PUBLISHED" && <PageViewTracker siteId={site.id} />}
      <OrganizationJsonLd name={props.brand.siteName} phone={props.brand.phone} email={props.brand.email} address={props.brand.address} />
    </>
  );
}

/** Structured data so search engines show the business name and contact details. */
function OrganizationJsonLd({ name, phone, email, address }: { name: string; phone: string; email: string; address: string }) {
  const data = { "@context": "https://schema.org", "@type": "Organization", name, telephone: phone || undefined, email: email || undefined, address: address || undefined };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
