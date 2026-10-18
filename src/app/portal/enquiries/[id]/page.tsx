import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/Shell";
import EnquiryDetail from "@/components/crm/EnquiryDetail";
import { requireClient } from "@/lib/auth";
import { getEnquiryDetail } from "@/lib/crm";

export default async function PortalEnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  const detail = await getEnquiryDetail(user, (await params).id);
  if (!detail) notFound();
  return (
    <div>
      <PageHeader title="Enquiry" actions={<Link href="/portal/enquiries" className="btn-secondary">← All enquiries</Link>} />
      <EnquiryDetail {...detail} assignees={null} />
    </div>
  );
}
