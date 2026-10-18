import { logout } from "@/app/actions/auth";
import Sidebar from "./Sidebar";

const ROLE_LABEL = { SUPER_ADMIN: "Super Admin", STAFF: "Team Member", CLIENT: "Client" } as const;

export default function Shell({
  user,
  nav,
  navTitle,
  children,
}: {
  user: { name: string; email: string; role: keyof typeof ROLE_LABEL };
  nav: { href: string; label: string }[];
  navTitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</span>
            <span className="font-semibold text-slate-900">Site Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]} · {user.email}</p>
            </div>
            <form action={logout}>
              <button className="btn-secondary !px-3 !py-1.5">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <div className="md:flex">
        <aside className="border-b border-slate-200 bg-white px-3 py-3 md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:w-56 md:shrink-0 md:border-b-0 md:border-r md:py-6">
          <Sidebar items={nav} title={navTitle} />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  return status === "PUBLISHED" ? (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Live</span>
  ) : (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Draft</span>
  );
}
