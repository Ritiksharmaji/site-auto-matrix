import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { enquiryWhere, formLabel, type EnquiryFilters } from "@/lib/crm";
import { siteScope } from "@/lib/permissions";
import EnquiryFiltersBar from "./EnquiryFiltersBar";
import EnquiryTable from "./EnquiryTable";

/** Filterable enquiry list, used by /admin/enquiries and /portal/enquiries. */
export default async function EnquiriesView({ user, filters, basePath }: { user: User; filters: EnquiryFilters; basePath: string }) {
  const isPlatform = user.role !== "CLIENT";
  const where = enquiryWhere(user, filters);
  const countWhere = enquiryWhere(user, { ...filters, status: undefined });

  const [rows, sites, grouped] = await Promise.all([
    db.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { site: { select: { name: true, moduleKey: true } }, assignedTo: { select: { name: true } } },
    }),
    db.site.findMany({ where: siteScope(user), select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.enquiry.groupBy({ by: ["status"], where: countWhere, _count: true }),
  ]);

  const counts: Record<string, number> = { ALL: 0 };
  for (const g of grouped) {
    counts[g.status] = g._count;
    counts.ALL += g._count;
  }

  return (
    <>
      <EnquiryFiltersBar filters={filters} sites={sites} showAssigned={isPlatform} counts={counts} />
      <EnquiryTable
        basePath={basePath}
        showAssignee={isPlatform}
        rows={rows.map((r) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          email: r.email,
          status: r.status,
          formLabel: formLabel(r.site.moduleKey, r.formType),
          siteName: r.site.name,
          assignee: r.assignedTo?.name ?? null,
          createdAt: r.createdAt,
        }))}
      />
    </>
  );
}
