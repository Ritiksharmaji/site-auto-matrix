import Link from "next/link";
import { PageHeader } from "@/components/admin/Shell";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { staffPermissions } from "@/lib/permissions";

export default async function TeamPage() {
  await requireSuperAdmin();
  const team = await db.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "STAFF"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { clientsOwned: true } } },
  });
  return (
    <div>
      <PageHeader title="Team" description="People who can sign in to this admin panel." actions={<Link href="/admin/team/new" className="btn-primary">+ Add member</Link>} />
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Clients</th><th className="px-5 py-3">Can publish</th><th className="px-5 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {team.map((m) => {
              const p = staffPermissions(m);
              return (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/team/${m.id}`} className="font-medium text-slate-900 hover:text-indigo-600">{m.name}</Link>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{m.role === "SUPER_ADMIN" ? "Super Admin" : "Team Member"}</td>
                  <td className="px-5 py-3 text-slate-600">{m._count.clientsOwned}{m.role === "STAFF" && ` / ${p.maxClients}`}</td>
                  <td className="px-5 py-3 text-slate-600">{p.canPublish ? "Yes" : "No"}</td>
                  <td className="px-5 py-3">{m.isActive ? <span className="text-emerald-700">Active</span> : <span className="text-slate-400">Deactivated</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
