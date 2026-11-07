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
import { buildOnDisk, FRAMEWORKS, signPreviewToken } from "@/lib/code-sites";
import { cloneUrl, githubConfig, vscodeCloneLink } from "@/lib/github";
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
      />
    </div>
  );
}

/** Code websites (built in VS Code): deploys, rollback, developer access, settings. */
async function CodeSitePage({ site, user }: { site: { id: string; name: string; slug: string; customDomain: string | null; status: "DRAFT" | "PUBLISHED"; automation: unknown; client: { id: string; name: string } }; user: Awaited<ReturnType<typeof requireStaff>> }) {
  const project = await db.codeProject.findUnique({ where: { siteId: site.id }, include: { deploys: { orderBy: { createdAt: "desc" }, take: 20 } } });
  if (!project) notFound();
  const fw = FRAMEWORKS.find((f) => f.value === project.framework)!;
  const url = siteUrl(site);
  return (
    <div>
      <PageHeader
        title={site.name}
        description={`Code website (${fw.label}) · client: ${site.client.name}`}
        actions={
          <>
            <StatusBadge status={site.status} />
            <Link href={`/admin/clients/${site.client.id}`} className="btn-secondary">Client</Link>
          </>
        }
      />
      <CodeSiteBuilder
        site={{ id: site.id, name: site.name, slug: site.slug, customDomain: site.customDomain, status: site.status, url }}
        code={{
          framework: project.framework,
          frameworkLabel: fw.label,
          repo: `${project.repoOwner}/${project.repoName}`,
          repoUrl: `https://github.com/${project.repoOwner}/${project.repoName}`,
          cloneUrl: cloneUrl(project.repoOwner, project.repoName),
          vscodeUrl: vscodeCloneLink(project.repoOwner, project.repoName),
          branch: project.branch,
          githubReady: githubConfig().ready,
          devCommand: project.framework === "HTML" ? "npx serve ." : "npm install && npm run dev",
        }}
        previewUrl={`${url}/?_preview=${await signPreviewToken(site.id)}`}
        deploys={project.deploys.map((d) => ({
          id: d.id,
          status: d.status,
          commitSha: d.commitSha,
          commitMessage: d.commitMessage,
          author: d.author,
          runUrl: d.runUrl,
          error: d.error,
          createdAt: d.createdAt.toISOString(),
          finishedAt: d.finishedAt?.toISOString() ?? null,
          onDisk: buildOnDisk(site.id, d.id),
        }))}
        enquiries={await loadEnquiries(site.id)}
        automation={resolveAutomation(site.automation)}
        canPublish={canPublish(user)}
        analytics={<AnalyticsPanel data={await siteAnalytics(site.id)} />}
      />
    </div>
  );
}
