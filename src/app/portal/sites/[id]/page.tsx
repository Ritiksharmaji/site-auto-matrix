import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/Shell";
import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteScope } from "@/lib/permissions";
import { editorProps, loadEnquiries } from "@/lib/site-editor-data";
import RecentEnquiries from "@/components/crm/RecentEnquiries";
import { siteUrl } from "@/lib/sites";
import PortalEditor from "./PortalEditor";

export default async function PortalSitePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  const { id } = await params;
  const site = await db.site.findFirst({ where: { id, ...siteScope(user) } });
  if (!site) notFound();
  if (site.moduleKey === "code") {
    // Code websites are changed by the developer in code; the client sees the site and its enquiries.
    const url = siteUrl(site);
    return (
      <div>
        <PageHeader title={site.name} description="Your website is built and updated by your developer." actions={<Link href="/portal" className="btn-secondary">← My websites</Link>} />
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">To change text or pages, contact your account manager. New enquiries from the website appear below.</p>
          <a href={url} target="_blank" rel="noreferrer" className="btn-secondary">Open website ↗</a>
        </div>
        <RecentEnquiries enquiries={await loadEnquiries(site.id)} basePath="/portal/enquiries" siteId={site.id} />
      </div>
    );
  }
  const props = editorProps(site);
  if (!props) notFound();

  return (
    <div>
      <PageHeader title={site.name} description="Edit your website text, images and contact details." actions={<Link href="/portal" className="btn-secondary">← My websites</Link>} />
      <PortalEditor
        siteId={site.id}
        slug={site.slug}
        module={props.module}
        enabledSections={props.enabledSections}
        brand={props.brand}
        sections={props.sections}
        enquiries={await loadEnquiries(site.id)}
      />
    </div>
  );
}
