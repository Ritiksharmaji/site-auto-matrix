"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

export default function Sidebar({ items, title }: { items: Item[]; title: string }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 md:block">{title}</p>
      {items.map((it) => {
        const active = it.href === pathname || (it.href !== "/admin" && it.href !== "/portal" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
              active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
