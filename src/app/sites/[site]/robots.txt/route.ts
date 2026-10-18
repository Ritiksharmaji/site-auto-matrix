import { findSiteByKey, publicOrigin } from "@/lib/sites";

export async function GET(req: Request, { params }: { params: Promise<{ site: string }> }) {
  const site = await findSiteByKey((await params).site);
  const live = site?.status === "PUBLISHED";
  const body = live ? `User-agent: *\nAllow: /\n\nSitemap: ${publicOrigin(req)}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
