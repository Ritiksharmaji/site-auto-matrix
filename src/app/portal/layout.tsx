import Shell from "@/components/admin/Shell";
import { requireClient } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  return (
    <Shell user={user} nav={[
        { href: "/portal", label: "My websites" },
        { href: "/portal/enquiries", label: "Enquiries" },
        { href: "/portal/billing", label: "Billing" },
      ]} navTitle="Client portal">
      {children}
    </Shell>
  );
}
