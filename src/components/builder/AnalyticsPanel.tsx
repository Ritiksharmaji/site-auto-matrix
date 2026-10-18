import type { SiteAnalytics } from "@/lib/analytics";

/** Simple bar chart of daily views plus totals and top referrers. */
export default function AnalyticsPanel({ data }: { data: SiteAnalytics }) {
  const max = Math.max(1, ...data.daily.map((d) => d.views));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="card !p-4">
          <p className="text-xs text-slate-500">Page views ({data.days} days)</p>
          <p className="text-2xl font-semibold text-slate-900">{data.views}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-slate-500">Unique visitors (daily)</p>
          <p className="text-2xl font-semibold text-slate-900">{data.visitors}</p>
        </div>
      </div>
      <div className="card">
        <p className="mb-3 text-sm font-medium text-slate-700">Daily views</p>
        <div className="flex h-32 items-end gap-[3px]" role="img" aria-label={`Daily page views for the last ${data.days} days`}>
          {data.daily.map((d) => (
            <div key={d.date} className="group relative flex-1">
              <div className="w-full rounded-t bg-indigo-500/80 hover:bg-indigo-600" style={{ height: `${Math.max(2, (d.views / max) * 128)}px` }} />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: {d.views}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>{new Date(data.daily[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
          <span>Today</span>
        </div>
      </div>
      <div className="card">
        <p className="mb-2 text-sm font-medium text-slate-700">Top referrers</p>
        <ul className="space-y-1 text-sm">
          {data.referrers.map((r) => (
            <li key={r.host} className="flex justify-between"><span className="text-slate-700">{r.host}</span><span className="font-medium">{r.views}</span></li>
          ))}
          {data.referrers.length === 0 && <li className="text-slate-500">Direct visits only so far.</li>}
        </ul>
      </div>
      <p className="text-xs text-slate-500">Only published websites are counted. Builder previews and bots are excluded. No cookies or IP addresses are stored.</p>
    </div>
  );
}
