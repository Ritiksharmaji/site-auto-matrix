import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Minimal GitHub REST client for code websites. Configure on the server:
//   GITHUB_TOKEN           fine-grained token: Administration, Contents, Workflows,
//                          Webhooks (read/write) and Actions (read) on the site repos
//   GITHUB_OWNER           account or organisation that owns the repos (e.g. Ritiksharmaji)
//   GITHUB_WEBHOOK_SECRET  random string; GitHub signs webhook calls with it

// GITHUB_API_URL is only for local testing against a mock; production uses api.github.com.
const API = process.env.GITHUB_API_URL || "https://api.github.com";
export const DEPLOY_WORKFLOW_FILE = "onekampus-deploy.yml";
export const DEPLOY_WORKFLOW_NAME = "Deploy to oneKampus";
export const BUILD_ARTIFACT_NAME = "site";

export function githubConfig() {
  const token = process.env.GITHUB_TOKEN ?? "";
  const owner = process.env.GITHUB_OWNER ?? "";
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET ?? "";
  return { token, owner, webhookSecret, ready: Boolean(token && owner && webhookSecret) };
}

export class GitHubError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function gh<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { token } = githubConfig();
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${token}`,
      ...(init.json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    cache: "no-store",
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string }).message ?? res.statusText;
    throw new GitHubError(`GitHub: ${msg}`, res.status);
  }
  return data as T;
}

/** Creates a private repo with an initial commit (GitHub's API can't commit to an empty repo). */
export async function createRepo(name: string, description: string) {
  const { owner } = githubConfig();
  const me = await gh<{ login: string }>("/user");
  const path = me.login.toLowerCase() === owner.toLowerCase() ? "/user/repos" : `/orgs/${owner}/repos`;
  return gh<{ name: string; owner: { login: string }; default_branch: string; html_url: string; clone_url: string }>(path, {
    method: "POST",
    json: { name, description, private: true, auto_init: true, has_wiki: false, has_projects: false },
  });
}

/** Replaces the repo's contents with these files in one commit on `branch`. */
export async function commitFiles(owner: string, repo: string, branch: string, files: { path: string; content: string }[], message: string) {
  const ref = await gh<{ object: { sha: string } }>(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  const parent = ref.object.sha;
  const tree = await gh<{ sha: string }>(`/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    json: { tree: files.map((f) => ({ path: f.path, mode: "100644", type: "blob", content: f.content })) },
  });
  const commit = await gh<{ sha: string }>(`/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    json: { message, tree: tree.sha, parents: [parent] },
  });
  await gh(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, { method: "PATCH", json: { sha: commit.sha, force: true } });
  return commit.sha;
}

export async function createWebhook(owner: string, repo: string, url: string) {
  const hook = await gh<{ id: number }>(`/repos/${owner}/${repo}/hooks`, {
    method: "POST",
    json: { name: "web", active: true, events: ["workflow_run"], config: { url, content_type: "json", secret: githubConfig().webhookSecret, insecure_ssl: "0" } },
  });
  return hook.id;
}

/** Invites a GitHub user to the repo with write (push) access. */
export async function addCollaborator(owner: string, repo: string, username: string) {
  await gh(`/repos/${owner}/${repo}/collaborators/${encodeURIComponent(username)}`, { method: "PUT", json: { permission: "push" } });
}

/** Starts the deploy workflow again for the latest commit on `branch`. */
export async function dispatchDeploy(owner: string, repo: string, branch: string) {
  await gh(`/repos/${owner}/${repo}/actions/workflows/${DEPLOY_WORKFLOW_FILE}/dispatches`, { method: "POST", json: { ref: branch } });
}

/** Downloads the zipped build ("site" artifact) of a workflow run. */
export async function downloadBuildArtifact(owner: string, repo: string, runId: string): Promise<Uint8Array> {
  const list = await gh<{ artifacts: { name: string; expired: boolean; size_in_bytes: number; archive_download_url: string }[] }>(
    `/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`,
  );
  const art = list.artifacts.find((a) => a.name === BUILD_ARTIFACT_NAME && !a.expired);
  if (!art) throw new Error(`The build has no "${BUILD_ARTIFACT_NAME}" artifact. Check the workflow file.`);
  if (art.size_in_bytes > 150 * 1024 * 1024) throw new Error("The build is larger than 150 MB.");
  // GitHub answers with a redirect to a signed storage URL; the token must not be sent there.
  const res = await fetch(art.archive_download_url, {
    headers: { Authorization: `Bearer ${githubConfig().token}`, Accept: "application/vnd.github+json" },
    redirect: "manual",
    cache: "no-store",
  });
  const location = res.headers.get("location");
  const file = location ? await fetch(location, { cache: "no-store" }) : res;
  if (!file.ok) throw new Error(`Could not download the build (${file.status}).`);
  return new Uint8Array(await file.arrayBuffer());
}

/** Checks GitHub's `X-Hub-Signature-256` header against the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const { webhookSecret } = githubConfig();
  if (!webhookSecret || !signature?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", webhookSecret).update(rawBody).digest("hex")}`);
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function cloneUrl(owner: string, repo: string) {
  return `https://github.com/${owner}/${repo}.git`;
}

