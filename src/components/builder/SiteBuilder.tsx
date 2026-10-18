"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { markEnquiryRead, saveSections, saveSettings, saveTheme, setPublished } from "@/app/actions/site";
import { FONTS, HERO_LAYOUTS, RADIUS_OPTIONS, STYLE_OPTIONS } from "@/modules/shared";
import type { Brand, ModuleDef, SectionContent, Theme } from "@/modules/types";
import ContentEditor from "./ContentEditor";

type Enquiry = { id: string; formType: string; name: string; email: string | null; phone: string | null; message: string | null; isRead: boolean; createdAt: string };

type Props = {
  site: { id: string; name: string; slug: string; customDomain: string | null; status: "DRAFT" | "PUBLISHED"; url: string };
  module: ModuleDef;
  enabledSections: string[];
  theme: Theme;
  brand: Brand;
  sections: Record<string, SectionContent>;
  enquiries: Enquiry[];
  canPublish: boolean;
};

const TABS = [
  { key: "sections", label: "Sections" },
  { key: "design", label: "Design" },
  { key: "content", label: "Content" },
  { key: "settings", label: "Settings" },
  { key: "enquiries", label: "Enquiries" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function SiteBuilder(props: Props) {
  const { site, module } = props;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("sections");
  const [previewKey, setPreviewKey] = useState(0);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const unread = props.enquiries.filter((e) => !e.isRead).length;

  function refreshPreview() {
    setPreviewKey((k) => k + 1);
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
      <div className="min-w-0">
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t.label}
              {t.key === "enquiries" && unread > 0 && <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-xs text-white">{unread}</span>}
            </button>
          ))}
        </div>

        {tab === "sections" && <SectionsTab {...props} onSaved={refreshPreview} />}
        {tab === "design" && <DesignTab {...props} onSaved={refreshPreview} />}
        {tab === "content" && (
          <ContentEditor
            siteId={site.id}
            module={module}
            enabledSections={props.enabledSections}
            brand={props.brand}
            sections={props.sections}
            onSaved={refreshPreview}
          />
        )}
        {tab === "settings" && <SettingsTab {...props} onSaved={refreshPreview} />}
        {tab === "enquiries" && <EnquiriesTab enquiries={props.enquiries} module={module} />}
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">Live preview</span>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md bg-slate-100 p-0.5 text-xs">
              {(["desktop", "mobile"] as const).map((d) => (
                <button key={d} onClick={() => setDevice(d)} className={`rounded px-2 py-1 capitalize ${device === d ? "bg-white shadow-sm" : "text-slate-500"}`}>{d}</button>
              ))}
            </div>
            <a href={site.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">Open site ↗</a>
          </div>
        </div>
        <div className="flex justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-200 xl:sticky xl:top-20">
          <iframe
            key={previewKey}
            src={`/sites/${site.slug}`}
            title="Website preview"
            className="h-[75vh] bg-white transition-all"
            style={{ width: device === "mobile" ? 390 : "100%" }}
          />
        </div>
      </div>
    </div>
  );
}

function SaveBar({ onSave, saving, msg }: { onSave: () => void; saving: boolean; msg: { ok?: boolean; error?: string } }) {
  return (
    <div className="mt-4 flex items-center justify-end gap-3">
      {msg.error && <span className="text-sm text-red-600">{msg.error}</span>}
      {msg.ok && <span className="text-sm text-emerald-600">Saved</span>}
      <button onClick={onSave} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save"}</button>
    </div>
  );
}

function useSaver() {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string }>({});
  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, onSaved: () => void) {
    setSaving(true);
    setMsg({});
    const res = await fn();
    setSaving(false);
    setMsg(res.ok ? { ok: true } : { error: res.error });
    if (res.ok) onSaved();
  }
  return { saving, msg, run };
}

