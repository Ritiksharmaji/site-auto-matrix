import { PageHeader } from "@/components/admin/Shell";
import { requireStaff } from "@/lib/auth";
import { moduleOptions } from "@/lib/module-options";
import { staffPermissions } from "@/lib/permissions";
import NewClientForm from "./NewClientForm";

export default async function NewClientPage() {
  const user = await requireStaff();
  const modules = moduleOptions(staffPermissions(user).allowedModules);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New client" description="Create the client, their login and their first website in one step." />
      {modules.length === 0 ? (
        <p className="card text-sm text-slate-600">You don&apos;t have access to any modules yet. Ask the admin.</p>
      ) : (
        <NewClientForm modules={modules} platformHost={process.env.PLATFORM_HOST ?? "localhost:3000"} />
      )}
    </div>
  );
}
