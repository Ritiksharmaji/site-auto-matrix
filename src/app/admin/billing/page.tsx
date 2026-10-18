import type { Prisma } from "@prisma/client";
import { runBillingNow } from "@/app/actions/billing";
import { PageHeader } from "@/components/admin/Shell";
import InvoiceTable from "@/components/billing/InvoiceTable";
import { requireSuperAdmin } from "@/lib/auth";
import { CYCLE_LABEL, formatINR, startOfToday } from "@/lib/billing";
import { db } from "@/lib/db";

const MONTHLY_FACTOR = { MONTHLY: 1, QUARTERLY: 1 / 3, YEARLY: 1 / 12 } as const;
const FILTERS = { unpaid: "Unpaid", overdue: "Overdue", paid: "Paid", all: "All" } as const;

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireSuperAdmin();
  const show = ((await searchParams).show ?? "unpaid") as keyof typeof FILTERS;
  const today = startOfToday();
  const in7 = new Date(today.getTime() + 7 * 86_400_000);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const where: Prisma.InvoiceWhereInput =
    show === "paid" ? { status: "PAID" } : show === "overdue" ? { status: "UNPAID", dueDate: { lt: today } } : show === "all" ? {} : { status: "UNPAID" };

  const [invoices, planClients, unpaid, overdue, dueSoon, paidThisMonth] = await Promise.all([
    db.invoice.findMany({ where, orderBy: { dueDate: show === "paid" ? "desc" : "asc" }, take: 200, include: { client: { select: { id: true, name: true } } } }),
    db.client.findMany({ where: { planAmount: { gt: 0 } }, select: { planAmount: true, billingCycle: true } }),
    db.invoice.aggregate({ where: { status: "UNPAID" }, _sum: { amount: true }, _count: true }),
    db.invoice.aggregate({ where: { status: "UNPAID", dueDate: { lt: today } }, _sum: { amount: true }, _count: true }),
    db.invoice.aggregate({ where: { status: "UNPAID", dueDate: { gte: today, lte: in7 } }, _sum: { amount: true }, _count: true }),
    db.invoice.aggregate({ where: { status: "PAID", paidAt: { gte: monthStart } }, _sum: { amount: true } }),
  ]);
  const mrr = planClients.reduce((sum, c) => sum + (c.planAmount ?? 0) * MONTHLY_FACTOR[c.billingCycle], 0);

  const cards = [
    { label: "Recurring revenue / month", value: formatINR(Math.round(mrr)), hint: `${planClients.length} clients on a plan` },
    { label: "Collected this month", value: formatINR(paidThisMonth._sum.amount ?? 0) },
    { label: "Outstanding", value: formatINR(unpaid._sum.amount ?? 0), hint: `${unpaid._count} unpaid invoices` },
    { label: "Overdue", value: formatINR(overdue._sum.amount ?? 0), hint: `${overdue._count} invoices`, danger: overdue._count > 0 },
    { label: "Due in 7 days", value: formatINR(dueSoon._sum.amount ?? 0), hint: `${dueSoon._count} invoices` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description={`Set each client's plan on their client page. Plans: ${Object.values(CYCLE_LABEL).join(", ")}.`}
        actions={
          <form action={runBillingNow}>
            <button className="btn-primary" title="Create invoices due in the next 7 days and send payment reminders">Generate invoices & send reminders</button>
          </form>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className={`card ${c.danger ? "border-red-200" : ""}`}>
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${c.danger ? "text-red-700" : "text-slate-900"}`}>{c.value}</p>
            {c.hint && <p className="text-xs text-slate-400">{c.hint}</p>}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {Object.entries(FILTERS).map(([k, label]) => (
          <a key={k} href={`?show=${k}`} className={`rounded-full px-3 py-1 text-sm ${show === k ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{label}</a>
        ))}
      </div>
      <InvoiceTable rows={invoices} manage showClient />
      <p className="text-xs text-slate-500">
        Automatic daily run: call <code className="rounded bg-slate-100 px-1">/api/cron/billing</code> with the <code className="rounded bg-slate-100 px-1">CRON_SECRET</code> bearer token from a scheduler.
      </p>
    </div>
  );
}