function SectionsTab({ site, module, enabledSections, onSaved }: Props & { onSaved: () => void }) {
  const [enabled, setEnabled] = useState<string[]>(enabledSections);
  const { saving, msg, run } = useSaver();
  return (
    <div className="card">
      <p className="mb-4 text-sm text-slate-500">
        <b>{module.name}</b> module. Turn sections on or off for this website.
      </p>
      <ul className="space-y-2">
        {module.sections.map((s) => {
          const on = s.required || enabled.includes(s.key);
          return (
            <li key={s.key}>
              <label className={`flex items-start gap-3 rounded-lg border p-3 ${on ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200"} ${s.required ? "opacity-80" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={on}
                  disabled={s.required}
                  onChange={(e) => setEnabled(e.target.checked ? [...enabled, s.key] : enabled.filter((k) => k !== s.key))}
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{s.label}{s.required && <span className="ml-2 text-xs text-slate-400">required</span>}</span>
                  <span className="block text-xs text-slate-500">{s.description}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <SaveBar saving={saving} msg={msg} onSave={() => run(() => saveSections(site.id, enabled), onSaved)} />
    </div>
  );
}

function DesignTab({ site, module, theme: initial, onSaved }: Props & { onSaved: () => void }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const { saving, msg, run } = useSaver();
  const set = <K extends keyof Theme>(k: K, v: Theme[K]) => setTheme((t) => ({ ...t, [k]: v, preset: k === "preset" ? (v as string) : "custom" }));

  return (
    <div className="card space-y-5">
      <div>
        <span className="label">Presets</span>
        <div className="grid grid-cols-3 gap-2">
          {module.presets.map((p) => (
            <button
              key={p.key}
              onClick={() => setTheme({ preset: p.key, ...p.theme })}
              className={`rounded-lg border p-2 text-left ${theme.preset === p.key ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="mb-1 flex gap-1">
                <span className="h-4 w-4 rounded" style={{ background: p.theme.primary }} />
                <span className="h-4 w-4 rounded" style={{ background: p.theme.secondary }} />
              </div>
              <span className="text-xs font-medium text-slate-800">{p.label}</span>
            </button>
          ))}
        </div>
        {theme.preset === "custom" && <p className="mt-1 text-xs text-slate-500">Customised</p>}
      </div>

      <div>
        <span className="label">Colours</span>
        <div className="grid grid-cols-2 gap-3">
          {([
            ["primary", "Primary"],
            ["secondary", "Accent"],
            ["background", "Background"],
            ["surface", "Section background"],
            ["text", "Text"],
          ] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-xs text-slate-700">
              <input type="color" value={theme[k]} onChange={(e) => set(k, e.target.value)} className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0" />
              <span className="flex-1">{label}</span>
              <span className="font-mono text-slate-400">{theme[k]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Heading font</label>
          <select value={theme.headingFont} onChange={(e) => set("headingFont", e.target.value)} className="input">
            {FONTS.map((f) => <option key={f.name}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Body font</label>
          <select value={theme.bodyFont} onChange={(e) => set("bodyFont", e.target.value)} className="input">
            {FONTS.map((f) => <option key={f.name}>{f.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <span className="label">Layout style</span>
        <div className="grid grid-cols-3 gap-2">
          {STYLE_OPTIONS.map((s) => (
            <button key={s.value} onClick={() => set("style", s.value)} className={`rounded-lg border p-2 text-left ${theme.style === s.value ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200"}`}>
              <span className="block text-sm font-medium text-slate-900">{s.label}</span>
              <span className="block text-xs text-slate-500">{s.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Hero layout</label>
          <select value={theme.heroLayout} onChange={(e) => set("heroLayout", e.target.value as Theme["heroLayout"])} className="input">
            {HERO_LAYOUTS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Corners</label>
          <select value={theme.radius} onChange={(e) => set("radius", e.target.value as Theme["radius"])} className="input">
            {RADIUS_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      <SaveBar saving={saving} msg={msg} onSave={() => run(() => saveTheme(site.id, theme), onSaved)} />
    </div>
  );
}

function SettingsTab({ site, canPublish, onSaved }: Props & { onSaved: () => void }) {
  const [form, setForm] = useState({ name: site.name, slug: site.slug, customDomain: site.customDomain ?? "" });
  const { saving, msg, run } = useSaver();
  const pub = useSaver();
  const live = site.status === "PUBLISHED";

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900">{live ? "Website is live" : "Website is a draft"}</h3>
            <p className="text-sm text-slate-500">{live ? "Anyone can visit it." : "Only your team and the client can preview it."}</p>
          </div>
          <button
            disabled={!canPublish || pub.saving}
            onClick={() => pub.run(() => setPublished(site.id, !live), onSaved)}
            className={live ? "btn-secondary" : "btn-primary"}
          >
            {live ? "Unpublish" : "Publish"}
          </button>
        </div>
        {!canPublish && <p className="mt-2 text-xs text-amber-700">You don&apos;t have permission to publish. Ask the admin.</p>}
        {pub.msg.error && <p className="mt-2 text-sm text-red-600">{pub.msg.error}</p>}
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">Website name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label">Web address (subdomain)</label>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} className="input" />
        </div>
        <div>
          <label className="label">Custom domain (optional)</label>
          <input value={form.customDomain} onChange={(e) => setForm({ ...form, customDomain: e.target.value })} placeholder="www.myschool.com" className="input" />
          <p className="mt-1 text-xs text-slate-500">Point the domain&apos;s DNS (CNAME) to the platform server, then save it here.</p>
        </div>
        <SaveBar saving={saving} msg={msg} onSave={() => run(() => saveSettings(site.id, form), onSaved)} />
      </div>
    </div>
  );
}

function EnquiriesTab({ enquiries, module }: { enquiries: Enquiry[]; module: ModuleDef }) {
  const router = useRouter();
  if (enquiries.length === 0) return <p className="card text-sm text-slate-500">No enquiries yet. Form submissions from the website will appear here.</p>;
  return (
    <ul className="space-y-3">
      {enquiries.map((e) => (
        <li key={e.id} className={`card !p-4 ${e.isRead ? "opacity-70" : "border-amber-200"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{e.name}</p>
              <p className="text-xs text-slate-500">
                {module.sections.find((s) => s.key === e.formType)?.label ?? e.formType} · {new Date(e.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
            <button
              className="text-xs text-indigo-600 hover:underline"
              onClick={async () => {
                await markEnquiryRead(e.id, !e.isRead);
                router.refresh();
              }}
            >
              Mark {e.isRead ? "unread" : "read"}
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-700">{[e.phone, e.email].filter(Boolean).join(" · ")}</p>
          {e.message && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{e.message}</p>}
        </li>
      ))}
    </ul>
  );
}