/** Opens VS Code on the user's computer and clones the repo (VS Code's built-in Git handler). */
export function vscodeCloneLink(owner: string, repo: string) {
  return `vscode://vscode.git/clone?url=${encodeURIComponent(cloneUrl(owner, repo))}`;
}

// ---------------------------------------------------------------- Code Studio (in-browser editor)

export type RepoEntry = { path: string; sha: string; size: number };

/** The latest commit on a branch and its file list (files only, recursive). */
export async function readRepoTree(owner: string, repo: string, branch: string) {
  const ref = await gh<{ object: { sha: string } }>(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  const commit = await gh<{ tree: { sha: string } }>(`/repos/${owner}/${repo}/git/commits/${ref.object.sha}`);
  const tree = await gh<{ tree: { path: string; type: string; sha: string; size?: number }[]; truncated: boolean }>(
    `/repos/${owner}/${repo}/git/trees/${commit.tree.sha}?recursive=1`,
  );
  const files: RepoEntry[] = tree.tree.filter((t) => t.type === "blob").map((t) => ({ path: t.path, sha: t.sha, size: t.size ?? 0 }));
  return { headSha: ref.object.sha, files, truncated: tree.truncated };
}

/** A file's bytes (base64) by blob sha. */
export async function readBlob(owner: string, repo: string, sha: string) {
  const blob = await gh<{ content: string; encoding: string; size: number }>(`/repos/${owner}/${repo}/git/blobs/${sha}`);
  return { base64: blob.content.replace(/\n/g, ""), size: blob.size };
}

export type FileChange = { path: string; content?: string; encoding?: "utf-8" | "base64"; delete?: boolean };

/**
 * Commits changes on top of `parentSha` (only adds/updates/deletes the given paths)
 * and moves the branch to it. Fails with GitHubError 422 if the branch moved meanwhile.
 */
export async function commitOnto(owner: string, repo: string, branch: string, parentSha: string, changes: FileChange[], message: string) {
  const parent = await gh<{ tree: { sha: string } }>(`/repos/${owner}/${repo}/git/commits/${parentSha}`);
  const entries = await Promise.all(
    changes.map(async (c) => {
      if (c.delete) return { path: c.path, mode: "100644", type: "blob", sha: null };
      if (c.encoding === "base64") {
        const blob = await gh<{ sha: string }>(`/repos/${owner}/${repo}/git/blobs`, { method: "POST", json: { content: c.content ?? "", encoding: "base64" } });
        return { path: c.path, mode: "100644", type: "blob", sha: blob.sha };
      }
      return { path: c.path, mode: "100644", type: "blob", content: c.content ?? "" };
    }),
  );
  const tree = await gh<{ sha: string }>(`/repos/${owner}/${repo}/git/trees`, { method: "POST", json: { base_tree: parent.tree.sha, tree: entries } });
  const commit = await gh<{ sha: string }>(`/repos/${owner}/${repo}/git/commits`, { method: "POST", json: { message, tree: tree.sha, parents: [parentSha] } });
  await gh(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, { method: "PATCH", json: { sha: commit.sha, force: false } });
  return commit.sha;
}
