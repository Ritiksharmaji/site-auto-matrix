"use client";

import type { EnquiryStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setEnquiryStatus } from "@/app/actions/crm";

export const STATUS_META: Record<EnquiryStatus, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  CONTACTED: { label: "Contacted", className: "bg-sky-50 text-sky-700 ring-sky-200" },
  CONVERTED: { label: "Converted", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  LOST: { label: "Lost", className: "bg-slate-100 text-slate-500 ring-slate-200" },
};

export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  const m = STATUS_META[status];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${m.className}`}>{m.label}</span>;
}

/** Inline status dropdown that saves immediately. */
export function EnquiryStatusSelect({ id, status }: { id: string; status: EnquiryStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) =>
        start(async () => {
          const res = await setEnquiryStatus(id, e.target.value as EnquiryStatus);
          if (!res.ok) alert(res.error);
          router.refresh();
        })
      }
      className={`rounded-full border-0 py-0.5 pl-2 pr-7 text-xs font-medium ring-1 ${STATUS_META[status].className}`}
    >
      {(Object.keys(STATUS_META) as EnquiryStatus[]).map((s) => (
        <option key={s} value={s}>{STATUS_META[s].label}</option>
      ))}
    </select>
  );
}
