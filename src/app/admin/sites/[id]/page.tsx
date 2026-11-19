import Link from "next/link";
import { notFound } from "next/navigation";
import AnalyticsPanel from "@/components/builder/AnalyticsPanel";
import CodeSiteBuilder from "@/components/builder/CodeSiteBuilder";
import SiteBuilder from "@/components/builder/SiteBuilder";
import { PageHeader, StatusBadge } from "@/components/admin/Shell";
import { siteAnalytics } from "@/lib/analytics";
import { requireStaff } from "@/lib/auth";
import { resolveAutomation } from "@/lib/automation";
import { db } from "@/lib/db";
import { canPublish, siteScope } from "@/lib/permissions";
import { editorProps, loadEnquiries } from "@/lib/site-editor-data";
import { signPreviewToken } from "@/lib/code-sites";
import { codeTabData } from "@/lib/code-tab-data";
import { githubConfig } from "@/lib/github";
import { staffPermissions } from "@/lib/permissions";
import { siteUrl } from "@/lib/sites";

export default async function SiteBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const { id } = await params;
  const site = await db.site.findFirst({ where: { id, ...siteScope(user) }, include: { client: { select: { id: true, name: true } } } });
  if (!site) notFound();
  if (site.moduleKey === "code") return <CodeSitePage site={site} user={user} />;
  const props = editorProps(site);
  if (!props) notFound();

  return (
    <div>
      <PageHeader
        title={site.name}
        description={`${props.module.name} module · client: ${site.client.name}`}
        actions={
          <>
            <StatusBadge status={site.status} />
            <Link href={`/admin/clients/${site.client.id}`} className="btn-secondary">Client</Link>
          </>
        }
      />
      <SiteBuilder
        {...props}
        enquiries={await loadEnquiries(site.id)} automation={resolveAutomation(site.automation)}
        canPublish={canPublish(user)}
        analytics={<AnalyticsPanel data={await siteAnalytics(site.id)} />}
        code={await codeTabData(site.id)}
        codeBlocked={
          !staffPermissions(user).canCreateCodeSites
            ? "Adding code needs the “Can create code websites” permission. Ask the admin."
            : !githubConfig().ready
              ? "GitHub isn't connected on this server (docs/DEPLOYMENT.md → Code websites)."
              : null
        }
      />
    </div>
  );
}

/** Code websites (built in VS Code): deploys, rollback, developer access, settings. */
async function CodeSitePage({ site, user }: { site: { id: string; name: string; slug: string; customDomain: string | null; status: "DRAFT" | "PUBLISHED"; automation: unknown; client: { id: string; name: string } }; user: Awaited<ReturnType<typeof requireStaff>> }) {
  const data = await codeTabData(site.id);
  if (!data) notFound();
  const url = siteUrl(site);
  return (
    <div>
      <PageHeader
        title={site.name}
        description={`Code website (${data.code.frameworkLabel}) · client: ${site.client.name}`}
        actions={
          <>
            <StatusBadge status={site.status} />
            <Link href={`/admin/clients/${site.client.id}`} className="btn-secondary">Client</Link>
          </>
        }
      />
      <CodeSiteBuilder
        site={{ id: site.id, name: site.name, slug: site.slug, customDomain: site.customDomain, status: site.status, url }}
        code={data.code}
        previewUrl={`${url}/?_preview=${await signPreviewToken(site.id)}`}
        deploys={data.deploys}
        enquiries={await loadEnquiries(site.id)}
        automation={resolveAutomation(site.automation)}
        canPublish={canPublish(user)}
        analytics={<AnalyticsPanel data={await siteAnalytics(site.id)} />}
      />
    </div>
  );
}
