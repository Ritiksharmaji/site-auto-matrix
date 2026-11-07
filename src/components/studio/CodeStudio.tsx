"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { studioReadFiles, studioSave, studioStatus, studioTree, type StudioChange } from "@/app/actions/studio";
import { buildHtmlPreview, buildReactPreview, type PreviewFiles } from "./preview";

// VS Code's editor (Monaco) loads from the CDN on the client only.
const Editor = dynamic(() => import("./MonacoEditor"), { ssr: false, loading: () => <div className="p-6 text-sm text-slate-400">Loading editor…</div> });

type Entry = { path: string; sha: string; size: number };
type Doc = {
  /** Content at the last commit (text, or base64 for binary); null for new files. */
  base: string | null;
  current: string;
  baseSha: string | null;
  binary: boolean;
  deleted?: boolean;
};
type Deploy = { status: "BUILDING" | "LIVE" | "FAILED" | "REPLACED"; commitSha: string; commitMessage: string; runUrl: string; error: string | null; createdAt: string } | null;

export type StudioProps = {
  site: { id: string; name: string; slug: string; status: "DRAFT" | "PUBLISHED" };
  framework: "HTML" | "REACT" | "NEXTJS";
  frameworkLabel: string;
  repo: string;
  repoUrl: string;
  branch: string;
  /** The site's own origin (preview shell runs there). */
  siteOrigin: string;
  /** Live site URL with a draft preview token. */
  liveUrl: string;
  vscodeUrl: string;
};

const TEXT_EXT = /\.(jsx?|tsx?|mjs|cjs|json|md|mdx|html?|css|scss|sass|less|txt|svg|ya?ml|xml|toml|env|example|gitignore|npmrc|nvmrc|editorconfig|prettierrc|eslintrc|lock)$/i;
const DATA_EXT = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf)$/i;
const isText = (p: string) => TEXT_EXT.test(p) || /(^|\/)(LICENSE|README|Dockerfile|\.gitignore|\.nvmrc)$/i.test(p);

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", avif: "image/avif", ico: "image/x-icon", svg: "image/svg+xml", woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf" };

function b64ToText(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function textToB64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en-IN");
}

