import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blueprintSiteConfig, getBlueprint, SAVED_PREFIX, savedToSource } from "@/blueprints";
import SiteRenderer from "@/components/site/SiteRenderer";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { staffPermissions } from "@/lib/permissions";
import { resolveContent, resolveTheme } from "@/modules/registry";

type Params = { params: Promise<{ key: string }>; searchParams: Promise<{ bare?: string }> };

export const metadata: Metadata = { title: "Blueprint preview", robots: { index: false, follow: false } };

/** Full-page preview of a blueprint (team only). `?bare=1` hides the top bar (used for gallery thumbnails). */
export default async function BlueprintPreview({ params, searchParams }: Params) {
  const user = await requireStaff();
  const key = decodeURIComponent((await params).key);
  const bare = (await searchParams).bare === "1";

  let source;
  let name;
  if (key.startsWith(SAVED_PREFIX)) {
    const row = await db.savedBlueprint.findUnique({ where: { id: key.slice(SAVED_PREFIX.length) } });
    if (!row) notFound();
    source = savedToSource(row);
    name = row.name;
  } else {
    const bp = getBlueprint(key);
    if (!bp) notFound();
    source = bp;
    name = bp.name;
  }
  if (!staffPermissions(user).allowedModules.includes(source.moduleKey)) notFound();

  const cfg = blueprintSiteConfig(source);
  const { brand, sections } = resolveContent(cfg.module, cfg.content);

  return (
    <>
      {!bare && (
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-4 py-2 text-sm text-white">
          <span>
            <span className="text-slate-400">Blueprint preview ·</span> <b>{name}</b>
          </span>
          <span className="flex gap-2">
            <Link href="/admin/blueprints" className="rounded-md px-3 py-1 text-slate-300 hover:bg-white/10">← All blueprints</Link>
            <Link href={`/admin/clients/new?blueprint=${encodeURIComponent(key)}`} className="rounded-md bg-indigo-500 px-3 py-1 font-semibold hover:bg-indigo-400">Use for a new client</Link>
          </span>
        </div>
      )}
      <SiteRenderer
        siteId="blueprint-preview"
        module={cfg.module}
        enabledSections={cfg.enabledSections}
        theme={resolveTheme(cfg.module, cfg.theme)}
        brand={brand}
        sections={sections}
      />
    </>
  );
}
