import { db } from "@/lib/db";
import { platformHost, slugFromHost } from "@/lib/hosts";

/**
 * Caddy "on-demand TLS" check: Caddy calls this before requesting an HTTPS
 * certificate for a host it has never seen. 200 = issue, anything else = refuse.
 * Allowed: the platform host, <slug>.SITE_BASE_DOMAIN for an existing site, and
 * a site's custom domain (with or without www).
 */
export async function GET(req: Request) {
  const domain = (new URL(req.url).searchParams.get("domain") ?? "").trim().toLowerCase();
  if (!domain) return new Response("missing domain", { status: 400 });
  if (domain === platformHost()) return new Response("ok");

  const slug = slugFromHost(domain);
  const bare = domain.replace(/^www\./, "");
  const site = await db.site.findFirst({
    where: { OR: [...(slug ? [{ slug }] : []), { customDomain: domain }, { customDomain: bare }, { customDomain: `www.${bare}` }] },
    select: { id: true },
  });
  return site ? new Response("ok") : new Response("unknown domain", { status: 404 });
}
