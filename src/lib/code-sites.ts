import "server-only";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CodeFramework } from "@prisma/client";
import { unzipSync } from "fflate";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { commitFiles, createRepo, createWebhook, DEPLOY_WORKFLOW_NAME, downloadBuildArtifact, githubConfig } from "./github";
import { platformHost } from "./hosts";

// Code websites: the source is a GitHub repo (edited in VS Code), GitHub Actions
// builds it, and the platform stores each build as a folder and serves the live one.
//
//   CODE_SITES_DIR/<siteId>/<deployId>/...   one folder per successful build

export const CODE_MODULE_KEY = "code";
export const KEEP_BUILDS = 5;

export const FRAMEWORKS: { value: CodeFramework; label: string; description: string; template: string }[] = [
  { value: "REACT", label: "React (Vite)", description: "Single-page React app with page links (React Router)", template: "react" },
  { value: "NEXTJS", label: "Next.js", description: "Next.js App Router, exported as static pages", template: "nextjs" },
  { value: "HTML", label: "HTML / CSS / JS", description: "Plain files, no build step", template: "html" },
];

export function codeSitesDir() {
  return process.env.CODE_SITES_DIR ?? path.join(process.cwd(), "storage", "code-sites");
}

export function buildDir(siteId: string, deployId: string) {
  return path.join(codeSitesDir(), siteId, deployId);
}

// ---------------------------------------------------------------- templates

async function listFiles(dir: string, base = dir): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full, base)));
    else out.push(path.relative(base, full));
  }
  return out;
}