export default function CodeStudio(props: StudioProps) {
  const { site } = props;
  const draftKey = `studio-draft:${site.id}`;
  const [headSha, setHeadSha] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [docs, setDocs] = useState<Record<string, Doc>>({});
  const [tabs, setTabs] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [panel, setPanel] = useState<"files" | "changes" | "packages">("files");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string>("");
  const [notice, setNotice] = useState<{ kind: "ok" | "error" | "info"; text: string } | null>(null);
  const [conflict, setConflict] = useState<{ paths: string[]; headSha: string; files: Entry[] } | null>(null);
  const [deploy, setDeploy] = useState<Deploy>(null);
  const [watchUntil, setWatchUntil] = useState(0);
  const [loading, setLoading] = useState(true);
  const [restored, setRestored] = useState(0);
  const docsRef = useRef(docs);
  docsRef.current = docs;

  // ------------------------------------------------------------ loading

  const loadTree = useCallback(async () => {
    const res = await studioTree(site.id);
    if (!res.ok) throw new Error(res.error);
    setHeadSha(res.headSha);
    setEntries(res.files);
    return res;
  }, [site.id]);

  const fetchContents = useCallback(
    async (list: Entry[]) => {
      const need = list.filter((e) => !docsRef.current[e.path]);
      if (!need.length) return {};
      const res = await studioReadFiles(site.id, need.map((e) => e.sha));
      if (!res.ok) throw new Error(res.error);
      const add: Record<string, Doc> = {};
      for (const e of need) {
        const b64 = res.files[e.sha];
        if (b64 == null) continue;
        const binary = !isText(e.path);
        const content = binary ? b64 : b64ToText(b64);
        add[e.path] = { base: content, current: content, baseSha: e.sha, binary };
      }
      setDocs((d) => {
        const next = { ...d };
        for (const [p, doc] of Object.entries(add)) if (!next[p]) next[p] = doc;
        return next;
      });
      return add;
    },
    [site.id],
  );

  useEffect(() => {
    (async () => {
      try {
        const tree = await loadTree();
        // Unsaved work from this browser (kept if the page was closed before saving).
        const raw = (() => {
          try {
            return localStorage.getItem(draftKey);
          } catch {
            return null;
          }
        })();
        if (raw) {
          const saved = JSON.parse(raw) as Record<string, Doc>;
          const n = Object.keys(saved).length;
          if (n) {
            setDocs(saved);
            setRestored(n);
          }
        }
        const first = ["src/App.jsx", "app/page.jsx", "index.html", "README.md"].find((p) => tree.files.some((f) => f.path === p));
        if (first) openFile(first, tree.files);
      } catch (e) {
        setNotice({ kind: "error", text: e instanceof Error ? e.message : "Could not load the repository." });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep unsaved changes in this browser so nothing is lost on reload.
  const changes = useMemo(() => {
    const out: { path: string; kind: "added" | "modified" | "deleted"; doc: Doc }[] = [];
    for (const [path, doc] of Object.entries(docs)) {
      if (doc.deleted) {
        if (doc.baseSha) out.push({ path, kind: "deleted", doc });
      } else if (doc.base == null) out.push({ path, kind: "added", doc });
      else if (doc.current !== doc.base) out.push({ path, kind: "modified", doc });
    }
    return out.sort((a, b) => a.path.localeCompare(b.path));
  }, [docs]);

  useEffect(() => {
    if (loading) return; // don't overwrite the saved draft before it has been restored
    try {
      const dirty = Object.fromEntries(changes.map((c) => [c.path, c.doc]));
      if (Object.keys(dirty).length) localStorage.setItem(draftKey, JSON.stringify(dirty));
      else localStorage.removeItem(draftKey);
    } catch {}
  }, [changes, draftKey, loading]);

  // ------------------------------------------------------------ deploy status

  const refreshStatus = useCallback(async () => {
    const res = await studioStatus(site.id);
    if (res.ok) setDeploy(res.latest);
  }, [site.id]);

  useEffect(() => {
    refreshStatus();
    const fast = watchUntil > Date.now() || deploy?.status === "BUILDING";
    const t = setInterval(refreshStatus, fast ? 4000 : 30000);
    return () => clearInterval(t);
  }, [refreshStatus, watchUntil, deploy?.status]);

  // ------------------------------------------------------------ files

  const visible = useMemo(() => {
    const paths = new Set(entries.map((e) => e.path));
    for (const [p, d] of Object.entries(docs)) {
      if (d.deleted) paths.delete(p);
      else paths.add(p);
    }
    return Array.from(paths).sort();
  }, [entries, docs]);

  async function openFile(path: string, list = entries) {
    setTabs((t) => (t.includes(path) ? t : [...t, path]));
    setActive(path);
    const e = list.find((x) => x.path === path);
    if (e && !docsRef.current[path]) {
      try {
        await fetchContents([e]);
      } catch (err) {
        setNotice({ kind: "error", text: err instanceof Error ? err.message : "Could not open the file." });
      }
    }
  }

  function closeTab(path: string) {
    setTabs((t) => {
      const next = t.filter((x) => x !== path);
      if (active === path) setActive(next[next.length - 1] ?? null);
      return next;
    });
  }

  function edit(path: string, value: string) {
    setDocs((d) => ({ ...d, [path]: { ...d[path], current: value } }));
  }

  function newFile() {
    const dir = active && active.includes("/") ? active.slice(0, active.lastIndexOf("/") + 1) : "";
    const path = window.prompt("New file (folders with /, e.g. src/components/Card.jsx):", dir)?.trim().replace(/^\/+/, "");
    if (!path || path.endsWith("/")) return;
    if (visible.includes(path)) return setNotice({ kind: "error", text: `${path} already exists.` });
    setDocs((d) => ({ ...d, [path]: { base: null, current: "", baseSha: null, binary: false } }));
    setTabs((t) => [...t, path]);
    setActive(path);
  }

  async function renameFile(path: string) {
    const to = window.prompt("Rename / move to:", path)?.trim().replace(/^\/+/, "");
    if (!to || to === path) return;
    if (visible.includes(to)) return setNotice({ kind: "error", text: `${to} already exists.` });
    const e = entries.find((x) => x.path === path);
    let doc = docsRef.current[path];
    if (!doc && e) doc = (await fetchContents([e]))[path];
    if (!doc) return;
    setDocs((d) => ({
      ...d,
      [to]: { base: null, current: doc.current, baseSha: null, binary: doc.binary },
      [path]: { ...doc, deleted: true },
    }));
    setTabs((t) => t.map((x) => (x === path ? to : x)));
    if (active === path) setActive(to);
  }

  function deleteFile(path: string) {
    if (!window.confirm(`Delete ${path}? (It's removed from the site when you deploy.)`)) return;
    setDocs((d) => {
      const doc = d[path];
      if (doc && doc.base == null) {
        const next = { ...d };
        delete next[path];
        return next;
      }
      const e = entries.find((x) => x.path === path);
      return { ...d, [path]: { base: doc?.base ?? "", current: doc?.current ?? "", baseSha: doc?.baseSha ?? e?.sha ?? null, binary: doc?.binary ?? !isText(path), deleted: true } };
    });
    closeTab(path);
  }

  function uploadFiles(list: FileList | null) {
    if (!list) return;
    const dir = window.prompt("Upload into folder (empty = top level, e.g. public or src/assets):", "public")?.trim().replace(/^\/+|\/+$/g, "");
    if (dir == null) return;
    Array.from(list).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) return setNotice({ kind: "error", text: `${file.name} is larger than 2 MB.` });
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = String(reader.result).split(",")[1] ?? "";
        const path = (dir ? dir + "/" : "") + file.name;
        const existing = entries.find((x) => x.path === path);
        setDocs((d) => ({ ...d, [path]: { base: existing ? d[path]?.base ?? "\u0000" : null, current: b64, baseSha: existing?.sha ?? null, binary: true } }));
      };
      reader.readAsDataURL(file);
    });
  }

  function revert(path: string) {
    setDocs((d) => {
      const doc = d[path];
      const next = { ...d };
      if (!doc || doc.base == null) delete next[path];
      else next[path] = { ...doc, current: doc.base, deleted: false };
      return next;
    });
  }

  // ------------------------------------------------------------ packages

  const pkgDoc = docs["package.json"];
  const hasPkg = entries.some((e) => e.path === "package.json") || !!pkgDoc;
  const pkg = useMemo(() => {
    try {
      return pkgDoc ? (JSON.parse(pkgDoc.current) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }) : null;
    } catch {
      return null;
    }
  }, [pkgDoc]);

  async function ensurePkg() {
    if (docsRef.current["package.json"]) return docsRef.current["package.json"];
    const e = entries.find((x) => x.path === "package.json");
    return e ? (await fetchContents([e]))["package.json"] : undefined;
  }

  async function addPackage(spec: string, dev: boolean) {
    const doc = await ensurePkg();
    if (!doc) return;
    const m = /^(@?[^@\s]+)(?:@(.+))?$/.exec(spec.trim());
    if (!m) return setNotice({ kind: "error", text: "Write a package name, e.g. axios or axios@1.7.0" });
    const [, name, wanted] = m;
    setBusy("pkg");
    try {
      const res = await fetch(`https://registry.npmjs.org/${name.replace("/", "%2F")}/${encodeURIComponent(wanted || "latest")}`);
      if (!res.ok) throw new Error(`Package "${name}" ${wanted ? `version ${wanted} ` : ""}not found on npm.`);
      const info = (await res.json()) as { version: string };
      const json = JSON.parse(docsRef.current["package.json"]?.current ?? doc.current);
      const key = dev ? "devDependencies" : "dependencies";
      json[key] = { ...(json[key] ?? {}), [name]: `^${info.version}` };
      json[key] = Object.fromEntries(Object.entries(json[key]).sort(([a], [b]) => a.localeCompare(b)));
      edit("package.json", JSON.stringify(json, null, 2) + "\n");
      setNotice({ kind: "ok", text: `Added ${name}@^${info.version}. It's installed on GitHub when you deploy.` });
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof Error ? e.message : "Could not add the package." });
    } finally {
      setBusy("");
    }
  }

  function removePackage(name: string) {
    const doc = docsRef.current["package.json"];
    if (!doc) return;
    const json = JSON.parse(doc.current);
    for (const key of ["dependencies", "devDependencies"]) if (json[key]) delete json[key][name];
    edit("package.json", JSON.stringify(json, null, 2) + "\n");
  }

  // ------------------------------------------------------------ save & deploy

  async function save(overrideShas?: Record<string, string | null>) {
    if (!changes.length) return setNotice({ kind: "info", text: "No changes to deploy." });
    setBusy("save");
    setNotice(null);
    const payload: StudioChange[] = changes.map((c) => ({
      path: c.path,
      baseSha: overrideShas && c.path in overrideShas ? overrideShas[c.path] : c.doc.baseSha,
      ...(c.kind === "deleted" ? { delete: true } : { content: c.doc.current, encoding: c.doc.binary ? ("base64" as const) : ("utf-8" as const) }),
    }));
    const msg = message.trim() || (changes.length === 1 ? `Update ${changes[0].path}` : `Update ${changes.length} files`);
    const res = await studioSave(site.id, { headSha, message: msg, changes: payload });
    setBusy("");
    if (!res.ok) return setNotice({ kind: "error", text: res.error });
    if (res.conflict) {
      setConflict({ paths: res.conflict, headSha: res.headSha, files: res.files });
      return;
    }
    // Saved: the new commit becomes the base for every file.
    const shaOf = new Map(res.files.map((f) => [f.path, f.sha]));
    const changedRemotely = entries.filter((e) => shaOf.has(e.path) && shaOf.get(e.path) !== e.sha && !changes.some((c) => c.path === e.path)).map((e) => e.path);
    setDocs((d) => {
      const next: Record<string, Doc> = {};
      for (const [p, doc] of Object.entries(d)) {
        if (doc.deleted || changedRemotely.includes(p)) continue; // deleted, or reloaded below
        next[p] = { ...doc, base: doc.current, baseSha: shaOf.get(p) ?? doc.baseSha };
      }
      return next;
    });
    setEntries(res.files);
    setHeadSha(res.headSha);
    setMessage("");
    setRestored(0);
    setWatchUntil(Date.now() + 8 * 60_000);
    setNotice({ kind: "ok", text: "Committed to GitHub. Building now. It goes live in about 1–2 minutes." });
    setTimeout(refreshStatus, 2500);
  }

  async function resolveConflict(choice: "mine" | "theirs") {
    if (!conflict) return;
    const remote = new Map(conflict.files.map((f) => [f.path, f.sha]));
    setEntries(conflict.files);
    setHeadSha(conflict.headSha);
    if (choice === "theirs") {
      setDocs((d) => {
        const next = { ...d };
        for (const p of conflict.paths) delete next[p];
        return next;
      });
      setConflict(null);
      const reopen = conflict.files.filter((f) => conflict.paths.includes(f.path) && tabs.includes(f.path));
      if (reopen.length) await fetchContents(reopen);
      setNotice({ kind: "info", text: "Loaded the latest version of those files. Your other changes are kept." });
      return;
    }
    const shas = Object.fromEntries(conflict.paths.map((p) => [p, remote.get(p) ?? null]));
    setConflict(null);
    setDocs((d) => {
      const next = { ...d };
      for (const p of conflict.paths) if (next[p]) next[p] = { ...next[p], baseSha: shas[p] };
      return next;
    });
    await save(shas);
  }

  async function reloadAll() {
    if (changes.length && !window.confirm("Reload from GitHub? Your unsaved changes in this browser will be discarded.")) return;
    setDocs({});
    setTabs([]);
    setActive(null);
    setLoading(true);
    try {
      await loadTree();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setNotice({ kind: "info", text: "Changes are kept in this browser. Click “Commit & deploy” to publish them." });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ------------------------------------------------------------ preview

  const [previewMode, setPreviewMode] = useState<"instant" | "live" | "off">(props.framework === "NEXTJS" ? "live" : "instant");
  const [previewKey, setPreviewKey] = useState(0);
  const [previewError, setPreviewError] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const pendingDoc = useRef<{ html: string; path: string } | null>(null);
  const canInstant = props.framework !== "NEXTJS";

  const collectFiles = useCallback(async (): Promise<PreviewFiles> => {
    const wanted = entries.filter((e) => (isText(e.path) || DATA_EXT.test(e.path)) && e.size < 1_500_000 && !e.path.startsWith(".github/"));
    // Files loaded just now aren't in React state yet, so merge them in (edits win).
    const loaded = await fetchContents(wanted);
    const all = { ...loaded, ...docsRef.current };
    const text: Record<string, string> = {};
    const data: Record<string, string> = {};
    for (const [p, d] of Object.entries(all)) {
      if (d.deleted) continue;
      const ext = p.split(".").pop()!.toLowerCase();
      if (d.binary) data[p] = `data:${MIME[ext] ?? "application/octet-stream"};base64,${d.current}`;
      else {
        text[p] = d.current;
        if (ext === "svg") data[p] = `data:image/svg+xml;base64,${textToB64(d.current)}`;
      }
    }
    // Vite serves public/ at the site root.
    for (const [p, v] of Object.entries(data)) if (p.startsWith("public/")) data[p.slice(7)] = v;
    return { text, data };
  }, [entries, fetchContents]);

  const runPreview = useCallback(async () => {
    if (previewMode !== "instant" || !canInstant || loading) return;
    setPreviewBusy(true);
    setPreviewError("");
    try {
      const files = await collectFiles();
      const page = active && active.endsWith(".html") ? active : "index.html";
      pendingDoc.current = props.framework === "HTML" ? buildHtmlPreview(files, page) : await buildReactPreview(files);
      setPreviewKey((k) => k + 1); // reload the shell, which then asks for the document
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : String(e));
    } finally {
      setPreviewBusy(false);
    }
  }, [previewMode, canInstant, loading, collectFiles, active, props.framework]);

  // Rebuild the instant preview shortly after typing stops.
  const changeSig = useMemo(() => changes.map((c) => c.path + ":" + c.doc.current.length + ":" + (c.doc.deleted ? "d" : "")).join("|"), [changes]);
  useEffect(() => {
    if (previewMode !== "instant") return;
    const t = setTimeout(runPreview, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeSig, previewMode, loading, active?.endsWith(".html") ? active : ""]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== props.siteOrigin || e.data?.type !== "studio-preview-ready" || !pendingDoc.current) return;
      frameRef.current?.contentWindow?.postMessage({ type: "studio-preview", ...pendingDoc.current }, props.siteOrigin);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [props.siteOrigin]);

  // ------------------------------------------------------------ render

  const activeDoc = active ? docs[active] : undefined;
  const statusEl = (() => {
    if (!deploy) return <span className="text-slate-400">No builds yet</span>;
    const color = { LIVE: "text-emerald-400", BUILDING: "text-amber-300", FAILED: "text-red-400", REPLACED: "text-slate-400" }[deploy.status];
    const label = { LIVE: "● Live", BUILDING: "◌ Building…", FAILED: "✕ Build failed", REPLACED: "Previous" }[deploy.status];
    return (
      <span className="truncate">
        <span className={color}>{label}</span> · {deploy.commitMessage || deploy.commitSha.slice(0, 7)} · {timeAgo(deploy.createdAt)} ·{" "}
        <a href={deploy.runUrl} target="_blank" rel="noreferrer" className="underline">log</a>
        {deploy.error && <span className="text-red-300"> · {deploy.error}</span>}
      </span>
    );
  })();

  return (
    <div className="flex h-screen flex-col bg-[#1e1e1e] text-[13px] text-slate-200">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-black/40 bg-[#2d2d2d] px-3 py-2">
        <Link href={`/admin/sites/${site.id}`} className="rounded px-2 py-1 text-slate-300 hover:bg-white/10">← {site.name}</Link>
        <span className="hidden text-slate-400 sm:inline">Code Studio · {props.frameworkLabel} · <a href={props.repoUrl} target="_blank" rel="noreferrer" className="hover:underline">{props.repo}</a> ({props.branch})</span>
        <div className="ml-auto flex items-center gap-2">
          <a href={props.vscodeUrl} className="rounded px-2 py-1 text-slate-300 hover:bg-white/10" title="Open this repository in VS Code on this computer">Open in laptop VS Code</a>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder={changes.length ? "Describe your change…" : "No changes"}
            className="w-56 rounded border border-white/10 bg-[#3c3c3c] px-2 py-1 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button onClick={() => save()} disabled={!!busy || !changes.length} className="rounded bg-sky-600 px-3 py-1.5 font-semibold text-white hover:bg-sky-500 disabled:opacity-40">
            {busy === "save" ? "Committing…" : `Commit & deploy${changes.length ? ` (${changes.length})` : ""}`}
          </button>
        </div>
      </header>

      {notice && (
        <div className={`flex items-center justify-between px-3 py-1.5 ${notice.kind === "error" ? "bg-red-900/70" : notice.kind === "ok" ? "bg-emerald-900/60" : "bg-sky-900/50"}`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="px-2 text-slate-300 hover:text-white" aria-label="Dismiss">✕</button>
        </div>
      )}
      {restored > 0 && (
        <div className="flex items-center justify-between bg-amber-900/50 px-3 py-1.5">
          <span>Restored {restored} unsaved change{restored === 1 ? "" : "s"} from this browser.</span>
          <button onClick={() => { setDocs({}); setRestored(0); }} className="underline">Discard them</button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Activity bar */}
        <nav className="flex w-11 flex-col items-center gap-1 bg-[#333333] py-2">
          {([["files", "Files", "▤"], ["changes", "Changes", "⑂"], ["packages", "Packages", "⬢"]] as const).map(([key, label, icon]) => (
            <button key={key} onClick={() => setPanel(key)} title={label} className={`relative h-10 w-10 rounded text-lg ${panel === key ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>
              {icon}
              {key === "changes" && changes.length > 0 && <span className="absolute right-0.5 top-0.5 rounded-full bg-sky-600 px-1 text-[10px] text-white">{changes.length}</span>}
            </button>
          ))}
        </nav>

        {/* Side panel */}
        <aside className="flex w-64 min-w-0 flex-col border-r border-black/40 bg-[#252526]">
          {panel === "files" && (
            <>
              <div className="flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <span>Files</span>
                <span className="flex gap-1">
                  <button onClick={newFile} title="New file" className="rounded px-1.5 hover:bg-white/10">＋</button>
                  <label title="Upload files (images…)" className="cursor-pointer rounded px-1.5 hover:bg-white/10">
                    ⇪<input type="file" multiple className="hidden" onChange={(e) => { uploadFiles(e.target.files); e.target.value = ""; }} />
                  </label>
                  <button onClick={reloadAll} title="Reload from GitHub" className="rounded px-1.5 hover:bg-white/10">↻</button>
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pb-4">
                {loading ? <p className="px-3 text-slate-500">Loading repository…</p> : <FileTree paths={visible} active={active} dirty={new Set(changes.map((c) => c.path))} onOpen={(p) => openFile(p)} onRename={renameFile} onDelete={deleteFile} />}
              </div>
            </>
          )}
          {panel === "changes" && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Changes ({changes.length})</p>
              {changes.length === 0 && <p className="px-3 text-slate-500">Nothing changed yet.</p>}
              {changes.map((c) => (
                <div key={c.path} className="group flex items-center gap-2 px-3 py-1 hover:bg-white/5">
                  <span className={`w-4 text-center font-bold ${c.kind === "added" ? "text-emerald-400" : c.kind === "deleted" ? "text-red-400" : "text-amber-300"}`}>{c.kind[0].toUpperCase()}</span>
                  <button onClick={() => c.kind !== "deleted" && openFile(c.path)} className="min-w-0 flex-1 truncate text-left" title={c.path}>{c.path}</button>
                  <button onClick={() => revert(c.path)} className="hidden text-slate-400 hover:text-white group-hover:block" title="Undo this change">↶</button>
                </div>
              ))}
              {changes.length > 0 && <p className="px-3 pt-3 text-xs text-slate-500">Write a message at the top and click <b>Commit &amp; deploy</b>. GitHub builds it and the site updates in about 1–2 minutes.</p>}
            </div>
          )}
          {panel === "packages" && <PackagesPanel hasPkg={hasPkg} pkg={pkg} busy={busy === "pkg"} onLoad={ensurePkg} onAdd={addPackage} onRemove={removePackage} framework={props.framework} />}
        </aside>

        {/* Editor */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-9 overflow-x-auto bg-[#252526]">
            {tabs.map((t) => (
              <div key={t} className={`group flex items-center gap-2 border-r border-black/30 px-3 ${t === active ? "bg-[#1e1e1e] text-white" : "text-slate-400 hover:text-slate-200"}`}>
                <button onClick={() => setActive(t)} className="whitespace-nowrap" title={t}>
                  {t.split("/").pop()}
                  {changes.some((c) => c.path === t) && <span className="ml-1 text-sky-400">●</span>}
                </button>
                <button onClick={() => closeTab(t)} className="opacity-50 hover:opacity-100" aria-label={`Close ${t}`}>✕</button>
              </div>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {!active ? (
              <div className="flex h-full items-center justify-center text-slate-500">{loading ? "Loading…" : "Open a file from the left."}</div>
            ) : !activeDoc ? (
              <div className="p-6 text-slate-500">Loading {active}…</div>
            ) : activeDoc.binary ? (
              <BinaryView path={active} doc={activeDoc} />
            ) : (
              <Editor path={active} value={activeDoc.current} onChange={(v) => edit(active, v)} />
            )}
          </div>
        </main>

        {/* Preview */}
        {previewMode !== "off" && (
          <section className="hidden w-[38%] min-w-[320px] flex-col border-l border-black/40 bg-white lg:flex">
            <div className="flex items-center gap-2 bg-[#2d2d2d] px-3 py-1.5 text-slate-300">
              <div className="flex rounded bg-black/30 p-0.5 text-xs">
                {canInstant && (
                  <button onClick={() => setPreviewMode("instant")} className={`rounded px-2 py-0.5 ${previewMode === "instant" ? "bg-sky-600 text-white" : ""}`}>Instant</button>
                )}
                <button onClick={() => setPreviewMode("live")} className={`rounded px-2 py-0.5 ${previewMode === "live" ? "bg-sky-600 text-white" : ""}`}>Live site</button>
              </div>
              {previewMode === "instant" && <button onClick={runPreview} className="rounded px-1.5 hover:bg-white/10" title="Refresh preview">↻</button>}
              <span className="truncate text-xs text-slate-400">
                {previewMode === "instant" ? (previewBusy ? "Building preview…" : "Your unsaved code, compiled in this browser") : "What visitors see now"}
              </span>
              <button onClick={() => setPreviewMode("off")} className="ml-auto px-1.5 hover:text-white" title="Hide preview">✕</button>
            </div>
            {previewMode === "instant" && previewError && <pre className="max-h-40 overflow-auto whitespace-pre-wrap bg-red-900 px-3 py-2 text-xs text-white">{previewError}</pre>}
            {previewMode === "instant" ? (
              <iframe key={previewKey} ref={frameRef} src={`${props.siteOrigin}/__studio-preview`} title="Instant preview" className="min-h-0 flex-1 bg-white" />
            ) : (
              <iframe key={`live-${deploy?.commitSha ?? ""}-${deploy?.status ?? ""}`} src={props.liveUrl} title="Live site" className="min-h-0 flex-1 bg-white" />
            )}
            {!canInstant && <p className="bg-[#2d2d2d] px-3 py-1 text-xs text-slate-400">Next.js previews after each deploy (instant preview is for React and HTML sites).</p>}
          </section>
        )}
      </div>

      {/* Status bar */}
      <footer className="flex items-center gap-4 bg-sky-800 px-3 py-1 text-xs text-white">
        {statusEl}
        <span className="ml-auto whitespace-nowrap">{changes.length ? `${changes.length} unsaved change${changes.length === 1 ? "" : "s"} (kept in this browser)` : "All changes deployed"}</span>
        {previewMode === "off" && <button onClick={() => setPreviewMode(canInstant ? "instant" : "live")} className="underline">Show preview</button>}
        <a href={props.liveUrl} target="_blank" rel="noreferrer" className="underline">Open site ↗</a>
      </footer>

      {conflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg bg-[#252526] p-5 shadow-2xl">
            <h2 className="text-base font-semibold text-white">These files were changed somewhere else</h2>
            <p className="mt-2 text-slate-300">Someone pushed a newer version of these files (for example from VS Code on a laptop) after you opened them:</p>
            <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-5 font-mono text-xs text-amber-200">
              {conflict.paths.map((p) => <li key={p}>{p}</li>)}
            </ul>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button onClick={() => setConflict(null)} className="rounded px-3 py-1.5 text-slate-300 hover:bg-white/10">Cancel</button>
              <button onClick={() => resolveConflict("theirs")} className="rounded bg-white/10 px-3 py-1.5 text-white hover:bg-white/20">Use their version</button>
              <button onClick={() => resolveConflict("mine")} className="rounded bg-sky-600 px-3 py-1.5 font-semibold text-white hover:bg-sky-500">Keep mine and deploy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- pieces

function FileTree({ paths, active, dirty, onOpen, onRename, onDelete }: { paths: string[]; active: string | null; dirty: Set<string>; onOpen: (p: string) => void; onRename: (p: string) => void; onDelete: (p: string) => void }) {
  const [closed, setClosed] = useState<Set<string>>(() => new Set(["node_modules", ".github"]));
  type Node = { name: string; path: string; children: Map<string, Node>; file: boolean };
  const root: Node = { name: "", path: "", children: new Map(), file: false };
  for (const p of paths) {
    let node = root;
    p.split("/").forEach((part, i, arr) => {
      const path = arr.slice(0, i + 1).join("/");
      if (!node.children.has(part)) node.children.set(part, { name: part, path, children: new Map(), file: i === arr.length - 1 });
      node = node.children.get(part)!;
    });
  }
  const sorted = (n: Node) => Array.from(n.children.values()).sort((a, b) => (a.file === b.file ? a.name.localeCompare(b.name) : a.file ? 1 : -1));
  const render = (n: Node, depth: number): React.ReactNode =>
    sorted(n).map((c) =>
      c.file ? (
        <div key={c.path} className={`group flex items-center pr-2 ${c.path === active ? "bg-sky-900/60 text-white" : "hover:bg-white/5"}`} style={{ paddingLeft: 12 + depth * 12 }}>
          <button onClick={() => onOpen(c.path)} className="min-w-0 flex-1 truncate py-0.5 text-left" title={c.path}>
            {c.name}
            {dirty.has(c.path) && <span className="ml-1 text-sky-400">●</span>}
          </button>
          <span className="hidden gap-1 text-slate-400 group-hover:flex">
            <button onClick={() => onRename(c.path)} title="Rename / move" className="hover:text-white">✎</button>
            <button onClick={() => onDelete(c.path)} title="Delete" className="hover:text-red-400">🗑</button>
          </span>
        </div>
      ) : (
        <div key={c.path}>
          <button
            onClick={() => setClosed((s) => { const x = new Set(s); if (x.has(c.path)) x.delete(c.path); else x.add(c.path); return x; })}
            className="flex w-full items-center gap-1 py-0.5 text-left text-slate-300 hover:bg-white/5"
            style={{ paddingLeft: 6 + depth * 12 }}
          >
            <span className="w-3 text-[10px] text-slate-500">{closed.has(c.path) ? "▸" : "▾"}</span>
            {c.name}
          </button>
          {!closed.has(c.path) && render(c, depth + 1)}
        </div>
      ),
    );
  return <div>{render(root, 0)}</div>;
}

function BinaryView({ path, doc }: { path: string; doc: Doc }) {
  const ext = path.split(".").pop()!.toLowerCase();
  const isImg = ["png", "jpg", "jpeg", "gif", "webp", "avif", "ico"].includes(ext);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-slate-400">
      {isImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`data:${MIME[ext]};base64,${doc.current}`} alt={path} className="max-h-[60vh] max-w-full rounded bg-[repeating-conic-gradient(#444_0%_25%,#333_0%_50%)] bg-[length:16px_16px]" />
      ) : (
        <p>Binary file. It can be replaced by uploading a file with the same name.</p>
      )}
      <p className="text-xs">{path} · {Math.round((doc.current.length * 3) / 4 / 1024)} KB</p>
    </div>
  );
}

function PackagesPanel({ hasPkg, pkg, busy, onLoad, onAdd, onRemove, framework }: {
  hasPkg: boolean;
  pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | null;
  busy: boolean;
  onLoad: () => void;
  onAdd: (spec: string, dev: boolean) => void;
  onRemove: (name: string) => void;
  framework: string;
}) {
  const [spec, setSpec] = useState("");
  const [dev, setDev] = useState(false);
  useEffect(() => {
    if (hasPkg && !pkg) onLoad();
  }, [hasPkg, pkg, onLoad]);
  if (!hasPkg) return <p className="p-3 text-slate-500">{framework === "HTML" ? "HTML sites don't use npm packages. Link libraries from a CDN in index.html instead." : "No package.json in this repository."}</p>;
  if (!pkg) return <p className="p-3 text-slate-500">Loading package.json…</p>;
  const list = (title: string, deps?: Record<string, string>) => (
    <div className="mb-3">
      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      {Object.entries(deps ?? {}).map(([name, v]) => (
        <div key={name} className="group flex items-center gap-2 px-3 py-0.5 hover:bg-white/5">
          <span className="min-w-0 flex-1 truncate">{name}</span>
          <span className="text-xs text-slate-500">{v}</span>
          <button onClick={() => onRemove(name)} className="hidden text-slate-400 hover:text-red-400 group-hover:block" title={`Remove ${name}`}>✕</button>
        </div>
      ))}
      {!Object.keys(deps ?? {}).length && <p className="px-3 text-xs text-slate-500">None</p>}
    </div>
  );
  return (
    <div className="min-h-0 flex-1 overflow-y-auto pt-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (spec.trim()) {
            onAdd(spec, dev);
            setSpec("");
          }
        }}
        className="space-y-2 px-3 pb-3"
      >
        <input value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="Add package, e.g. axios or framer-motion" className="w-full rounded border border-white/10 bg-[#3c3c3c] px-2 py-1 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500" />
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-1 text-slate-400"><input type="checkbox" checked={dev} onChange={(e) => setDev(e.target.checked)} /> dev dependency</label>
          <button disabled={busy || !spec.trim()} className="rounded bg-sky-600 px-2 py-1 font-semibold text-white disabled:opacity-40">{busy ? "Adding…" : "Add"}</button>
        </div>
        <p className="text-xs text-slate-500">This replaces <code>npm install</code>: the package is added to package.json and installed by GitHub when you deploy. The instant preview loads it straight away.</p>
      </form>
      {list("Dependencies", pkg.dependencies)}
      {list("Dev dependencies", pkg.devDependencies)}
    </div>
  );
}
