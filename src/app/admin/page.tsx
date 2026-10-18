import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/admin/Shell";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientScope, siteScope, staffPermissions } from "@/lib/permissions";
import { getModule } from "@/modules/registry";

export default async function Dashboard() {
  const user = await requireStaff();
  const isOwner = user.role === "SUPER_ADMIN";
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [clientCount, siteCount, liveCount, enquiryCount, recentSites, byModule] = await Promise.all([
    db.client.count({ where: clientScope(user) }),
    db.site.count({ where: siteScope(user) }),
    db.site.count({ where: { ...siteScope(user), status: "PUBLISHED" } }),
    db.enquiry.count({ where: { site: siteScope(user), createdAt: { gte: since } } }),
    db.site.findMany({
      where: siteScope(user),
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { client: { select: { name: true, owner: { select: { name: true } } } } },
    }),
    db.site.groupBy({ by: ["moduleKey"], where: siteScope(user), _count: true }),
  ]);

  const stats = [
    { label: isOwner ? "Total clients" : "My clients", value: clientCount },
    { label: "Websites", value: siteCount },
    { label: "Live websites", value: liveCount },
    { label: "Enquiries (30 days)", value: enquiryCount },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description={isOwner ? "Overview of the whole platform." : "Overview of the clients you manage."}
        actions={<Link href="/admin/clients/new" className="btn-primary">+ New client</Link>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {!isOwner && <StaffLimits user={user} clientCount={clientCount} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recently updated websites</h2>
            <Link href="/admin/sites" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {recentSites.length === 0 ? (
            <p className="text-sm text-slate-500">No websites yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentSites.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/sites/${s.id}`} className="font-medium text-slate-900 hover:text-indigo-600">{s.name}</Link>
                    <p className="truncate text-xs text-slate-500">
                      {getModule(s.moduleKey)?.name} · {s.client.name}
                      {isOwner && ` · managed by ${s.client.owner.name}`}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-900">Websites by module</h2>
          <ul className="space-y-3">
            {byModule.map((m) => (
              <li key={m.moduleKey} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{getModule(m.moduleKey)?.name ?? m.moduleKey}</span>
                <span className="font-semibold text-slate-900">{m._count}</span>
              </li>
            ))}
            {byModule.length === 0 && <li className="text-sm text-slate-500">No data yet.</li>}
          </ul>
        </div>
      </div>

      {isOwner && <TeamOverview />}
    </div>
  );
}

function StaffLimits({ user, clientCount }: { user: Parameters<typeof staffPermissions>[0]; clientCount: number }) {
  const p = staffPermissions(user);
  return (
    <div className="card text-sm text-slate-600">
      <h2 className="mb-2 font-semibold text-slate-900">Your access</h2>
      <p>
        Clients: <b>{clientCount}</b> of <b>{p.maxClients}</b> · Publish websites: <b>{p.canPublish ? "Yes" : "No (ask the admin)"}</b> ·
        Modules: <b>{p.allowedModules.map((k) => getModule(k)?.name ?? k).join(", ")}</b>
      </p>
    </div>
  );
}

async function TeamOverview() {
  const [team, activity] = await Promise.all([
    db.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "STAFF"] } },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, role: true, isActive: true, _count: { select: { clientsOwned: true } } },
    }),
    db.activity.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } }),
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Team performance</h2>
          <Link href="/admin/team" className="text-sm text-indigo-600 hover:underline">Manage team</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400">
            <tr><th className="pb-2">Member</th><th className="pb-2">Role</th><th className="pb-2 text-right">Clients</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {team.map((t) => (
              <tr key={t.id} className={t.isActive ? "" : "opacity-50"}>
                <td className="py-2 text-slate-900">{t.name}</td>
                <td className="py-2 text-slate-500">{t.role === "SUPER_ADMIN" ? "Super Admin" : "Team Member"}</td>
                <td className="py-2 text-right font-medium">{t._count.clientsOwned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent activity</h2>
          <Link href="/admin/activity" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>
        <ul className="space-y-2 text-sm">
          {activity.map((a) => (
            <li key={a.id} className="flex justify-between gap-4">
              <span className="text-slate-700">{a.details}</span>
              <span className="shrink-0 text-xs text-slate-400">{a.createdAt.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
            </li>
          ))}
          {activity.length === 0 && <li className="text-slate-500">No activity yet.</li>}
        </ul>
      </div>
    </div>
  );
}
