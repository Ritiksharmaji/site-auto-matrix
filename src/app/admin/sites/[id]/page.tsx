import Link from "next/link";
import { notFound } from "next/navigation";
import SiteBuilder from "@/components/builder/SiteBuilder";
import { PageHeader, StatusBadge } from "@/components/admin/Shell";
import { requireStaff } from "@/lib/auth";
import { resolveAutomation } from "@/lib/automation";
import { db } from "@/lib/db";
import { canPublish, siteScope } from "@/lib/permissions";
import { editorProps, loadEnquiries } from "@/lib/site-editor-data";

export default async function SiteBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const { id } = await params;
  const site = await db.site.findFirst({ where: { id, ...siteScope(user) }, include: { client: { select: { id: true, name: true } } } });
  if (!site) notFound();
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
      <SiteBuilder {...props} enquiries={await loadEnquiries(site.id)} automation={resolveAutomation(site.automation)} canPublish={canPublish(user)} />
    </div>
  );
}
