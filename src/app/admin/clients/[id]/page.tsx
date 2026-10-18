import Link from "next/link";
import { notFound } from "next/navigation";
import { createSiteForClient, deleteClient, reassignClient, setClientLogin, updateClient } from "@/app/actions/admin";
import { createInvoice, saveClientPlan } from "@/app/actions/billing";
import ActionForm from "@/components/admin/ActionForm";
import InvoiceTable from "@/components/billing/InvoiceTable";
import ConfirmButton from "@/components/admin/ConfirmButton";
import ModulePicker from "@/components/admin/ModulePicker";
import { PageHeader, StatusBadge } from "@/components/admin/Shell";
import { requireStaff } from "@/lib/auth";
import { CYCLE_LABEL } from "@/lib/billing";
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
      invoices: { orderBy: { dueDate: "desc" }, take: 24 },
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

          {isOwner && (
            <section className="space-y-3">
              <h2 className="font-semibold text-slate-900">Invoices</h2>
              <InvoiceTable rows={client.invoices} manage showClient={false} />
              <details className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
                <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ Create a one-off invoice</summary>
                <div className="mt-4">
                  <ActionForm action={createInvoice} submitLabel="Create invoice">
                    <input type="hidden" name="clientId" value={client.id} />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-3"><label className="label">Description</label><input name="description" required placeholder="e.g. Website setup fee" className="input" /></div>
                      <div><label className="label">Amount (₹)</label><input name="amount" inputMode="decimal" required className="input" /></div>
                      <div><label className="label">Due date</label><input name="dueDate" type="date" required className="input" /></div>
                    </div>
                  </ActionForm>
                </div>
              </details>
            </section>
          )}

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
              <h2 className="mb-1 font-semibold text-slate-900">Billing plan</h2>
              <p className="mb-4 text-xs text-slate-500">Invoices are created automatically before each due date.</p>
              <ActionForm action={saveClientPlan} submitLabel="Save plan">
                <input type="hidden" name="clientId" value={client.id} />
                <div><label className="label">Plan name</label><input name="planName" defaultValue={client.planName ?? ""} placeholder="e.g. Website + Automation" className="input" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Fee (₹)</label><input name="planAmount" inputMode="decimal" defaultValue={client.planAmount ? String(client.planAmount / 100) : ""} className="input" /></div>
                  <div>
                    <label className="label">Cycle</label>
                    <select name="billingCycle" defaultValue={client.billingCycle} className="input">
                      {Object.entries(CYCLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="label">Next due date</label><input name="nextDueDate" type="date" defaultValue={client.nextDueDate ? toDateInput(client.nextDueDate) : ""} className="input" /></div>
              </ActionForm>
            </section>
          )}

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

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
