import Link from "next/link";
import BlueprintGallery from "@/components/admin/BlueprintGallery";
import { PageHeader } from "@/components/admin/Shell";
import { requireStaff } from "@/lib/auth";
import { blueprintCategories, blueprintOptions } from "@/lib/blueprint-options";
import { staffPermissions } from "@/lib/permissions";

export default async function BlueprintsPage() {
  const user = await requireStaff();
  const blueprints = await blueprintOptions(user, staffPermissions(user).allowedModules);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Blueprints"
        description="Ready-made websites. Pick one for a new client, then just change the text and images. Save any site's design as your own blueprint from its Design tab."
        actions={<Link href="/admin/clients/new" className="btn-secondary">New client (standard way)</Link>}
      />
      {blueprints.length === 0 ? (
        <p className="card text-sm text-slate-600">No blueprints for the modules you can use. Ask the admin for module access.</p>
      ) : (
        <BlueprintGallery blueprints={blueprints} categories={blueprintCategories()} />
      )}
    </div>
  );
}
