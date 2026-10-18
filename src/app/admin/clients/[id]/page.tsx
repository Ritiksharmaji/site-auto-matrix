import Link from "next/link";
import { notFound } from "next/navigation";
import { createSiteForClient, deleteClient, reassignClient, setClientLogin, updateClient } from "@/app/actions/admin";
import ActionForm from "@/components/admin/ActionForm";
import ConfirmButton from "@/components/admin/ConfirmButton";
import ModulePicker from "@/components/admin/ModulePicker";
import { PageHeader, StatusBadge } from "@/components/admin/Shell";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { moduleOptions } from "@/lib/module-options";
import { clientScope, staffPermissions } from "@/lib/permissions";
import { siteUrl } from "@/lib/sites";
import { getModule } from "@/modules/registry";

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const { id } = await params;
  const client = await db.client.findFirst({
    where: { id, ...clientScope(user) },
    include: {
      owner: { select: { id: true, name: true } },
      sites: { orderBy: { createdAt: "asc" }, include: { _count: { select: { enquiries: true } } } },
      users: { select: { id: true, name: true, email: true, isActive: true } },
    },
  });
  if (!client) notFound();

  const perms = staffPermissions(user);
  const isOwner = user.role === "SUPER_ADMIN";
  const team = isOwner
    ? await db.user.findMany({ where: { role: { in: ["SUPER_ADMIN", "STAFF"] }, isActive: true }, select: { id: true, name: true } })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={`Managed by ${client.owner.name} · client since ${client.createdAt.toLocaleDateString("en-IN")}`}
        actions={<Link href="/admin/clients" className="btn-secondary">← All clients</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card">
            <h2 className="mb-4 font-semibold text-slate-900">Websites</h2>
            <ul className="divide-y divide-slate-100">
              {client.sites.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/sites/${s.id}`} className="font-medium text-slate-900 hover:text-indigo-600">{s.name}</Link>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {getModule(s.moduleKey)?.name} · {siteUrl(s)} · {s._count.enquiries} enquiries
                    </p>
                  </div>
                  <Link href={`/admin/sites/${s.id}`} className="btn-secondary !py-1.5">Open builder</Link>
                </li>
              ))}
            </ul>
            <details className="mt-4 rounded-lg border border-dashed border-slate-300 p-4">
              <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ Add another website for this client</summary>
              <div className="mt-4">
                <ActionForm action={createSiteForClient} submitLabel="Create website">
                  <input type="hidden" name="clientId" value={client.id} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="label">Website name</label><input name="name" required className="input" /></div>
                    <div><label className="label">Web address (slug)</label><input name="slug" required className="input" placeholder="e.g. greenvalley-junior" /></div>
                  </div>
                  <ModulePicker modules={moduleOptions(perms.allowedModules)} />
                </ActionForm>
              </div>
            </details>
          </section>

          <section className="card">
            <h2 className="mb-1 font-semibold text-slate-900">Client logins</h2>
            <p className="mb-4 text-sm text-slate-500">These people can sign in and edit content on this client&apos;s websites only.</p>
            <ul className="mb-4 divide-y divide-slate-100 text-sm">
              {client.users.map((u) => (
                <li key={u.id} className="flex justify-between py-2">
                  <span className="text-slate-900">{u.name}</span>
                  <span className="text-slate-500">{u.email}</span>
                </li>
              ))}
              {client.users.length === 0 && <li className="py-2 text-slate-500">No logins yet.</li>}
            </ul>
            <details className="rounded-lg border border-dashed border-slate-300 p-4">
              <summary className="cursor-pointer text-sm font-medium text-indigo-600">Add login or reset a password</summary>
              <div className="mt-4">
                <ActionForm action={setClientLogin} submitLabel="Save login">
                  <input type="hidden" name="clientId" value={client.id} />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div><label className="label">Name (new login only)</label><input name="name" className="input" /></div>
                    <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
                    <div><label className="label">New password</label><input name="password" type="password" minLength={8} required autoComplete="new-password" className="input" /></div>
                  </div>
                </ActionForm>
              </div>
            </details>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card">
            <h2 className="mb-4 font-semibold text-slate-900">Details</h2>
            <ActionForm action={updateClient} submitLabel="Save details">
              <input type="hidden" name="id" value={client.id} />
              <div><label className="label">Business name</label><input name="name" defaultValue={client.name} required className="input" /></div>
              <div><label className="label">Contact person</label><input name="contactName" defaultValue={client.contactName} required className="input" /></div>
              <div><label className="label">Email</label><input name="email" type="email" defaultValue={client.email} required className="input" /></div>
              <div><label className="label">Phone</label><input name="phone" defaultValue={client.phone ?? ""} className="input" /></div>
              <div><label className="label">Internal notes</label><textarea name="notes" rows={3} defaultValue={client.notes ?? ""} className="input" /></div>
            </ActionForm>
          </section>

          {isOwner && (
            <section className="card">
              <h2 className="mb-3 font-semibold text-slate-900">Assigned team member</h2>
              <form action={reassignClient} className="flex gap-2">
                <input type="hidden" name="id" value={client.id} />
                <select name="ownerId" defaultValue={client.owner.id} className="input">
                  {team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button className="btn-secondary">Assign</button>
              </form>
            </section>
          )}

          {perms.canDeleteClients && (
            <section className="card border-red-200">
              <h2 className="mb-2 font-semibold text-red-700">Delete client</h2>
              <p className="mb-3 text-sm text-slate-500">Removes the client, their logins, websites and enquiries. This cannot be undone.</p>
              <form action={deleteClient}>
                <input type="hidden" name="id" value={client.id} />
                <ConfirmButton className="btn-danger" message={`Delete ${client.name} and all their websites? This cannot be undone.`}>Delete client</ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
