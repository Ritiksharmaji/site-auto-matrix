import { createTeamMember } from "@/app/actions/admin";
import ActionForm from "@/components/admin/ActionForm";
import PermissionFields from "@/components/admin/PermissionFields";
import { PageHeader } from "@/components/admin/Shell";
import { requireSuperAdmin } from "@/lib/auth";
import { DEFAULT_STAFF_PERMISSIONS } from "@/lib/permissions";

export default async function NewMemberPage() {
  await requireSuperAdmin();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add team member" />
      <div className="card">
        <ActionForm action={createTeamMember} submitLabel="Add member">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Full name</label><input name="name" required className="input" /></div>
            <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
            <div><label className="label">Password (min 8)</label><input name="password" type="password" minLength={8} required autoComplete="new-password" className="input" /></div>
            <div>
              <label className="label">Role</label>
              <select name="role" className="input" defaultValue="STAFF">
                <option value="STAFF">Team Member (limited access)</option>
                <option value="SUPER_ADMIN">Super Admin (full access)</option>
              </select>
            </div>
          </div>
          <PermissionFields value={DEFAULT_STAFF_PERMISSIONS} />
        </ActionForm>
      </div>
    </div>
  );
}
