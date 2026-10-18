import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/Shell";
import EnquiryDetail from "@/components/crm/EnquiryDetail";
import { requireStaff } from "@/lib/auth";
import { getEnquiryDetail } from "@/lib/crm";
import { db } from "@/lib/db";

export default async function AdminEnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const detail = await getEnquiryDetail(user, (await params).id);
  if (!detail) notFound();
  // The super admin can assign anyone on the team; team members can only take it themselves.
  const assignees =
    user.role === "SUPER_ADMIN"
      ? await db.user.findMany({ where: { role: { in: ["SUPER_ADMIN", "STAFF"] }, isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })
      : [{ id: user.id, name: `${user.name} (me)` }];
  return (
    <div>
      <PageHeader title="Enquiry" actions={<Link href="/admin/enquiries" className="btn-secondary">← All enquiries</Link>} />
      <EnquiryDetail {...detail} assignees={assignees} />
    </div>
  );
}
