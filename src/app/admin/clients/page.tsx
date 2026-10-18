import Link from "next/link";
import { PageHeader } from "@/components/admin/Shell";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientScope } from "@/lib/permissions";
import { getModule } from "@/modules/registry";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireStaff();
  const q = (await searchParams).q?.trim() ?? "";
  const clients = await db.client.findMany({
    where: {
      ...clientScope(user),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true } }, sites: { select: { moduleKey: true, status: true } } },
  });
  const isOwner = user.role === "SUPER_ADMIN";

  return (
    <div>
      <PageHeader
        title="Clients"
        description={isOwner ? "All clients on the platform." : "Clients you manage."}
        actions={<Link href="/admin/clients/new" className="btn-primary">+ New client</Link>}
      />
      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search by name or email…" className="input max-w-sm" />
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Client</th>
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3">Websites</th>
              {isOwner && <th className="px-5 py-3">Managed by</th>}
              <th className="px-5 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/admin/clients/${c.id}`} className="font-medium text-slate-900 hover:text-indigo-600">{c.name}</Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{c.contactName}<br /><span className="text-xs text-slate-400">{c.email}</span></td>
                <td className="px-5 py-3 text-slate-600">
                  {c.sites.map((s) => getModule(s.moduleKey)?.name).join(", ") || "—"}
                  <span className="ml-1 text-xs text-slate-400">({c.sites.filter((s) => s.status === "PUBLISHED").length} live)</span>
                </td>
                {isOwner && <td className="px-5 py-3 text-slate-600">{c.owner.name}</td>}
                <td className="px-5 py-3 text-slate-500">{c.createdAt.toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No clients found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
