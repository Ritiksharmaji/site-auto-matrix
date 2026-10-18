import { PageHeader } from "@/components/admin/Shell";
import InvoiceTable from "@/components/billing/InvoiceTable";
import { requireClient } from "@/lib/auth";
import { CYCLE_LABEL, formatINR } from "@/lib/billing";
import { db } from "@/lib/db";

export default async function PortalBillingPage() {
  const user = await requireClient();
  const client = await db.client.findUnique({
    where: { id: user.clientId ?? "" },
    include: { invoices: { where: { status: { not: "CANCELLED" } }, orderBy: { dueDate: "desc" } } },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Your plan and invoices." />
      {client?.planAmount ? (
        <div className="card text-sm text-slate-700">
          <b>{client.planName || "Website plan"}</b> · {formatINR(client.planAmount)} {CYCLE_LABEL[client.billingCycle].toLowerCase()}
          {client.nextDueDate && <> · next invoice {client.nextDueDate.toLocaleDateString("en-IN", { dateStyle: "medium" })}</>}
        </div>
      ) : null}
      <InvoiceTable rows={client?.invoices ?? []} manage={false} showClient={false} />
    </div>
  );
}
