import { STATUS_LABELS } from "./status-labels";

/** GET form for filtering enquiries; also builds the CSV export link. */
export default function EnquiryFiltersBar({
  filters,
  sites,
  showAssigned,
  counts,
}: {
  filters: { status?: string; siteId?: string; q?: string; assigned?: string };
  sites: { id: string; name: string }[];
  showAssigned: boolean;
  counts: Record<string, number>;
}) {
  const exportParams = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]);
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {[["", "All"], ...Object.entries(STATUS_LABELS)].map(([value, label]) => {
          const p = new URLSearchParams(exportParams);
          if (value) p.set("status", value); else p.delete("status");
          const active = (filters.status ?? "") === value;
          return (
            <a key={value} href={`?${p}`} className={`rounded-full px-3 py-1 text-sm ${active ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
              {label} <span className="opacity-70">{counts[value || "ALL"] ?? 0}</span>
            </a>
          );
        })}
      </div>
      <form className="flex flex-wrap items-center gap-2">
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <input name="q" defaultValue={filters.q} placeholder="Search name, email, phone…" className="input max-w-xs" />
        {sites.length > 1 && (
          <select name="siteId" defaultValue={filters.siteId ?? ""} className="input max-w-xs">
            <option value="">All websites</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        {showAssigned && (
          <select name="assigned" defaultValue={filters.assigned ?? ""} className="input max-w-[180px]">
            <option value="">Anyone</option>
            <option value="me">Assigned to me</option>
            <option value="none">Unassigned</option>
          </select>
        )}
        <button className="btn-secondary">Filter</button>
        <a href={`/api/enquiries/export?${exportParams}`} className="btn-secondary ml-auto">Export CSV</a>
      </form>
    </div>
  );
}
