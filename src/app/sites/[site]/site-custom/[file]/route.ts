import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildDir, liveCustomCode } from "@/lib/code-sites";
import { findSiteByKey } from "@/lib/sites";

// custom.js of a builder site's custom code, served on the site's own address
// (<slug>.onekampus.com/site-custom/script) through the middleware rewrite.

export async function GET(req: Request, { params }: { params: Promise<{ site: string; file: string }> }) {
  const { site: key, file } = await params;
  if (file !== "script") return new Response("Not found", { status: 404 });
  const site = await findSiteByKey(key);
  const custom = site ? await liveCustomCode(site.id) : null;
  if (!site || !custom?.hasJs) return new Response("Not found", { status: 404 });
  const body = await readFile(path.join(buildDir(site.id, custom.deployId), "custom.js"));
  const versioned = new URL(req.url).searchParams.get("v") === custom.deployId;
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": versioned ? "public, max-age=31536000, immutable" : "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
