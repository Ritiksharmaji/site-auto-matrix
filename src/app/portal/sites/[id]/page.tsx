import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/Shell";
import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteScope } from "@/lib/permissions";
import { editorProps, loadEnquiries } from "@/lib/site-editor-data";
import PortalEditor from "./PortalEditor";

export default async function PortalSitePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  const { id } = await params;
  const site = await db.site.findFirst({ where: { id, ...siteScope(user) } });
  if (!site) notFound();
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
