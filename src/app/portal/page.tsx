import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/admin/Shell";
import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteScope } from "@/lib/permissions";
import { siteUrl } from "@/lib/sites";
import { getModule } from "@/modules/registry";

export default async function PortalHome() {
  const user = await requireClient();
  const sites = await db.site.findMany({
    where: siteScope(user),
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { enquiries: { where: { isRead: false } } } } },
  });
  return (
    <div>
      <PageHeader title="My websites" description="Update your website content and see enquiries from visitors." />
      <div className="grid gap-4 sm:grid-cols-2">
        {sites.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between">
              <p className="font-semibold text-slate-900">{s.name}</p>
              <StatusBadge status={s.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{getModule(s.moduleKey)?.name} website</p>
            {s._count.enquiries > 0 && <p className="mt-2 text-sm font-medium text-amber-700">{s._count.enquiries} new enquiries</p>}
            <div className="mt-4 flex gap-2">
              <Link href={`/portal/sites/${s.id}`} className="btn-primary">Edit content</Link>
              <a href={siteUrl(s)} target="_blank" rel="noreferrer" className="btn-secondary">View site ↗</a>
            </div>
          </div>
        ))}
        {sites.length === 0 && <p className="text-sm text-slate-500">No websites yet. Contact your account manager.</p>}
      </div>
    </div>
  );
}
