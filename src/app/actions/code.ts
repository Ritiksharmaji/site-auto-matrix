"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { buildOnDisk, makeLive, signPreviewToken } from "@/lib/code-sites";
import { db } from "@/lib/db";
import { addCollaborator, dispatchDeploy, githubConfig } from "@/lib/github";
import { siteScope } from "@/lib/permissions";
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
