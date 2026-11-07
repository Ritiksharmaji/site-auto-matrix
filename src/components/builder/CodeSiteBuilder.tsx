"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { inviteDeveloper, redeploy, rollback } from "@/app/actions/code";
import RecentEnquiries, { type RecentEnquiry } from "@/components/crm/RecentEnquiries";
import type { AutomationSettings } from "@/lib/automation";
import { AutomationTab, SettingsTab } from "./SiteBuilder";

export type DeployRow = {
  id: string;
  status: "BUILDING" | "LIVE" | "FAILED" | "REPLACED";
  commitSha: string;
  commitMessage: string;
  author: string;
  runUrl: string;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
  onDisk: boolean;
};

type Props = {
  site: { id: string; name: string; slug: string; customDomain: string | null; status: "DRAFT" | "PUBLISHED"; url: string };
  code: {
    framework: string;
    frameworkLabel: string;
    repo: string;
    repoUrl: string;
    cloneUrl: string;
    vscodeUrl: string;
    branch: string;
    githubReady: boolean;
    devCommand: string;
  };
  previewUrl: string;
  deploys: DeployRow[];
  enquiries: RecentEnquiry[];
  automation: AutomationSettings;
  canPublish: boolean;
  analytics: React.ReactNode;
};

const TABS = [
  { key: "code", label: "Code" },
  { key: "automation", label: "Automation" },
  { key: "settings", label: "Settings" },
  { key: "enquiries", label: "Enquiries" },
  { key: "analytics", label: "Analytics" },
] as const;
type Tab = (typeof TABS)[number]["key"];

