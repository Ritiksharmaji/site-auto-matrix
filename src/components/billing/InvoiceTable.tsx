import Link from "next/link";
import type { Invoice } from "@prisma/client";
import { cancelInvoice, markInvoicePaid, remindInvoice } from "@/app/actions/billing";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { formatINR, isOverdue } from "@/lib/billing";

type Row = Invoice & { client?: { id: string; name: string } };

export function InvoiceStatus({ inv }: { inv: Pick<Invoice, "status" | "dueDate"> }) {
  if (inv.status === "PAID") return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Paid</span>;
  if (inv.status === "CANCELLED") return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Cancelled</span>;
  if (isOverdue(inv)) return <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Overdue</span>;
  return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Unpaid</span>;
}

const d = (x: Date) => x.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Invoice list. `manage` shows the super admin's actions; clients get a read-only view. */
export default function InvoiceTable({ rows, manage, showClient }: { rows: Row[]; manage: boolean; showClient: boolean }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-5 py-3">Invoice</th>
            {showClient && <th className="px-5 py-3">Client</th>}
            <th className="px-5 py-3">Amount</th>
            <th className="px-5 py-3">Due</th>
            <th className="px-5 py-3">Status</th>
            {manage && <th className="px-5 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((inv) => (
            <tr key={inv.id} className="align-top">
              <td className="px-5 py-3">
                <p className="font-medium text-slate-900">{inv.number}</p>
                <p className="text-xs text-slate-500">{inv.description}</p>
                {inv.periodStart && inv.periodEnd && <p className="text-xs text-slate-400">{d(inv.periodStart)} – {d(inv.periodEnd)}</p>}
              </td>
              {showClient && (
                <td className="px-5 py-3">
                  {inv.client && <Link href={`/admin/clients/${inv.client.id}`} className="text-slate-700 hover:text-indigo-600">{inv.client.name}</Link>}
                </td>
              )}
              <td className="px-5 py-3 font-medium text-slate-900">{formatINR(inv.amount)}</td>
              <td className="px-5 py-3 text-slate-600">
                {d(inv.dueDate)}
                {inv.paidAt && <p className="text-xs text-emerald-700">Paid {d(inv.paidAt)}{inv.paymentNote && ` · ${inv.paymentNote}`}</p>}
                {inv.status === "UNPAID" && inv.lastReminderAt && <p className="text-xs text-slate-400">Reminded {d(inv.lastReminderAt)}</p>}
              </td>
              <td className="px-5 py-3"><InvoiceStatus inv={inv} /></td>
              {manage && (
                <td className="px-5 py-3">
                  {inv.status === "UNPAID" && (
                    <div className="flex flex-wrap justify-end gap-2">
                      <form action={markInvoicePaid} className="flex gap-1">
                        <input type="hidden" name="id" value={inv.id} />
                        <input name="paymentNote" placeholder="UPI ref / note" className="input !w-32 !py-1 text-xs" />
                        <button className="btn-primary !px-2.5 !py-1 text-xs">Mark paid</button>
                      </form>
                      <form action={remindInvoice}>
                        <input type="hidden" name="id" value={inv.id} />
                        <button className="btn-secondary !px-2.5 !py-1 text-xs">Remind</button>
                      </form>
                      <form action={cancelInvoice}>
                        <input type="hidden" name="id" value={inv.id} />
                        <ConfirmButton message={`Cancel invoice ${inv.number}?`} className="btn-secondary !px-2.5 !py-1 text-xs">Cancel</ConfirmButton>
                      </form>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No invoices.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
