import { findSiteByKey, publicOrigin } from "@/lib/sites";

/** Per-site sitemap, served at <site>/sitemap.xml via the middleware rewrite. */
export async function GET(req: Request, { params }: { params: Promise<{ site: string }> }) {
  const site = await findSiteByKey((await params).site);
  if (!site || site.status !== "PUBLISHED") return new Response("Not found", { status: 404 });
  const origin = publicOrigin(req);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${origin}/</loc><lastmod>${site.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
