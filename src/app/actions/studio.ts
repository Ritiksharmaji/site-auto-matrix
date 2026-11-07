"use server";

import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { commitOnto, GitHubError, githubConfig, readBlob, readRepoTree, type FileChange, type RepoEntry } from "@/lib/github";
import { siteScope } from "@/lib/permissions";

// Code Studio: VS Code's editor inside the admin panel. It edits the same GitHub
// repository as "Open in VS Code" on a laptop; saving commits to the repo, and the
// existing GitHub Actions → webhook pipeline builds and publishes it.

const WORKFLOW_PATH = ".github/workflows/onekampus-deploy.yml";
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_SAVE_BYTES = 8 * 1024 * 1024;

async function loadCodeSite(siteId: string) {
  const user = await getCurrentUser();
  if (!user || user.role === "CLIENT") throw new Error("Not allowed");
  const site = await db.site.findFirst({ where: { id: siteId, ...siteScope(user) }, include: { codeProject: true } });
  if (!site?.codeProject) throw new Error("Code website not found");
  if (!githubConfig().ready) throw new Error("GitHub isn't connected on this server.");
  return { user, site, project: site.codeProject };
}

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

async function guarded<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

/** The repo's file list at the latest commit. */
export async function studioTree(siteId: string) {
  return guarded(async () => {
    const { project } = await loadCodeSite(siteId);
    const { headSha, files } = await readRepoTree(project.repoOwner, project.repoName, project.branch);
    return { headSha, files };
  });
}

/** File contents by blob sha (base64), for opening files and building previews. */
export async function studioReadFiles(siteId: string, shas: string[]) {
  return guarded(async () => {
    const { project } = await loadCodeSite(siteId);
    const unique = Array.from(new Set(shas)).slice(0, 150);
    const out: Record<string, string> = {};
    let total = 0;
    // A few at a time to stay polite with GitHub's API.
    for (let i = 0; i < unique.length; i += 8) {
      const batch = await Promise.all(unique.slice(i, i + 8).map((sha) => readBlob(project.repoOwner, project.repoName, sha).then((b) => [sha, b] as const)));
      for (const [sha, b] of batch) {
        if (b.size > MAX_FILE_BYTES) continue;
        total += b.size;
        if (total > 20 * 1024 * 1024) throw new Error("Too much to load at once.");
        out[sha] = b.base64;
      }
    }
    return { files: out };
  });
}

export type StudioChange = {
  path: string;
  /** Blob sha the editor started from (null for a new file). */
  baseSha: string | null;
  content?: string;
  encoding?: "utf-8" | "base64";
  delete?: boolean;
};

function checkPath(p: string) {
  if (!p || p.length > 300 || p.startsWith("/") || p.endsWith("/") || p.includes("\\") || p.split("/").some((s) => s === "" || s === "." || s === "..") || p.startsWith(".git/")) {
    throw new Error(`Invalid file name: ${p}`);
  }
}

/**
 * Commits the editor's changes. If the branch moved since the editor loaded it
 * (e.g. a push from a laptop), the commit goes on top of the new version as long as
 * none of the edited files changed there; otherwise those files are reported.
 */
export async function studioSave(siteId: string, input: { headSha: string; message: string; changes: StudioChange[] }) {
  return guarded(async () => {
    const { user, site, project } = await loadCodeSite(siteId);
    const message = input.message.trim().slice(0, 200) || "Update from Code Studio";
    if (!input.changes.length) throw new Error("Nothing to save.");
    if (input.changes.length > 200) throw new Error("Too many changes at once (max 200 files).");
    let bytes = 0;
    for (const c of input.changes) {
      checkPath(c.path);
      if (c.delete && c.path === WORKFLOW_PATH) throw new Error("The deploy workflow can't be deleted (the site would stop updating).");
      bytes += c.content?.length ?? 0;
    }
    if (bytes > MAX_SAVE_BYTES) throw new Error("These changes are larger than 8 MB.");

    const current = await readRepoTree(project.repoOwner, project.repoName, project.branch);
    if (current.headSha !== input.headSha) {
      const now = new Map(current.files.map((f) => [f.path, f.sha]));
      const clashes = input.changes.filter((c) => (now.get(c.path) ?? null) !== c.baseSha).map((c) => c.path);
      if (clashes.length) {
        return { conflict: clashes, headSha: current.headSha, files: current.files as RepoEntry[], commitSha: null as string | null };
      }
    }
    const changes: FileChange[] = input.changes.map((c) => (c.delete ? { path: c.path, delete: true } : { path: c.path, content: c.content ?? "", encoding: c.encoding ?? "utf-8" }));
    let commitSha: string;
    try {
      commitSha = await commitOnto(project.repoOwner, project.repoName, project.branch, current.headSha, changes, message);
    } catch (e) {
      if (e instanceof GitHubError && e.status === 422) throw new Error("Someone pushed at the same moment. Click Save again.");
      throw e;
    }
    await logActivity(user.id, "code.studio", `${user.name} saved ${input.changes.length} file(s) in Code Studio on "${site.name}": ${message}`);
    const after = await readRepoTree(project.repoOwner, project.repoName, project.branch);
    return { conflict: null as string[] | null, headSha: after.headSha, files: after.files, commitSha };
  });
}

/** Latest deploys for the status bar. */
export async function studioStatus(siteId: string) {
  return guarded(async () => {
    const user = await getCurrentUser();
    if (!user || user.role === "CLIENT") throw new Error("Not allowed");
    const site = await db.site.findFirst({ where: { id: siteId, ...siteScope(user) }, include: { codeProject: { include: { deploys: { orderBy: { createdAt: "desc" }, take: 1 } } } } });
    if (!site?.codeProject) throw new Error("Code website not found");
    const d = site.codeProject.deploys[0];
    return {
      latest: d ? { status: d.status, commitSha: d.commitSha, commitMessage: d.commitMessage, runUrl: d.runUrl, error: d.error, createdAt: d.createdAt.toISOString() } : null,
    };
  });
}
