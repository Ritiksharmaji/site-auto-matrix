"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { zipSync } from "fflate";
import { buildDir, buildOnDisk, createCodeRepo, installBuild, liveCustomCode, makeLive, removeSiteBuilds, signPreviewToken } from "@/lib/code-sites";
import { forgetCodeSiteLookups } from "@/lib/code-site-lookup";
import { siteBaseDomain } from "@/lib/hosts";
import { exportSite } from "@/lib/site-export";
import { siteToCode, type CodeTarget } from "@/lib/site-to-code";
import { SESSION_COOKIE } from "@/lib/session";
import { db } from "@/lib/db";
import { addCollaborator, commitFiles, createRepo, createWebhook, dispatchDeploy, githubConfig } from "@/lib/github";
import { platformHost } from "@/lib/hosts";
import { siteScope, staffPermissions } from "@/lib/permissions";
import { getModule } from "@/modules/registry";
import { siteUrl } from "@/lib/sites";

export type CodeResult = { ok: boolean; error?: string; url?: string };

/** A code website the signed-in team member manages. */
async function loadCodeSite(siteId: string) {
  const user = await getCurrentUser();
  if (!user || user.role === "CLIENT") throw new Error("Not allowed");
  const site = await db.site.findFirst({ where: { id: siteId, ...siteScope(user) }, include: { codeProject: true } });
  if (!site?.codeProject) throw new Error("Code website not found");
  return { user, site, project: site.codeProject };
}

async function guarded(fn: () => Promise<CodeResult | void>): Promise<CodeResult> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

/** Runs the GitHub build again for the latest commit. */
export async function redeploy(siteId: string) {
  return guarded(async () => {
    const { user, site, project } = await loadCodeSite(siteId);
    if (!githubConfig().ready) throw new Error("GitHub isn't connected on this server.");
    await dispatchDeploy(project.repoOwner, project.repoName, project.branch);
    await logActivity(user.id, "code.redeploy", `${user.name} started a new build of "${site.name}"`);
  });
}

/** Makes an earlier build live again (instant, no rebuild). */
export async function rollback(siteId: string, deployId: string) {
  return guarded(async () => {
    const { user, site, project } = await loadCodeSite(siteId);
    const deploy = await db.deploy.findFirst({ where: { id: deployId, projectId: project.id } });
    if (!deploy || !["LIVE", "REPLACED"].includes(deploy.status)) throw new Error("That build can't be restored.");
    if (!buildOnDisk(site.id, deploy.id)) throw new Error("That build is no longer stored. Only the latest builds are kept.");
    await makeLive(project.id, deploy.id);
    await logActivity(user.id, "code.rollback", `${user.name} rolled "${site.name}" back to ${deploy.commitSha.slice(0, 7)}`);
    revalidatePath(`/admin/sites/${site.id}`);
  });
}

/** Gives a developer push access to the website's GitHub repo. */
export async function inviteDeveloper(siteId: string, username: string) {
  return guarded(async () => {
    const { user, site, project } = await loadCodeSite(siteId);
    const login = username.trim().replace(/^@/, "");
    if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(login)) throw new Error("Enter a GitHub username, e.g. octocat.");
    await addCollaborator(project.repoOwner, project.repoName, login);
    await logActivity(user.id, "code.invite", `${user.name} gave GitHub user ${login} access to "${site.name}"`);
  });
}

/** A 2-hour link to see a draft code website on its own address. */
export async function previewLink(siteId: string) {
  return guarded(async () => {
    const { site } = await loadCodeSite(siteId);
    return { ok: true, url: `${siteUrl(site)}/?_preview=${await signPreviewToken(site.id)}` };
  });
}

/**
 * Adds custom code (CSS, JS, HTML sections) to a builder website: creates its GitHub
 * repo from the "custom" template. The site stays a builder site.
 */
