import "server-only";
import { buildOnDisk, FRAMEWORKS } from "./code-sites";
import { db } from "./db";
import { cloneUrl, githubConfig, vscodeCloneLink } from "./github";

/** Everything the Code tab shows for a site's code project (code website or custom code), or null. */
export async function codeTabData(siteId: string) {
  const project = await db.codeProject.findUnique({ where: { siteId }, include: { deploys: { orderBy: { createdAt: "desc" }, take: 20 } } });
  if (!project) return null;
  const fw = FRAMEWORKS.find((f) => f.value === project.framework)!;
  return {
    code: {
      framework: project.framework,
      frameworkLabel: fw.label,
      repo: `${project.repoOwner}/${project.repoName}`,
      repoUrl: `https://github.com/${project.repoOwner}/${project.repoName}`,
      cloneUrl: cloneUrl(project.repoOwner, project.repoName),
      vscodeUrl: vscodeCloneLink(project.repoOwner, project.repoName),
      branch: project.branch,
      githubReady: githubConfig().ready,
      convertedFrom: project.previousModuleKey,
      devCommand: project.framework === "HTML" ? "npx serve ." : project.framework === "CUSTOM" ? "" : "npm install && npm run dev",
    },
    deploys: project.deploys.map((d) => ({
      id: d.id,
      status: d.status,
      commitSha: d.commitSha,
      commitMessage: d.commitMessage,
      author: d.author,
      runUrl: d.runUrl,
      error: d.error,
      createdAt: d.createdAt.toISOString(),
      finishedAt: d.finishedAt?.toISOString() ?? null,
      onDisk: buildOnDisk(siteId, d.id),
    })),
  };
}
