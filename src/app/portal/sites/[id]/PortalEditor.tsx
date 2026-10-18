"use client";

import { useState } from "react";
import ContentEditor from "@/components/builder/ContentEditor";
import RecentEnquiries, { type RecentEnquiry } from "@/components/crm/RecentEnquiries";

type Props = React.ComponentProps<typeof ContentEditor> & { slug: string; enquiries: RecentEnquiry[] };

/** Client portal: content editing + enquiries only (no sections, design or settings). */
export default function PortalEditor({ slug, enquiries, ...editor }: Props) {
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
          <RecentEnquiries enquiries={enquiries} basePath="/portal/enquiries" siteId={editor.siteId} />
        )}
      </div>
      <div className="min-w-0">
        <p className="mb-2 text-sm font-medium text-slate-600">Preview</p>
        <iframe key={previewKey} src={`/sites/${slug}?preview=1`} title="Website preview" className="h-[75vh] w-full rounded-xl border border-slate-200 bg-white xl:sticky xl:top-20" />
      </div>
    </div>
  );
}
