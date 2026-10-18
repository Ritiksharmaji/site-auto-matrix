import Shell from "@/components/admin/Shell";
import { requireStaff } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const nav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/clients", label: "Clients" },
    { href: "/admin/sites", label: "Websites" },
    { href: "/admin/enquiries", label: "Enquiries" },
    ...(user.role === "SUPER_ADMIN"
      ? [
          { href: "/admin/billing", label: "Billing" },
          { href: "/admin/team", label: "Team" },
          { href: "/admin/activity", label: "Activity log" },
        ]
      : []),
  ];
  return (
    <Shell user={user} nav={nav} navTitle="Platform">
      {children}
    </Shell>
  );
}
