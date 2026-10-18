import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/admin/Shell";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteScope } from "@/lib/permissions";
import { siteUrl } from "@/lib/sites";
import { getModule } from "@/modules/registry";

export default async function SitesPage() {
  const user = await requireStaff();
  const sites = await db.site.findMany({
    where: siteScope(user),
    orderBy: { updatedAt: "desc" },
    include: { client: { select: { id: true, name: true } }, _count: { select: { enquiries: { where: { isRead: false } } } } },
  });
  return (
    <div>
      <PageHeader title="Websites" description="Open a website to change its sections, design and content." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sites.map((s) => (
          <Link key={s.id} href={`/admin/sites/${s.id}`} className="card block transition hover:border-indigo-300 hover:shadow">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-slate-900">{s.name}</p>
              <StatusBadge status={s.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{getModule(s.moduleKey)?.name} · {s.client.name}</p>
            <p className="mt-3 truncate text-xs text-indigo-600">{siteUrl(s)}</p>
            {s._count.enquiries > 0 && <p className="mt-2 text-xs font-medium text-amber-700">{s._count.enquiries} new enquiries</p>}
          </Link>
        ))}
        {sites.length === 0 && <p className="text-sm text-slate-500">No websites yet.</p>}
      </div>
    </div>
  );
}
