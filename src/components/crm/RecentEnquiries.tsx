import Link from "next/link";
import type { EnquiryStatus } from "@prisma/client";
import { EnquiryStatusSelect } from "./EnquiryStatus";

export type RecentEnquiry = { id: string; name: string; phone: string | null; email: string | null; status: EnquiryStatus; createdAt: string };

/** Compact list of a site's latest enquiries (builder tab / client portal). */
export default function RecentEnquiries({ enquiries, basePath, siteId }: { enquiries: RecentEnquiry[]; basePath: string; siteId: string }) {
  return (
    <div className="space-y-3">
      {enquiries.length === 0 && <p className="card text-sm text-slate-500">No enquiries yet. Form submissions from the website will appear here.</p>}
      {enquiries.map((e) => (
        <div key={e.id} className="card flex items-center justify-between gap-3 !p-4">
          <div className="min-w-0">
            <Link href={`${basePath}/${e.id}`} className="font-medium text-slate-900 hover:text-indigo-600">{e.name}</Link>
            <p className="truncate text-xs text-slate-500">
              {[e.phone, e.email].filter(Boolean).join(" · ")} · {new Date(e.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>
          <EnquiryStatusSelect id={e.id} status={e.status} />
        </div>
      ))}
      <Link href={`${basePath}?siteId=${siteId}`} className="block text-center text-sm text-indigo-600 hover:underline">Open all enquiries →</Link>
    </div>
  );
}