export async function enableCustomCode(siteId: string) {
  return guarded(async () => {
    const user = await getCurrentUser();
    if (!user || user.role === "CLIENT") throw new Error("Not allowed");
    if (!staffPermissions(user).canCreateCodeSites) throw new Error("You are not allowed to add code. Ask the admin for “Can create code websites”.");
    if (!githubConfig().ready) throw new Error("GitHub isn't connected on this server.");
    const site = await db.site.findFirst({ where: { id: siteId, ...siteScope(user) }, include: { codeProject: true } });
    if (!site) throw new Error("Website not found");
    if (site.codeProject) throw new Error("This website already has code.");
    const mod = getModule(site.moduleKey);
    if (!mod) throw new Error("Custom code is for builder websites.");
    let repo;
    try {
      repo = await createCodeRepo({ slug: site.slug, name: site.name, framework: "CUSTOM", url: siteUrl(site), sections: (site.enabledSections as string[]) ?? [] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create the GitHub repository.";
      throw new Error(/already exists|name already/i.test(msg) ? `A GitHub repository named site-${site.slug} already exists.` : msg);
    }
    await db.codeProject.create({ data: { siteId: site.id, framework: "CUSTOM", repoOwner: repo.owner, repoName: repo.repoName, branch: repo.branch, webhookId: repo.webhookId } });
    await logActivity(user.id, "code.custom", `${user.name} added custom code to "${site.name}" (${repo.owner}/${repo.repoName})`);
    revalidatePath(`/admin/sites/${site.id}`);
  });
}

/**
 * Converts a builder website into a code website: exports the current page as
 * index.html + styles.css + onekampus.js + assets/, commits it to the site's repo
 * (created if needed) and makes that version live at once (no "coming soon" gap).
 * The builder data is kept for "Switch back to builder".
 */
export async function convertToCode(siteId: string, target: CodeTarget = "REACT") {
  return guarded(async () => {
    const user = await getCurrentUser();
    if (!user || user.role === "CLIENT") throw new Error("Not allowed");
    if (!staffPermissions(user).canCreateCodeSites) throw new Error("Converting needs the “Can create code websites” permission. Ask the admin.");
    if (!githubConfig().ready) throw new Error("GitHub isn't connected on this server.");
    const site = await db.site.findFirst({ where: { id: siteId, ...siteScope(user) }, include: { codeProject: true } });
    if (!site) throw new Error("Website not found");
    if (!getModule(site.moduleKey)) throw new Error("This website is already a code website.");
    if (target !== "REACT" && target !== "NEXTJS") throw new Error("Choose React or Next.js.");

    // 1. Export the page exactly as visitors see it (drafts are read with the user's session).
    const session = (await cookies()).get(SESSION_COOKIE)?.value;
    const custom = await liveCustomCode(site.id);
    const customJs = custom?.hasJs ? await readFile(path.join(buildDir(site.id, custom.deployId), "custom.js"), "utf8") : null;
    const url = siteUrl(site);
    // The page as plain files (published at once) and as a React / Next.js project (the repo).
    const exported = await exportSite({ host: `${site.slug}.${siteBaseDomain()}`, siteName: site.name, url, cookie: session ? `${SESSION_COOKIE}=${session}` : undefined, customJs });
    const files = await siteToCode(exported, target, { name: site.name, url });

    // 2. Commit it: into the existing custom-code repo, or a new one.
    let project = site.codeProject;
    if (!project) {
      let repo;
      try {
        repo = await createRepo(`site-${site.slug}`, `${site.name}: website hosted by oneKampus (${url})`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        throw new Error(/already exists|name already/i.test(msg) ? `A GitHub repository named site-${site.slug} already exists.` : msg || "Could not create the GitHub repository.");
      }
      const webhookId = await createWebhook(repo.owner.login, repo.name, `https://${platformHost()}/api/github/webhook`);
      project = await db.codeProject.create({
        data: { siteId: site.id, framework: target, repoOwner: repo.owner.login, repoName: repo.name, branch: repo.default_branch || "main", webhookId, previousModuleKey: site.moduleKey },
      });
    }
    const commitSha = await commitFiles(project.repoOwner, project.repoName, project.branch, files, "Converted from the website builder");
    if (site.codeProject) {
      // Earlier custom-code versions can't be served as a code website: clear them.
      await db.deploy.deleteMany({ where: { projectId: project.id } });
      await db.codeProject.update({ where: { id: project.id }, data: { liveDeployId: null } });
      await removeSiteBuilds(site.id);
    }

    // 3. Publish the identical plain-file version now; GitHub's build of the React / Next.js
    //    project (same look) replaces it in 1–2 minutes.
    const zip = zipSync(Object.fromEntries(exported.map((f) => [f.path, f.encoding === "base64" ? new Uint8Array(Buffer.from(f.content, "base64")) : new TextEncoder().encode(f.content)])));
    const deploy = await db.deploy.create({
      data: { projectId: project.id, runId: `convert-${site.id}-${Date.now()}`, runUrl: `https://github.com/${project.repoOwner}/${project.repoName}/commit/${commitSha}`, commitSha, commitMessage: "Converted from the website builder", author: user.name },
    });
    await db.deploy.update({ where: { id: deploy.id }, data: { ...(await installBuild(site.id, deploy.id, zip, "HTML")), finishedAt: new Date() } });
    await db.$transaction([
      db.codeProject.update({ where: { id: project.id }, data: { framework: target, previousModuleKey: site.moduleKey } }),
      db.site.update({ where: { id: site.id }, data: { moduleKey: "code" } }),
    ]);
    await makeLive(project.id, deploy.id);
    forgetCodeSiteLookups();
    await logActivity(user.id, "code.convert", `${user.name} converted "${site.name}" to a ${target === "NEXTJS" ? "Next.js" : "React"} code website (${project.repoOwner}/${project.repoName})`);
    revalidatePath(`/admin/sites/${site.id}`);
  });
}

/** Undoes "Convert to code website": the builder version (kept unchanged) becomes live again. */
export async function switchBackToBuilder(siteId: string) {
  return guarded(async () => {
    const { user, site, project } = await loadCodeSite(siteId);
    if (!project.previousModuleKey || !getModule(project.previousModuleKey)) throw new Error("This website wasn't converted from the builder.");
    await db.$transaction([
      db.site.update({ where: { id: site.id }, data: { moduleKey: project.previousModuleKey } }),
      db.codeProject.delete({ where: { id: project.id } }),
    ]);
    await removeSiteBuilds(site.id);
    forgetCodeSiteLookups();
    await logActivity(user.id, "code.unconvert", `${user.name} switched "${site.name}" back to the website builder (repo ${project.repoOwner}/${project.repoName} kept on GitHub)`);
    revalidatePath(`/admin/sites/${site.id}`);
  });
}
