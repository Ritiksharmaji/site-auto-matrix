import { createHash } from "node:crypto";
import { db } from "@/lib/db";

// Privacy-friendly page view counter for client websites. No cookies and no IP
// storage: visitors are counted with a hash of IP + user agent + date + secret
// that changes every day.

const BOT = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse/i;

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT.test(ua)) return new Response(null, { status: 204 });

  let body: { siteId?: unknown; path?: unknown; referrer?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const siteId = typeof body.siteId === "string" ? body.siteId : "";
  const site = siteId ? await db.site.findUnique({ where: { id: siteId }, select: { status: true } }) : null;
  if (!site || site.status !== "PUBLISHED") return new Response(null, { status: 204 });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const day = new Date().toISOString().slice(0, 10);
  const visitorHash = createHash("sha256").update(`${ip}|${ua}|${day}|${process.env.AUTH_SECRET}`).digest("hex").slice(0, 32);
  const path = typeof body.path === "string" ? body.path.slice(0, 300) : "/";
  let referrer: string | null = null;
  if (typeof body.referrer === "string" && body.referrer) {
    try {
      referrer = new URL(body.referrer).hostname.slice(0, 200);
    } catch {}
  }

  await db.pageView.create({ data: { siteId, path, referrer, visitorHash } });
  return new Response(null, { status: 204 });
}
