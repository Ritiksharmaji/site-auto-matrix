import Link from "next/link";
import type { EnquiryStatus } from "@prisma/client";
import { EnquiryStatusSelect } from "./EnquiryStatus";

export type EnquiryRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: EnquiryStatus;
  formLabel: string;
  siteName: string;
  assignee: string | null;
  createdAt: Date;
};

/** Enquiry list shared by the admin CRM and the client portal. */
export default function EnquiryTable({ rows, basePath, showAssignee }: { rows: EnquiryRow[]; basePath: string; showAssignee: boolean }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3">Contact</th>
            <th className="px-5 py-3">Form · Website</th>
            {showAssignee && <th className="px-5 py-3">Assigned</th>}
            <th className="px-5 py-3">Received</th>
            <th className="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="px-5 py-3">
                <Link href={`${basePath}/${r.id}`} className="font-medium text-slate-900 hover:text-indigo-600">{r.name}</Link>
              </td>
              <td className="px-5 py-3 text-slate-600">{r.phone}<br /><span className="text-xs text-slate-400">{r.email}</span></td>
              <td className="px-5 py-3 text-slate-600">{r.formLabel}<br /><span className="text-xs text-slate-400">{r.siteName}</span></td>
              {showAssignee && <td className="px-5 py-3 text-slate-600">{r.assignee ?? <span className="text-slate-400">—</span>}</td>}
              <td className="px-5 py-3 text-slate-500">{r.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
              <td className="px-5 py-3"><EnquiryStatusSelect id={r.id} status={r.status} /></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No enquiries match.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
