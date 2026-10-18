import Link from "next/link";
import { notFound } from "next/navigation";
import { setUserActive, updateTeamMember } from "@/app/actions/admin";
import ActionForm from "@/components/admin/ActionForm";
import PermissionFields from "@/components/admin/PermissionFields";
import { PageHeader } from "@/components/admin/Shell";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { staffPermissions } from "@/lib/permissions";

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  const { id } = await params;
  const member = await db.user.findFirst({
    where: { id, role: { in: ["SUPER_ADMIN", "STAFF"] } },
    include: { clientsOwned: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
  });
  if (!member) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={member.name}
        description={`${member.role === "SUPER_ADMIN" ? "Super Admin" : "Team Member"} · ${member.email}`}
        actions={<Link href="/admin/team" className="btn-secondary">← Team</Link>}
      />
      <div className="card">
        <ActionForm action={updateTeamMember} submitLabel="Save changes">
          <input type="hidden" name="id" value={member.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Full name</label><input name="name" defaultValue={member.name} className="input" /></div>
            <div><label className="label">New password (leave blank to keep)</label><input name="password" type="password" autoComplete="new-password" className="input" /></div>
          </div>
          {member.role === "STAFF" && <PermissionFields value={staffPermissions(member)} />}
        </ActionForm>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-slate-900">Clients ({member.clientsOwned.length})</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {member.clientsOwned.map((c) => (
            <li key={c.id}><Link href={`/admin/clients/${c.id}`} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-indigo-50">{c.name}</Link></li>
          ))}
          {member.clientsOwned.length === 0 && <li className="text-slate-500">None yet.</li>}
        </ul>
      </div>

      {member.id !== admin.id && (
        <div className="card flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-900">{member.isActive ? "Deactivate account" : "Reactivate account"}</h2>
            <p className="text-sm text-slate-500">{member.isActive ? "They will be signed out and unable to log in." : "Allow them to sign in again."}</p>
          </div>
          <form action={setUserActive}>
            <input type="hidden" name="id" value={member.id} />
            <input type="hidden" name="active" value={String(!member.isActive)} />
            <button className={member.isActive ? "btn-danger" : "btn-primary"}>{member.isActive ? "Deactivate" : "Reactivate"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
