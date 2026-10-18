"use client";

import { useState } from "react";
import { saveContent } from "@/app/actions/site";
import type { Brand, FieldDef, ModuleDef, SectionContent, SectionItem } from "@/modules/types";

// Form-based content editor generated from the module's field definitions.
// Shared by the admin builder and the client portal.

const BRAND_FIELDS: FieldDef[] = [
  { key: "siteName", label: "Website name", type: "text" },
  { key: "tagline", label: "Tagline", type: "text" },
  { key: "logo", label: "Logo image URL", type: "image" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "address", label: "Address", type: "textarea" },
  { key: "footerText", label: "Footer text", type: "text" },
];

type Props = {
  siteId: string;
  module: ModuleDef;
  enabledSections: string[];
  brand: Brand;
  sections: Record<string, SectionContent>;
  onSaved?: () => void;
};

export default function ContentEditor({ siteId, module, enabledSections, brand: initialBrand, sections: initialSections, onSaved }: Props) {
  const [brand, setBrand] = useState<Brand>(initialBrand);
  const [sections, setSections] = useState(initialSections);
  const [open, setOpen] = useState<string | null>("brand");
  const [status, setStatus] = useState<{ saving?: boolean; error?: string; saved?: boolean; dirty?: boolean }>({});

  const defs = module.sections.filter((s) => enabledSections.includes(s.key));

  function updateSection(key: string, next: SectionContent) {
    setSections((prev) => ({ ...prev, [key]: next }));
    setStatus({ dirty: true });
  }

  async function save() {
    setStatus({ saving: true });
    const res = await saveContent(siteId, { brand, ...sections });
    setStatus(res.ok ? { saved: true } : { error: res.error });
    if (res.ok) onSaved?.();
  }

  return (
    <div className="space-y-3">
      <Panel title="Brand & contact details" isOpen={open === "brand"} onToggle={() => setOpen(open === "brand" ? null : "brand")}>
        <Fields
          siteId={siteId}
          fields={BRAND_FIELDS}
          values={brand}
          onChange={(k, v) => {
            setBrand({ ...brand, [k]: v });
            setStatus({ dirty: true });
          }}
        />
      </Panel>

      {defs.map((def) => {
        const c = sections[def.key] ?? def.defaults;
        const items = (c.items as SectionItem[] | undefined) ?? [];
        return (
          <Panel key={def.key} title={def.label} isOpen={open === def.key} onToggle={() => setOpen(open === def.key ? null : def.key)}>
            <Fields siteId={siteId} fields={def.fields} values={c as Record<string, string>} onChange={(k, v) => updateSection(def.key, { ...c, [k]: v })} />
            {def.itemFields && (
              <div className="mt-4 space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-slate-500">{def.itemLabel ?? "Item"} {i + 1}</span>
                      <div className="flex gap-1 text-xs">
                        <IconBtn disabled={i === 0} onClick={() => updateSection(def.key, { ...c, items: move(items, i, i - 1) })}>↑</IconBtn>
                        <IconBtn disabled={i === items.length - 1} onClick={() => updateSection(def.key, { ...c, items: move(items, i, i + 1) })}>↓</IconBtn>
                        <IconBtn onClick={() => updateSection(def.key, { ...c, items: items.filter((_, j) => j !== i) })}>Remove</IconBtn>
                      </div>
                    </div>
                    <Fields
                      siteId={siteId}
                      fields={def.itemFields!}
                      values={item}
                      onChange={(k, v) => updateSection(def.key, { ...c, items: items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) })}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary w-full !py-1.5"
                  onClick={() =>
                    updateSection(def.key, {
                      ...c,
                      items: [...items, Object.fromEntries(def.itemFields!.map((f) => [f.key, ""]))],
                    })
                  }
                >
                  + Add {(def.itemLabel ?? "item").toLowerCase()}
                </button>
              </div>
            )}
          </Panel>
        );
      })}

      <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-1 py-3">
        <span className="text-sm">
          {status.error && <span className="text-red-600">{status.error}</span>}
          {status.saved && <span className="text-emerald-600">Saved</span>}
          {status.dirty && <span className="text-amber-600">Unsaved changes</span>}
        </span>
        <button type="button" onClick={save} disabled={status.saving} className="btn-primary">
          {status.saving ? "Saving…" : "Save content"}
        </button>
      </div>
    </div>
  );
}

function move<T>(arr: T[], from: number, to: number) {
  const next = [...arr];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

function Panel({ title, isOpen, onToggle, children }: { title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-900">
        {title}
        <span className="text-slate-400">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <div className="border-t border-slate-100 px-4 py-4">{children}</div>}
    </div>
  );
}

function IconBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className="rounded px-2 py-0.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30">
      {children}
    </button>
  );
}

function Fields({ siteId, fields, values, onChange }: { siteId: string; fields: FieldDef[]; values: Record<string, unknown>; onChange: (k: string, v: string) => void }) {
  return (
    <div className="space-y-3">
      {fields.map((f) => {
        const v = typeof values[f.key] === "string" ? (values[f.key] as string) : "";
        return (
          <div key={f.key}>
            <label className="label !text-xs">{f.label}</label>
            {f.type === "textarea" ? (
              <textarea rows={3} value={v} onChange={(e) => onChange(f.key, e.target.value)} className="input" placeholder={f.placeholder} />
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type={f.type === "date" ? "date" : "text"}
                  value={v}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className="input"
                  placeholder={f.placeholder ?? (f.type === "image" ? "https://…" : undefined)}
                />
                {f.type === "image" && v && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
                )}
                {f.type === "image" && <UploadButton siteId={siteId} onUploaded={(url) => onChange(f.key, url)} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UploadButton({ siteId, onUploaded }: { siteId: string; onUploaded: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className={`btn-secondary shrink-0 cursor-pointer !px-3 !py-2 ${busy ? "opacity-50" : ""}`} title="Upload image (PNG, JPG, WEBP, GIF · max 5 MB)">
      {busy ? "…" : "Upload"}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          const body = new FormData();
          body.append("file", file);
          body.append("siteId", siteId);
          try {
            const res = await fetch("/api/uploads", { method: "POST", body });
            const data = await res.json();
            if (!res.ok) alert(data.error ?? "Upload failed");
            else onUploaded(data.url);
          } catch {
            alert("Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      />
    </label>
  );
}
