"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { markEnquiryRead } from "@/app/actions/site";
import ContentEditor from "@/components/builder/ContentEditor";

type Props = React.ComponentProps<typeof ContentEditor> & {
  slug: string;
  enquiries: { id: string; name: string; email: string | null; phone: string | null; message: string | null; isRead: boolean; createdAt: string }[];
};

/** Client portal: content editing + enquiries only (no sections, design or settings). */
export default function PortalEditor({ slug, enquiries, ...editor }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"content" | "enquiries">("content");
  const [previewKey, setPreviewKey] = useState(0);

  return (
    <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
      <div className="min-w-0">
        <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
          {(["content", "enquiries"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize ${tab === t ? "bg-white shadow-sm" : "text-slate-600"}`}>
              {t}
            </button>
          ))}
        </div>
        {tab === "content" ? (
          <ContentEditor {...editor} onSaved={() => setPreviewKey((k) => k + 1)} />
        ) : (
          <ul className="space-y-3">
            {enquiries.map((e) => (
              <li key={e.id} className={`card !p-4 ${e.isRead ? "opacity-70" : "border-amber-200"}`}>
                <div className="flex justify-between gap-3">
                  <p className="font-medium text-slate-900">{e.name}</p>
                  <button className="text-xs text-indigo-600" onClick={async () => { await markEnquiryRead(e.id, !e.isRead); router.refresh(); }}>
                    Mark {e.isRead ? "unread" : "read"}
                  </button>
                </div>
                <p className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleString("en-IN")}</p>
                <p className="mt-2 text-sm text-slate-700">{[e.phone, e.email].filter(Boolean).join(" · ")}</p>
                {e.message && <p className="mt-1 text-sm text-slate-600">{e.message}</p>}
              </li>
            ))}
            {enquiries.length === 0 && <p className="card text-sm text-slate-500">No enquiries yet.</p>}
          </ul>
        )}
      </div>
      <div className="min-w-0">
        <p className="mb-2 text-sm font-medium text-slate-600">Preview</p>
        <iframe key={previewKey} src={`/sites/${slug}`} title="Website preview" className="h-[75vh] w-full rounded-xl border border-slate-200 bg-white xl:sticky xl:top-20" />
      </div>
    </div>
  );
}
