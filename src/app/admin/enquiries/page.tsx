import { PageHeader } from "@/components/admin/Shell";
import EnquiriesView from "@/components/crm/EnquiriesView";
import { requireStaff } from "@/lib/auth";
import type { EnquiryFilters } from "@/lib/crm";

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<EnquiryFilters> }) {
  const user = await requireStaff();
  return (
    <div>
      <PageHeader title="Enquiries" description="Leads and admission enquiries from all your websites. Track each one from New to Converted." />
      <EnquiriesView user={user} filters={await searchParams} basePath="/admin/enquiries" />
    </div>
  );
}
