import { PageHeader } from "@/components/admin/Shell";
import EnquiriesView from "@/components/crm/EnquiriesView";
import { requireClient } from "@/lib/auth";
import type { EnquiryFilters } from "@/lib/crm";

export default async function PortalEnquiriesPage({ searchParams }: { searchParams: Promise<EnquiryFilters> }) {
  const user = await requireClient();
  return (
    <div>
      <PageHeader title="Enquiries" description="People who filled the forms on your website." />
      <EnquiriesView user={user} filters={await searchParams} basePath="/portal/enquiries" />
    </div>
  );
}
