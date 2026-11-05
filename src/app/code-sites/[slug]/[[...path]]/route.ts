import { readFile } from "node:fs/promises";
import { buildDir, contentType, PREVIEW_COOKIE, resolveBuildFile, verifyPreviewToken } from "@/lib/code-sites";
import { CODE_SITE_HEADER, codeSiteMarker } from "@/lib/code-site-marker";
import { db } from "@/lib/db";

// Serves the live build of a code website. Only reached through the middleware,
// which rewrites <slug>.onekampus.com/... (or the site's own domain) to here.

type Params = { params: Promise<{ slug: string; path?: string[] }> };

export const dynamic = "force-dynamic";

const PAGE = (title: string, text: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>` +
  `<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a}div{text-align:center;padding:24px}h1{font-size:24px;margin:0 0 8px}p{color:#64748b;margin:0}</style></head>` +
  `<body><div><h1>${title}</h1><p>${text}</p></div></body></html>`;

function html(body: string, status: number) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

async function serve(req: Request, { params }: Params, headOnly: boolean) {
  const { slug, path: parts = [] } = await params;
  // Direct visits to /code-sites/... on the platform host are not allowed.
  if (req.headers.get("x-code-site") !== slug || req.headers.get(CODE_SITE_HEADER) !== codeSiteMarker()) return new Response("Not found", { status: 404 });

  const site = await db.site.findUnique({ where: { slug }, include: { codeProject: true } });
  if (!site?.codeProject) return html(PAGE("Website not found", "This address isn't in use."), 404);
  const project = site.codeProject;

  // Draft sites are visible only with a preview link from the admin panel (kept for 2 hours in a cookie).
  const url = new URL(req.url);
  let setCookie: string | null = null;
  if (site.status !== "PUBLISHED") {
    const fromLink = url.searchParams.get("_preview");
    const cookie = /(?:^|;\s*)sp_preview=([^;]+)/.exec(req.headers.get("cookie") ?? "")?.[1];
    if (fromLink && (await verifyPreviewToken(fromLink, site.id))) {
      setCookie = `${PREVIEW_COOKIE}=${fromLink}; Path=/; Max-Age=7200; HttpOnly; SameSite=Lax${url.protocol === "https:" ? "; Secure" : ""}`;
    } else if (!(await verifyPreviewToken(cookie, site.id))) {
      return html(PAGE("Coming soon", "This website isn't published yet."), 404);
    }
  }

  if (!project.liveDeployId) return html(PAGE("Coming soon", "The first version of this website is still being built."), 503);
  const root = buildDir(site.id, project.liveDeployId);
  const found = await resolveBuildFile(root, parts.join("/"), project.framework);
  if (!found) return html(PAGE("Page not found", "There's nothing at this address."), 404);

  const type = contentType(found.file);
  const isHtml = type.startsWith("text/html");
  // Fingerprinted build assets never change; pages must always be fresh after a deploy.
  const immutable = /\/(?:assets|_next\/static)\//.test(found.file) || /[.-][a-f0-9]{8,}\.(?:js|css|woff2?)$/i.test(found.file);
  const headers = new Headers({
    "Content-Type": type,
    "Cache-Control": isHtml || site.status !== "PUBLISHED" ? "no-cache" : immutable ? "public, max-age=31536000, immutable" : "public, max-age=300",
    "X-Content-Type-Options": "nosniff",
  });
  if (site.status !== "PUBLISHED") headers.set("X-Robots-Tag", "noindex");
  if (setCookie) headers.append("Set-Cookie", setCookie);
  if (headOnly) return new Response(null, { status: found.status, headers });
  return new Response(new Uint8Array(await readFile(found.file)), { status: found.status, headers });
}

export async function GET(req: Request, ctx: Params) {
  return serve(req, ctx, false);
}

export async function HEAD(req: Request, ctx: Params) {
  return serve(req, ctx, true);
}
