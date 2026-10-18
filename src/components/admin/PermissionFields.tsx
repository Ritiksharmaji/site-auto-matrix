import type { StaffPermissions } from "@/lib/permissions";
import { MODULES } from "@/modules/registry";

/** Inputs for a team member's access limits (read by readPermissions in actions/admin.ts). */
export default function PermissionFields({ value }: { value: StaffPermissions }) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-900">Access limits</legend>
      <div className="max-w-xs">
        <label className="label">Maximum clients they can create</label>
        <input name="maxClients" type="number" min={0} defaultValue={value.maxClients} className="input" />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="canPublish" defaultChecked={value.canPublish} className="h-4 w-4" />
        Can publish websites (make them live)
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="canDeleteClients" defaultChecked={value.canDeleteClients} className="h-4 w-4" />
        Can delete clients
      </label>
      <div>
        <span className="label">Modules they can use</span>
        <div className="flex flex-wrap gap-4">
          {MODULES.map((m) => (
            <label key={m.key} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="allowedModules" value={m.key} defaultChecked={value.allowedModules.includes(m.key)} className="h-4 w-4" />
              {m.name}
            </label>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500">Team members always see only their own clients — never platform totals, other members&apos; clients, or this team page.</p>
    </fieldset>
  );
}
