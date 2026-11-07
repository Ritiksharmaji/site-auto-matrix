import { PageHeader } from "@/components/admin/Shell";
import { requireStaff } from "@/lib/auth";
import { siteBaseDomain } from "@/lib/hosts";
import { blueprintCategories, blueprintOptions } from "@/lib/blueprint-options";
import { codeStartOptions } from "@/lib/code-options";
import { moduleOptions } from "@/lib/module-options";
import { staffPermissions } from "@/lib/permissions";
import NewClientForm from "./NewClientForm";

export default async function NewClientPage({ searchParams }: { searchParams: Promise<{ blueprint?: string }> }) {
  const user = await requireStaff();
  const allowed = staffPermissions(user).allowedModules;
  const modules = moduleOptions(allowed);
  const blueprints = await blueprintOptions(user, allowed);
  const { blueprint } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New client" description="Create the client, their login and their first website in one step." />
      {modules.length === 0 ? (
        <p className="card text-sm text-slate-600">You don&apos;t have access to any modules yet. Ask the admin.</p>
      ) : (
        <NewClientForm modules={modules} platformHost={siteBaseDomain()} blueprints={blueprints} categories={blueprintCategories()} initialBlueprint={blueprint} code={codeStartOptions(staffPermissions(user))} />
      )}
    </div>
  );
}
