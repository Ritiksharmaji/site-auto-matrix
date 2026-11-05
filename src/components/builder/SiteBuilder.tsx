"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveAutomation, saveSections, saveSettings, saveTheme, setPublished } from "@/app/actions/site";
import RecentEnquiries, { type RecentEnquiry } from "@/components/crm/RecentEnquiries";
import type { AutomationSettings } from "@/lib/automation";
import { saveSiteAsBlueprint } from "@/app/actions/blueprints";
import { BUTTON_OPTIONS, FONTS, FOOTER_OPTIONS, HEADER_OPTIONS, HERO_LAYOUTS, RADIUS_OPTIONS, SECTION_VARIANTS, SPACING_OPTIONS, STYLE_OPTIONS } from "@/modules/shared";
import type { Brand, ModuleDef, SectionContent, Theme } from "@/modules/types";
import ContentEditor from "./ContentEditor";


type Props = {
  site: { id: string; name: string; slug: string; customDomain: string | null; status: "DRAFT" | "PUBLISHED"; url: string };
  module: ModuleDef;
  enabledSections: string[];
  theme: Theme;
  brand: Brand;
  sections: Record<string, SectionContent>;
  enquiries: RecentEnquiry[];
  automation: AutomationSettings;
  canPublish: boolean;
  /** Server-rendered analytics panel. */
  analytics: React.ReactNode;
};