/** Starter files for a framework, with the site's name and address filled in. */
export async function templateFiles(framework: CodeFramework, vars: { name: string; slug: string; url: string }) {
  const tpl = FRAMEWORKS.find((f) => f.value === framework)!.template;
  const root = path.join(process.cwd(), "code-templates", tpl);
  const files = await listFiles(root);
  return Promise.all(
    files.map(async (rel) => ({
      path: rel.split(path.sep).join("/"),
      content: (await readFile(path.join(root, rel), "utf8"))
        .replaceAll("__NAME__", vars.name.replace(/[<>"`$\\]/g, ""))
        .replaceAll("__SLUG__", vars.slug)
        .replaceAll("__URL__", vars.url),
    })),
  );
}

/**
 * Creates the GitHub repo for a new code website, commits the starter template
 * (which starts the first build) and registers the deploy webhook.
 */
export async function createCodeRepo(opts: { slug: string; name: string; framework: CodeFramework; url: string }) {
  const cfg = githubConfig();
  if (!cfg.ready) throw new Error("GitHub isn't connected yet. Add GITHUB_TOKEN, GITHUB_OWNER and GITHUB_WEBHOOK_SECRET on the server (see docs/DEPLOYMENT.md).");
  const repoName = `site-${opts.slug}`;
  const repo = await createRepo(repoName, `${opts.name}: website hosted by oneKampus (${opts.url})`);
  const owner = repo.owner.login;
  const branch = repo.default_branch || "main";
  const webhookId = await createWebhook(owner, repo.name, `https://${platformHost()}/api/github/webhook`);
  await commitFiles(owner, repo.name, branch, await templateFiles(opts.framework, opts), "Starter website from oneKampus");
  return { owner, repoName: repo.name, branch, webhookId };
}

// ---------------------------------------------------------------- builds

const MAX_FILES = 10_000;
const MAX_BYTES = 300 * 1024 * 1024;

/** Unzips a build into its folder after checking every path. Returns file count and size. */
export async function installBuild(siteId: string, deployId: string, zip: Uint8Array) {
  const entries = unzipSync(zip);
  const names = Object.keys(entries).filter((n) => !n.endsWith("/"));
  if (names.length === 0) throw new Error("The build is empty.");
  if (names.length > MAX_FILES) throw new Error(`The build has more than ${MAX_FILES} files.`);
  let total = 0;
  for (const n of names) {
    const clean = path.posix.normalize(n);
    if (clean.startsWith("../") || clean.startsWith("/") || clean.includes("\0") || path.isAbsolute(clean)) throw new Error(`Unsafe file path in build: ${n}`);
    total += entries[n].length;
  }
  if (total > MAX_BYTES) throw new Error("The build is larger than 300 MB.");
  if (!names.includes("index.html")) throw new Error("The build has no index.html at its top level. Check the build output folder in the workflow.");

  const target = buildDir(siteId, deployId);
  const tmp = `${target}.tmp`;
  await rm(tmp, { recursive: true, force: true });
  for (const n of names) {
    const dest = path.join(tmp, path.posix.normalize(n));
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, entries[n]);
  }
  await rm(target, { recursive: true, force: true });
  await rename(tmp, target);
  return { fileCount: names.length, sizeBytes: total };
}

/** Makes a deploy the live version, marks the previous one as replaced and prunes old builds. */
export async function makeLive(projectId: string, deployId: string) {
  await db.$transaction([
    db.deploy.updateMany({ where: { projectId, status: "LIVE", id: { not: deployId } }, data: { status: "REPLACED" } }),
    db.deploy.update({ where: { id: deployId }, data: { status: "LIVE" } }),
    db.codeProject.update({ where: { id: projectId }, data: { liveDeployId: deployId } }),
  ]);
  await pruneBuilds(projectId);
}

/** Keeps the newest builds on disk (for rollback) and deletes older folders. */
export async function pruneBuilds(projectId: string) {
  const project = await db.codeProject.findUnique({ where: { id: projectId }, include: { deploys: { orderBy: { createdAt: "desc" } } } });
  if (!project) return;
  const withFiles = project.deploys.filter((d) => d.status === "LIVE" || d.status === "REPLACED");
  const keep = new Set(withFiles.slice(0, KEEP_BUILDS).map((d) => d.id));
  if (project.liveDeployId) keep.add(project.liveDeployId);
  for (const d of withFiles) if (!keep.has(d.id)) await rm(buildDir(project.siteId, d.id), { recursive: true, force: true });
}

export function buildOnDisk(siteId: string, deployId: string) {
  return existsSync(path.join(buildDir(siteId, deployId), "index.html"));
}

type RunEvent = {
  action: string;
  workflow_run: {
    id: number;
    name: string;
    head_branch: string;
    head_sha: string;
    html_url: string;
    status: string;
    conclusion: string | null;
    head_commit?: { message?: string; author?: { name?: string } } | null;
    actor?: { login?: string };
  };
  repository: { name: string; owner: { login: string } };
};

/**
 * Handles a GitHub `workflow_run` webhook: records the build when it starts and,
 * when it succeeds, downloads and publishes it. Returns a short note for logs.
 */
export async function handleWorkflowRun(event: RunEvent, install = downloadAndInstall) {
  const run = event.workflow_run;
  const project = await db.codeProject.findFirst({
    where: { repoOwner: { equals: event.repository.owner.login, mode: "insensitive" }, repoName: { equals: event.repository.name, mode: "insensitive" } },
  });
  if (!project) return "unknown repo";
  if (run.name !== DEPLOY_WORKFLOW_NAME) return "other workflow";
  if (run.head_branch !== project.branch) return "other branch";

  const runId = String(run.id);
  const base = {
    projectId: project.id,
    runUrl: run.html_url,
    commitSha: run.head_sha,
    commitMessage: (run.head_commit?.message ?? "").split("\n")[0].slice(0, 200),
    author: (run.head_commit?.author?.name ?? run.actor?.login ?? "").slice(0, 100),
  };
  const deploy = await db.deploy.upsert({ where: { runId }, create: { runId, ...base }, update: {} });

  if (event.action !== "completed") return "building";
  if (deploy.status === "LIVE" || deploy.status === "REPLACED") return "already installed";
  if (run.conclusion !== "success") {
    await db.deploy.update({ where: { id: deploy.id }, data: { status: "FAILED", error: `The build ${run.conclusion ?? "failed"} on GitHub. Open the log for details.`, finishedAt: new Date() } });
    return "build failed";
  }
  try {
    const result = await install(project, deploy.id, runId);
    await db.deploy.update({ where: { id: deploy.id }, data: { ...result, finishedAt: new Date() } });
    await makeLive(project.id, deploy.id);
    return "live";
  } catch (e) {
    await db.deploy.update({ where: { id: deploy.id }, data: { status: "FAILED", error: e instanceof Error ? e.message.slice(0, 500) : "Install failed", finishedAt: new Date() } });
    return "install failed";
  }
}

async function downloadAndInstall(project: { siteId: string; repoOwner: string; repoName: string }, deployId: string, runId: string) {
  const zip = await downloadBuildArtifact(project.repoOwner, project.repoName, runId);
  return installBuild(project.siteId, deployId, zip);
}

/** Removes all stored builds of a site (used when a site or client is deleted). */
export async function removeSiteBuilds(siteId: string) {
  await rm(path.join(codeSitesDir(), siteId), { recursive: true, force: true });
}

// ---------------------------------------------------------------- serving

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json",
  ".map": "application/json", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".avif": "image/avif", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".otf": "font/otf", ".mp4": "video/mp4", ".webm": "video/webm", ".mp3": "audio/mpeg", ".pdf": "application/pdf", ".wasm": "application/wasm",
};

export function contentType(file: string) {
  return TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
}

async function isFile(p: string) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

/**
 * Finds the file to serve for a URL path inside a build:
 * exact file → folder/index.html → path.html → React page links fall back to
 * index.html (200) → otherwise 404.html (404).
 */
export async function resolveBuildFile(root: string, urlPath: string, framework: CodeFramework): Promise<{ file: string; status: number } | null> {
  let rel: string;
  try {
    rel = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  rel = path.posix.normalize("/" + rel).replace(/^\/+/, "");
  if (rel.split("/").some((part) => part === "..")) return null;
  const abs = (r: string) => {
    const p = path.join(root, r);
    return p.startsWith(root + path.sep) || p === root ? p : null;
  };
  const candidates = rel === "" ? ["index.html"] : [rel, path.posix.join(rel, "index.html"), `${rel.replace(/\/$/, "")}.html`];
  for (const c of candidates) {
    const p = abs(c);
    if (p && (await isFile(p))) return { file: p, status: 200 };
  }
  const looksLikeAsset = /\.[a-z0-9]{1,8}$/i.test(rel);
  if (framework === "REACT" && !looksLikeAsset) return { file: path.join(root, "index.html"), status: 200 };
  const notFound = path.join(root, "404.html");
  if (await isFile(notFound)) return { file: notFound, status: 404 };
  return null;
}

// ---------------------------------------------------------------- draft previews

export const PREVIEW_COOKIE = "sp_preview";

function previewSecret() {
  return new TextEncoder().encode(`${process.env.AUTH_SECRET}:code-preview`);
}

/** A 2-hour link token that lets the team preview a draft code website on its own address. */
export async function signPreviewToken(siteId: string) {
  return new SignJWT({ siteId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("2h").sign(previewSecret());
}

export async function verifyPreviewToken(token: string | undefined | null, siteId: string) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, previewSecret());
    return payload.siteId === siteId;
  } catch {
    return false;
  }
}
