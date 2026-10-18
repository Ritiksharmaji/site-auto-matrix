import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// One deployment serves the platform and every client website:
//   localhost:3000/admin            -> platform admin panel
//   greenvalley.localhost:3000      -> site with slug "greenvalley"
//   www.greenvalley.edu             -> site whose customDomain matches
// Site requests are rewritten internally to /sites/<slug-or-domain>/...

const PLATFORM_HOST = (process.env.PLATFORM_HOST ?? "localhost:3000").toLowerCase();
const PLATFORM_ALIASES = new Set([PLATFORM_HOST, "localhost:3000", "127.0.0.1:3000"]);

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const { pathname } = req.nextUrl;

  // API routes (uploads, tracking, exports) are shared by every host.
  if (pathname.startsWith("/api/")) return NextResponse.next();

  if (!PLATFORM_ALIASES.has(host)) {
    // Subdomain of the platform host, or a client's custom domain.
    const siteKey = host.endsWith(`.${PLATFORM_HOST}`)
      ? host.slice(0, -(PLATFORM_HOST.length + 1))
      : host.replace(/^www\./, "");
    const url = req.nextUrl.clone();
    url.pathname = `/sites/${encodeURIComponent(siteKey)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

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

export const config = {
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
