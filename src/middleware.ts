import { NextResponse, type NextRequest } from "next/server";
import { codeSiteSlug } from "@/lib/code-site-lookup";
import { CODE_SITE_HEADER, codeSiteMarker } from "@/lib/code-site-marker";
import { platformHost, slugFromHost } from "@/lib/hosts";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// One deployment serves the platform and every client website:
//   sites.onekampus.com/admin   (localhost:3000/admin)       -> platform admin panel
//   advera.onekampus.com        (advera.localhost:3000)      -> site with slug "advera"
//   www.greenvalley.edu                                      -> site whose customDomain matches
// Builder sites are rewritten to /sites/<slug-or-domain>/…; code websites (built in
// VS Code) are served file by file from /code-sites/<slug>/….

// Runs on Node.js so it can look up which sites are code websites.
export const config = {
  runtime: "nodejs",
  matcher: ["/:path*"],
};

const STATIC_FILE = /\.(?:png|jpg|jpeg|svg|webp|ico|gif|avif|woff2?|css|js|map|txt|json)$/i;

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const { pathname } = req.nextUrl;

  // Our own rewrite of a code-website request (production runs middleware on it again).
  if (pathname.startsWith("/code-sites/") && req.headers.get(CODE_SITE_HEADER) === codeSiteMarker()) return NextResponse.next();

  // API routes (uploads, tracking, public forms, webhooks) are shared by every host.
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Same as Next.js's default trailing-slash redirect, which is turned off for code websites.
  const stripSlash = () => {
    const url = new URL(req.url);
    url.pathname = pathname.replace(/\/+$/, "");
    return NextResponse.redirect(url, 308);
  };

  const platformAliases = new Set([platformHost(), "localhost:3000", "127.0.0.1:3000"]);
  if (!platformAliases.has(host)) {
    // Client subdomain (<slug>.SITE_BASE_DOMAIN), or a client's custom domain.
    const siteKey = slugFromHost(host) ?? host.replace(/^www\./, "");
    const codeSlug = await codeSiteSlug(siteKey).catch(() => null);
    const url = req.nextUrl.clone();
    if (codeSlug) {
      // Every path (including /_next/… of a Next.js export) belongs to the code website.
      url.pathname = `/code-sites/${encodeURIComponent(codeSlug)}${pathname}`;
      const headers = new Headers(req.headers);
      headers.set("x-code-site", codeSlug);
      headers.set(CODE_SITE_HEADER, codeSiteMarker());
      return NextResponse.rewrite(url, { request: { headers } });
    }
    if (pathname.length > 1 && pathname.endsWith("/")) return stripSlash();
    // Builder sites: the platform's own assets (Next.js chunks, blueprint photos) pass through.
    if (pathname.startsWith("/_next/") || STATIC_FILE.test(pathname)) return NextResponse.next();
    url.pathname = `/sites/${encodeURIComponent(siteKey)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Code websites are only ever served on their own address, never on the platform
  // origin (their JavaScript must not run next to the admin panel).
  if (pathname.startsWith("/code-sites")) return new NextResponse("Not found", { status: 404 });

  if (pathname.length > 1 && pathname.endsWith("/")) return stripSlash();

  if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) {
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}
