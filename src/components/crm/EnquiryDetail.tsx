"use client";

import type { EnquiryStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addEnquiryNote, assignEnquiry } from "@/app/actions/crm";
import { EnquiryStatusSelect } from "./EnquiryStatus";

type Props = {
  enquiry: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    message: string | null;
    formLabel: string;
    siteName: string;
    status: EnquiryStatus;
    createdAt: string;
    assignedToId: string | null;
  };
  notes: { id: string; body: string; author: string; createdAt: string }[];
  notifications: { id: string; channel: string; recipient: string; subject: string | null; status: string; error: string | null; createdAt: string }[];
  /** Team members this user may assign to; null hides assignment (client portal). */
  assignees: { id: string; name: string }[] | null;
};

const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function EnquiryDetail({ enquiry: e, notes, notifications, assignees }: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const waNumber = e.phone?.replace(/\D/g, "");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{e.name}</h2>
              <p className="text-sm text-slate-500">{e.formLabel} · {e.siteName} · {fmt(e.createdAt)}</p>
            </div>
            <EnquiryStatusSelect id={e.id} status={e.status} />
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Phone</dt><dd className="font-medium text-slate-900">{e.phone || "—"}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="font-medium text-slate-900">{e.email || "—"}</dd></div>
          </dl>
          {e.message && <p className="mt-4 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{e.message}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {e.phone && <a href={`tel:${e.phone}`} className="btn-secondary !py-1.5">Call</a>}
            {waNumber && <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="btn-secondary !py-1.5">WhatsApp</a>}
            {e.email && <a href={`mailto:${e.email}`} className="btn-secondary !py-1.5">Email</a>}
          </div>
        </section>

        <section className="card">
          <h3 className="mb-3 font-semibold text-slate-900">Notes & follow-ups</h3>
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              start(async () => {
                const res = await addEnquiryNote(e.id, note);
                if (!res.ok) return setError(res.error ?? "");
                setNote("");
                setError("");
                router.refresh();
              });
            }}
            className="space-y-2"
          >
            <textarea value={note} onChange={(ev) => setNote(ev.target.value)} rows={3} placeholder="e.g. Called parent, campus visit fixed for Saturday 10 am" className="input" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={pending || !note.trim()} className="btn-primary">Add note</button>
          </form>
          <ul className="mt-5 space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="border-l-2 border-indigo-200 pl-3">
                <p className="whitespace-pre-line text-sm text-slate-800">{n.body}</p>
                <p className="text-xs text-slate-400">{n.author} · {fmt(n.createdAt)}</p>
              </li>
            ))}
            {notes.length === 0 && <li className="text-sm text-slate-500">No notes yet.</li>}
          </ul>
        </section>
      </div>

      <div className="space-y-6">
        {assignees && (
          <section className="card">
            <h3 className="mb-3 font-semibold text-slate-900">Assigned to</h3>
            <select
              value={e.assignedToId ?? ""}
              disabled={pending}
              onChange={(ev) =>
                start(async () => {
                  const res = await assignEnquiry(e.id, ev.target.value || null);
                  if (!res.ok) alert(res.error);
                  router.refresh();
                })
              }
              className="input"
            >
              <option value="">Unassigned</option>
              {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </section>
        )}

        <section className="card">
          <h3 className="mb-3 font-semibold text-slate-900">Automated messages</h3>
          <ul className="space-y-3 text-sm">
            {notifications.map((n) => (
              <li key={n.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">{n.channel === "EMAIL" ? "Email" : "WhatsApp"} → {n.recipient}</span>
                  <span className={`text-xs ${n.status === "SENT" ? "text-emerald-600" : n.status === "FAILED" ? "text-red-600" : "text-slate-500"}`}>
                    {n.status === "LOGGED" ? "not configured" : n.status.toLowerCase()}
                  </span>
                </div>
                {n.subject && <p className="text-xs text-slate-500">{n.subject}</p>}
                {n.error && <p className="text-xs text-red-600">{n.error}</p>}
              </li>
            ))}
            {notifications.length === 0 && <li className="text-slate-500">None.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
