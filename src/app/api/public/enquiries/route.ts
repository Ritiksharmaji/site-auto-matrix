import { z } from "zod";
import { verifyPreviewToken } from "@/lib/code-sites";
import { createEnquiry } from "@/lib/enquiries";
import { slugFromHost } from "@/lib/hosts";
import { findSiteByKey } from "@/lib/sites";

// Form submissions from code websites (React / Next.js / HTML built in VS Code).
// The site is identified by the address the visitor is on, so no keys are needed in
// the site's code; requests from other origins are refused.

const schema = z.object({
  formType: z.string().trim().min(1).max(50).default("contact"),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  extra: z.record(z.string().max(80), z.union([z.string(), z.number(), z.boolean()])).optional(),
  company_website: z.string().optional(),
});

// Simple per-IP limit: 10 submissions per 10 minutes.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length > 10;
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host.toLowerCase() !== host) return json({ error: "Forms can only be sent from the website itself." }, 403);

  const site = await findSiteByKey(slugFromHost(host) ?? host.replace(/^www\./, ""));
  if (!site) return json({ error: "This website is not available." }, 404);
  if (site.status !== "PUBLISHED") {
    const cookie = /(?:^|;\s*)sp_preview=([^;]+)/.exec(req.headers.get("cookie") ?? "")?.[1];
    if (!(await verifyPreviewToken(cookie, site.id))) return json({ error: "This website is not published yet." }, 403);
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (limited(ip)) return json({ error: "Too many messages. Please try again in a few minutes." }, 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, 400);
  const d = parsed.data;
  if (d.company_website) return json({ ok: true }); // honeypot
  if (!d.email && !d.phone) return json({ error: "Please give an email or phone number." }, 400);

  const extra = Object.entries(d.extra ?? {})
    .slice(0, 15)
    .map(([label, value]) => ({ label: label.slice(0, 80), value: String(value).trim().slice(0, 500) }))
    .filter((x) => x.value);
  await createEnquiry({ siteId: site.id, formType: d.formType, name: d.name, email: d.email, phone: d.phone, message: d.message, extra });
  return json({ ok: true });
}