/** Builder for code websites: the site is edited in VS Code; this screen deploys, rolls back and manages it. */
export default function CodeSiteBuilder(props: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("code");
  const [previewKey, setPreviewKey] = useState(0);
  const building = props.deploys.some((d) => d.status === "BUILDING" && Date.now() - new Date(d.createdAt).getTime() < 30 * 60_000);
  const live = props.deploys.find((d) => d.status === "LIVE");
  const unread = props.enquiries.filter((e) => e.status === "NEW").length;

  // While a build runs, refresh every few seconds so the new version shows up by itself.
  useEffect(() => {
    if (!building) return;
    const t = setInterval(() => router.refresh(), 6000);
    return () => clearInterval(t);
  }, [building, router]);
  useEffect(() => setPreviewKey((k) => k + 1), [live?.id]);

  return (
    <div className="grid gap-6 xl:grid-cols-[480px_1fr]">
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
        {tab === "code" && <CodeTab {...props} building={building} />}
        {tab === "settings" && <SettingsTab site={props.site} canPublish={props.canPublish} onSaved={() => router.refresh()} />}
        {tab === "automation" && <AutomationTab site={props.site} automation={props.automation} />}
        {tab === "enquiries" && <RecentEnquiries enquiries={props.enquiries} basePath="/admin/enquiries" siteId={props.site.id} />}
        {tab === "analytics" && props.analytics}
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">{props.site.status === "PUBLISHED" ? "Live website" : "Draft preview (only with this link)"}</span>
          <a href={props.previewUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">Open site ↗</a>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 xl:sticky xl:top-20">
          {live ? (
            <iframe key={previewKey} src={props.previewUrl} title="Website preview" className="h-[75vh] w-full bg-white" />
          ) : (
            <div className="flex h-[50vh] items-center justify-center p-8 text-center text-sm text-slate-500">
              {building ? "The first build is running on GitHub. The preview appears here when it's live (usually 1–2 minutes)." : "Nothing is live yet. Push to the repository to start the first build."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CodeTab({ site, code, deploys, building }: Props & { building: boolean }) {
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [busy, setBusy] = useState("");
  const [gh, setGh] = useState("");
  const router = useRouter();

  async function run(key: string, fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) {
    setBusy(key);
    setMsg({});
    const res = await fn();
    setBusy("");
    setMsg(res.ok ? { ok: okText } : { error: res.error });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Code website · {code.frameworkLabel}</h3>
            <p className="text-sm text-slate-500">
              Repository <a href={code.repoUrl} target="_blank" rel="noreferrer" className="font-mono text-indigo-600 hover:underline">{code.repo}</a> · branch <span className="font-mono">{code.branch}</span>
            </p>
          </div>
          {building && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Building…</span>}
        </div>

        <div className="flex flex-wrap gap-2">
          <a href={code.vscodeUrl} className="btn-primary">Open in VS Code</a>
          <a href={code.repoUrl} target="_blank" rel="noreferrer" className="btn-secondary">Open on GitHub ↗</a>
        </div>
        <p className="text-xs text-slate-500">
          Your browser will ask to open Visual Studio Code. VS Code then asks where to save the project and may ask you to sign in to GitHub. Needs VS Code, Git and Node.js on this computer.
        </p>

        <details className="rounded-md bg-slate-50 p-3 text-sm">
          <summary className="cursor-pointer font-medium text-slate-700">How to work on it</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-600">
            <li>Click <b>Open in VS Code</b> (or run <code className="rounded bg-white px-1">git clone {code.cloneUrl}</code>).</li>
            <li>In VS Code&apos;s terminal: <code className="rounded bg-white px-1">{code.devCommand}</code></li>
            <li>Make your changes, then <b>Commit</b> and <b>Push</b> (Source Control panel) or <code className="rounded bg-white px-1">git push</code>.</li>
            <li>GitHub builds it and it goes live here in about 1–2 minutes. Forms on the site arrive in <b>Enquiries</b>.</li>
          </ol>
        </details>
        {!code.githubReady && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">GitHub isn&apos;t connected on this server, so builds won&apos;t arrive. See docs/DEPLOYMENT.md → Code websites.</p>}
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">Deploys</h3>
          <button disabled={!!busy || !code.githubReady} onClick={() => run("redeploy", () => redeploy(site.id), "New build started. It appears below in a few seconds.")} className="btn-secondary !py-1.5 text-sm">
            {busy === "redeploy" ? "Starting…" : "Build again"}
          </button>
        </div>
        {deploys.length === 0 ? (
          <p className="text-sm text-slate-500">No builds yet. The first one starts automatically when the repository is created.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {deploys.map((d) => (
              <li key={d.id} className="flex items-start gap-3 py-3">
                <StatusPill status={d.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900" title={d.commitMessage}>{d.commitMessage || "(no message)"}</p>
                  <p className="text-xs text-slate-500">
                    <span className="font-mono">{d.commitSha.slice(0, 7)}</span> · {d.author || "unknown"} · {new Date(d.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                    <a href={d.runUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">build log</a>
                  </p>
                  {d.error && <p className="mt-1 text-xs text-red-600">{d.error}</p>}
                </div>
                {d.status === "REPLACED" && d.onDisk && (
                  <button disabled={!!busy} onClick={() => run(d.id, () => rollback(site.id, d.id), "Rolled back. This version is live again.")} className="shrink-0 text-sm font-medium text-indigo-600 hover:underline">
                    {busy === d.id ? "…" : "Roll back"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {msg.ok && <p className="mt-2 text-sm text-emerald-600">{msg.ok}</p>}
        {msg.error && <p className="mt-2 text-sm text-red-600">{msg.error}</p>}
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold text-slate-900">Developer access</h3>
        <p className="text-sm text-slate-500">Invite a developer by GitHub username. They get push access to this website&apos;s repository only.</p>
        <div className="flex gap-2">
          <input value={gh} onChange={(e) => setGh(e.target.value)} placeholder="GitHub username" className="input" />
          <button disabled={!!busy || !gh.trim() || !code.githubReady} onClick={() => run("invite", () => inviteDeveloper(site.id, gh), `Invitation sent to ${gh.trim()} on GitHub.`)} className="btn-secondary shrink-0">
            {busy === "invite" ? "Inviting…" : "Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: DeployRow["status"] }) {
  const map = {
    LIVE: "bg-emerald-100 text-emerald-800",
    BUILDING: "bg-amber-100 text-amber-800",
    FAILED: "bg-red-100 text-red-700",
    REPLACED: "bg-slate-100 text-slate-600",
  } as const;
  const label = { LIVE: "Live", BUILDING: "Building", FAILED: "Failed", REPLACED: "Previous" }[status];
  return <span className={`mt-0.5 w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${map[status]}`}>{label}</span>;
}
