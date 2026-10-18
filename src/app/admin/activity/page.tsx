import { PageHeader } from "@/components/admin/Shell";
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ActivityPage() {
  await requireSuperAdmin();
  const items = await db.activity.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: { select: { name: true, role: true } } } });
  return (
    <div>
      <PageHeader title="Activity log" description="Latest 200 actions across the platform." />
      <div className="card p-0">
        <ul className="divide-y divide-slate-100 text-sm">
          {items.map((a) => (
            <li key={a.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
              <span className="text-slate-800">{a.details}</span>
              <span className="text-xs text-slate-400">{a.createdAt.toLocaleString("en-IN")}</span>
            </li>
          ))}
          {items.length === 0 && <li className="px-5 py-10 text-center text-slate-500">No activity yet.</li>}
        </ul>
      </div>
    </div>
  );
}
