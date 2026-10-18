import Shell from "@/components/admin/Shell";
import { requireClient } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  return (
    <Shell user={user} nav={[{ href: "/portal", label: "My websites" }]} navTitle="Client portal">
      {children}
    </Shell>
  );
}
