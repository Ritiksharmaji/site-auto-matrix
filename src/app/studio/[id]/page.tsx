import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CodeStudio from "@/components/studio/CodeStudio";
import { requireStaff } from "@/lib/auth";
import { FRAMEWORKS, signPreviewToken } from "@/lib/code-sites";
import { db } from "@/lib/db";
import { githubConfig, vscodeCloneLink } from "@/lib/github";
import { siteScope } from "@/lib/permissions";
import { siteUrl } from "@/lib/sites";

export const metadata: Metadata = { title: "Code Studio", robots: { index: false, follow: false } };

/** Code Studio: VS Code's editor in the browser for a code website (same repo as "Open in VS Code"). */
export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const { id } = await params;
  const site = await db.site.findFirst({ where: { id, ...siteScope(user) }, include: { codeProject: true } });
  if (!site?.codeProject) notFound();
  const project = site.codeProject;

  if (!githubConfig().ready) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <h1 className="text-lg font-semibold text-slate-900">GitHub isn&apos;t connected</h1>
          <p className="mt-2 text-sm text-slate-600">Code Studio edits the website&apos;s GitHub repository. Connect GitHub on the server first (docs/DEPLOYMENT.md → Code websites).</p>
          <Link href={`/admin/sites/${site.id}`} className="btn-secondary mt-4 inline-block">← Back</Link>
        </div>
      </main>
    );
  }

  const url = siteUrl(site);
  const fw = FRAMEWORKS.find((f) => f.value === project.framework)!;
  return (
    <CodeStudio
      site={{ id: site.id, name: site.name, slug: site.slug, status: site.status }}
      framework={project.framework}
      frameworkLabel={fw.label}
      repo={`${project.repoOwner}/${project.repoName}`}
      repoUrl={`https://github.com/${project.repoOwner}/${project.repoName}`}
      branch={project.branch}
      siteOrigin={url}
      liveUrl={`${url}/?_preview=${await signPreviewToken(site.id)}`}
      vscodeUrl={vscodeCloneLink(project.repoOwner, project.repoName)}
    />
  );
}