const TABS = [
  { key: "sections", label: "Sections" },
  { key: "design", label: "Design" },
  { key: "content", label: "Content" },
  { key: "automation", label: "Automation" },
  { key: "settings", label: "Settings" },
  { key: "enquiries", label: "Enquiries" },
  { key: "analytics", label: "Analytics" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function SiteBuilder(props: Props) {
  const { site, module } = props;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("sections");
  const [previewKey, setPreviewKey] = useState(0);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const unread = props.enquiries.filter((e) => e.status === "NEW").length;

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
        {tab === "automation" && <AutomationTab {...props} />}
        {tab === "analytics" && props.analytics}
        {tab === "enquiries" && <RecentEnquiries enquiries={props.enquiries} basePath="/admin/enquiries" siteId={site.id} />}
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
            src={`/sites/${site.slug}?preview=1`}
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
  // All sections, enabled ones first in the site's order, then the rest in module order.
  const [rows, setRows] = useState(() => {
    const byKey = new Map(module.sections.map((s) => [s.key, s]));
    const enabled = enabledSections.flatMap((k) => byKey.get(k) ?? []);
    return [...enabled, ...module.sections.filter((s) => !enabledSections.includes(s.key))];
  });
  const [enabled, setEnabled] = useState<string[]>(enabledSections);
  const { saving, msg, run } = useSaver();

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    setRows((r) => {
      const next = [...r];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <div className="card">
      <p className="mb-4 text-sm text-slate-500">
        <b>{module.name}</b> module. Turn sections on or off, and use ↑ ↓ to set the order they appear on the website.
      </p>
      <ul className="space-y-2">
        {rows.map((s, i) => {
          const on = s.required || enabled.includes(s.key);
          return (
            <li key={s.key} className={`flex items-start gap-2 rounded-lg border p-3 ${on ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200"}`}>
              <label className={`flex flex-1 items-start gap-3 ${s.required ? "opacity-80" : "cursor-pointer"}`}>
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
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${s.label} up`} className="rounded px-1.5 text-slate-500 hover:bg-white disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move ${s.label} down`} className="rounded px-1.5 text-slate-500 hover:bg-white disabled:opacity-30">↓</button>
              </div>
            </li>
          );
        })}
      </ul>
      <SaveBar
        saving={saving}
        msg={msg}
        onSave={() => run(() => saveSections(site.id, rows.filter((s) => s.required || enabled.includes(s.key)).map((s) => s.key)), onSaved)}
      />
    </div>
  );
}

function DesignTab({ site, module, theme: initial, enabledSections, onSaved }: Props & { onSaved: () => void }) {
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

      <PageStructure theme={theme} set={set} />

      <SectionLayouts module={module} enabledSections={enabledSections} theme={theme} setTheme={setTheme} />

      <SaveBar saving={saving} msg={msg} onSave={() => run(() => saveTheme(site.id, theme), onSaved)} />

      <SaveAsBlueprint siteId={site.id} siteName={site.name} />
    </div>
  );
}

type SetTheme = <K extends keyof Theme>(k: K, v: Theme[K]) => void;

/** Header, footer, spacing and buttons. Defaults keep the original look. */
function PageStructure({ theme, set }: { theme: Theme; set: SetTheme }) {
  return (
    <div className="space-y-3 border-t border-slate-100 pt-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Page structure</h3>
        <p className="text-xs text-slate-500">Header, footer, spacing and buttons for the whole site.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Header</label>
          <select value={theme.header ?? "auto"} onChange={(e) => set("header", e.target.value as Theme["header"])} className="input">
            {HEADER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Footer</label>
          <select value={theme.footer ?? "columns"} onChange={(e) => set("footer", e.target.value as Theme["footer"])} className="input">
            {FOOTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Spacing</label>
          <select value={theme.spacing ?? "normal"} onChange={(e) => set("spacing", e.target.value as Theme["spacing"])} className="input">
            {SPACING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Buttons</label>
          <select value={theme.buttonStyle ?? "auto"} onChange={(e) => set("buttonStyle", e.target.value as Theme["buttonStyle"])} className="input">
            {BUTTON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      {(theme.header ?? "auto") !== "none" && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4" checked={theme.headerSticky ?? true} disabled={theme.header === "transparent"} onChange={(e) => set("headerSticky", e.target.checked)} />
            Header stays on top while scrolling
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4" checked={!!theme.headerCta} onChange={(e) => set("headerCta", e.target.checked)} />
            Button in the header
          </label>
        </div>
      )}
    </div>
  );
}

/** Layout variant per enabled section (only kinds that have variants). */
function SectionLayouts({ module, enabledSections, theme, setTheme }: { module: Props["module"]; enabledSections: string[]; theme: Theme; setTheme: React.Dispatch<React.SetStateAction<Theme>> }) {
  const rows = enabledSections
    .map((k) => module.sections.find((s) => s.key === k))
    .filter((s): s is NonNullable<typeof s> => !!s && !!SECTION_VARIANTS[s.kind]);
  if (rows.length === 0) return null;
  return (
    <div className="space-y-3 border-t border-slate-100 pt-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Section layouts</h3>
        <p className="text-xs text-slate-500">How each section is arranged. Turn sections on or off and reorder them in the Sections tab.</p>
      </div>
      <div className="space-y-2">
        {rows.map((s) => {
          const opts = SECTION_VARIANTS[s.kind]!;
          const value = theme.variants?.[s.key] ?? opts[0].value;
          return (
            <div key={s.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-700">{s.label}</span>
              <select
                value={value}
                onChange={(e) => setTheme((t) => ({ ...t, preset: "custom", variants: { ...(t.variants ?? {}), [s.key]: e.target.value } }))}
                className="input !w-56"
              >
                {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Save this site's sections, design and content as a reusable team blueprint. */
function SaveAsBlueprint({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${siteName} design`);
  const [description, setDescription] = useState("");
  const { saving, msg, run } = useSaver();
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-4">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-sm font-medium text-indigo-600 hover:underline">
          ★ Save this website as a blueprint
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Saves the <b>saved</b> version of this site&apos;s sections, design, text and images so the team can start new websites from it. The client&apos;s phone, email and address are not copied.
          </p>
          <div>
            <label className="label">Blueprint name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Short description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" placeholder="e.g. Dark SaaS page with pricing" />
          </div>
          <div className="flex items-center justify-end gap-3">
            {msg.error && <span className="text-sm text-red-600">{msg.error}</span>}
            {msg.ok && <span className="text-sm text-emerald-600">Saved. Find it under Blueprints → Saved by the team.</span>}
            <button onClick={() => setOpen(false)} className="btn-secondary">Close</button>
            <button disabled={saving} onClick={() => run(() => saveSiteAsBlueprint(siteId, name, description), () => {})} className="btn-primary">
              {saving ? "Saving…" : "Save blueprint"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsTab({ site, canPublish, onSaved }: Pick<Props, "site" | "canPublish"> & { onSaved: () => void }) {
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

export function AutomationTab({ site, automation }: Pick<Props, "site" | "automation">) {
  const [a, setA] = useState<AutomationSettings>(automation);
  const { saving, msg, run } = useSaver();
  const toggle = (k: "notifyClient" | "notifyOwner" | "whatsappNotify" | "autoReply", label: string, hint: string) => (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={a[k]} onChange={(e) => setA({ ...a, [k]: e.target.checked })} className="mt-0.5 h-4 w-4" />
      <span>
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-900">When a new enquiry arrives</h3>
        {toggle("notifyClient", "Email the client", "Sent to every client login of this website.")}
        {toggle("notifyOwner", "Email the account manager", "The team member who manages this client.")}
        <div>
          <label className="label">Also email (comma separated)</label>
          <input value={a.extraEmails} onChange={(e) => setA({ ...a, extraEmails: e.target.value })} placeholder="office@school.com, principal@school.com" className="input" />
        </div>
        {toggle("whatsappNotify", "Send a WhatsApp alert", "Needs WhatsApp Cloud API keys on the server.")}
        {a.whatsappNotify && (
          <div>
            <label className="label">WhatsApp number (with country code)</label>
            <input value={a.whatsappNumber} onChange={(e) => setA({ ...a, whatsappNumber: e.target.value })} placeholder="919876543210" className="input" />
          </div>
        )}
      </div>

      <div className="card space-y-4">
        {toggle("autoReply", "Auto-reply to the visitor", "A thank-you email, sent if the visitor gave an email address.")}
        {a.autoReply && (
          <>
            <div>
              <label className="label">Subject</label>
              <input value={a.autoReplySubject} onChange={(e) => setA({ ...a, autoReplySubject: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea rows={6} value={a.autoReplyBody} onChange={(e) => setA({ ...a, autoReplyBody: e.target.value })} className="input" />
              <p className="mt-1 text-xs text-slate-500">Use {"{{name}}"} for the visitor&apos;s name and {"{{site}}"} for the website name.</p>
            </div>
          </>
        )}
        <SaveBar saving={saving} msg={msg} onSave={() => run(() => saveAutomation(site.id, a), () => {})} />
      </div>
    </div>
  );
}
