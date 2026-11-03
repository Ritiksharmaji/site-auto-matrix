// Captures documentation screenshots for every role, step by step.
//
//   npm run dev                 (in another terminal)
//   npm run docs:screenshots
//
// Sessions are signed in-process from AUTH_SECRET, so no password is typed or
// printed. Temporary records (a demo client, a deactivated user) are removed
// at the end, and the team member's limit is restored after the limit demo.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { SESSION_COOKIE, signSession, type SessionPayload } from "../src/lib/session";

const BASE = process.env.SCREENSHOT_BASE ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "docs", "screenshots");
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const db = new PrismaClient();
const manifest: { file: string; title: string; url: string; finalUrl: string }[] = [];
/** Real visitor details (anything not on a demo domain) are masked so screenshots can be published. */
let masks: [string, string][] = [];

async function loadMasks() {
  const notDemo = { NOT: [{ email: { endsWith: "example.com" } }, { email: { endsWith: ".test" } }] };
  const [enquiries, clients, users] = await Promise.all([
    db.enquiry.findMany({ where: notDemo, select: { name: true, email: true, phone: true } }),
    db.client.findMany({ where: notDemo, select: { contactName: true, email: true, phone: true } }),
    db.user.findMany({ where: notDemo, select: { name: true, email: true } }),
  ]);
  masks = [
    ...enquiries.flatMap((e) => [[e.email ?? "", "visitor@example.com"], [e.phone ?? "", "+91 9XXXX XXXXX"], [e.name, "Demo Visitor"]]),
    ...clients.flatMap((c) => [[c.email, "client@example.com"], [c.phone ?? "", "+91 9XXXX XXXXX"], [c.contactName, "Client Contact"]]),
    ...users.flatMap((u) => [[u.email, "login@example.com"], [u.name, "Client Contact"]]),
  ].filter(([from]) => from.length > 2) as [string, string][];
}

async function applyMasks(page: Page) {
  if (!masks.length) return;
  // No named helpers inside evaluate: tsx would inject a `__name` call the browser doesn't have.
  await page.evaluate((pairs) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (const [from, to] of pairs) n.nodeValue = (n.nodeValue ?? "").split(from).join(to);
    }
    for (const el of Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"))) {
      for (const [from, to] of pairs) el.value = el.value.split(from).join(to);
    }
  }, masks);
}

function siteUrl(slug: string) {
  const u = new URL(BASE);
  return `${u.protocol}//${slug}.${u.host}`;
}

async function shot(page: Page, file: string, title: string, opts: { fullPage?: boolean } = {}) {
  const target = path.join(OUT, file);
  await mkdir(path.dirname(target), { recursive: true });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  // Hide the Next.js dev-mode badge.
  for (const frame of page.frames()) await frame.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
  await applyMasks(page);
  const fullPage = opts.fullPage ?? true;
  const viewport = page.viewportSize()!;
  if (fullPage && new URL(page.url()).host === new URL(BASE).host) {
    // The panel's sidebar is sticky at 100vh; grow the viewport so it spans the whole capture.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: viewport.width, height: Math.max(height, viewport.height) });
    await page.waitForTimeout(300);
    await page.screenshot({ path: target });
    await page.setViewportSize(viewport);
  } else {
    await page.screenshot({ path: target, fullPage });
  }
  manifest.push({ file, title, url: page.url(), finalUrl: page.url() });
  console.log(`  ✓ ${file}`);
}

/** Visits a page the role should NOT reach and records where it ended up. */
async function blocked(page: Page, file: string, title: string, url: string) {
  await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  const landed = new URL(page.url()).pathname;
  const outcome = (await page.locator("text=This page could not be found").count()) > 0 ? "404 Not Found" : `redirected to ${landed}`;
  await page.evaluate(
    ({ url, outcome }) => {
      const b = document.createElement("div");
      b.textContent = `Tried to open ${url} → ${outcome}`;
      b.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;z-index:99999;padding:12px 20px;background:#b91c1c;color:#fff;font:600 15px system-ui;text-align:center";
      document.body.appendChild(b);
    },
    { url, outcome },
  );
  await shot(page, file, title, { fullPage: false });
  manifest[manifest.length - 1].url = BASE + url;
}

async function contextFor(browser: Browser, user: SessionPayload | null, viewport = DESKTOP): Promise<BrowserContext> {
  const ctx = await browser.newContext({ viewport });
  if (user) {
    const token = await signSession(user);
    const host = new URL(BASE).hostname;
    await ctx.addCookies([{ name: SESSION_COOKIE, value: token, domain: host, path: "/", httpOnly: true, sameSite: "Lax" }]);
  }
  return ctx;
}

async function userByEmail(email: string) {
  const u = await db.user.findUniqueOrThrow({ where: { email } });
  return { ...u, session: { userId: u.id, role: u.role } as SessionPayload };
}

async function siteBySlug(slug: string) {
  return db.site.findUniqueOrThrow({ where: { slug } });
}

async function main() {
  const browser = await chromium.launch();
  const admin = await userByEmail("admin@siteplatform.test");
  const staff = await userByEmail("staff@siteplatform.test");
  const schoolClient = await userByEmail("school@siteplatform.test");
  const greenvalley = await siteBySlug("greenvalley");
  const horizon = await siteBySlug("horizon");
  const nexora = await siteBySlug("nexora");
  const tempEmails = ["inactive.demo@siteplatform.test", "owner@sunrise-demo.test"];
  const staffPermsBefore = staff.permissions;
  await loadMasks();
  // One demo enquiry per run: drop the one a previous run left behind.
  await db.enquiry.deleteMany({ where: { email: "priya.parent@example.com" } });

  try {
    // ---------------------------------------------------------------- public
    console.log("Public / visitor");
    {
      const ctx = await contextFor(browser, null);
      const page = await ctx.newPage();

      await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
      await shot(page, "01-public/01-login.png", "Login page", { fullPage: false });

      await page.fill("#email", "admin@siteplatform.test");
      await page.fill("#password", "not-the-right-password");
      await page.click("button[type=submit]");
      await page.getByText("Invalid email or password.").waitFor();
      await shot(page, "01-public/02-login-wrong-password.png", "Login with a wrong password", { fullPage: false });

      // A throwaway deactivated account shows the "deactivated" message.
      const tempPassword = randomBytes(12).toString("hex");
      await db.user.deleteMany({ where: { email: tempEmails[0] } });
      await db.user.create({
        data: { email: tempEmails[0], name: "Inactive Demo", role: "STAFF", passwordHash: await bcrypt.hash(tempPassword, 10), isActive: false },
      });
      await page.fill("#email", tempEmails[0]);
      await page.fill("#password", tempPassword);
      await page.click("button[type=submit]");
      await page.getByText("This account has been deactivated.").waitFor();
      await shot(page, "01-public/03-login-deactivated.png", "Login with a deactivated account", { fullPage: false });
      await db.user.deleteMany({ where: { email: tempEmails[0] } });

      await blocked(page, "01-public/04-anonymous-admin-blocked.png", "Signed-out visitor opening /admin", "/admin");

      const sites = [
        ["greenvalley", "School module – Green Valley Public School"],
        ["horizon", "University module – Horizon University"],
        ["nexora", "Company module – Nexora Solutions"],
        ["urbanthreads", "Shop module – Urban Threads"],
      ] as const;
      let n = 5;
      for (const [slug, title] of sites) {
        await page.goto(siteUrl(slug), { waitUntil: "domcontentloaded" });
        await shot(page, `01-public/${String(n++).padStart(2, "0")}-site-${slug}-desktop.png`, `${title} (desktop)`);
      }
      await ctx.close();

      const mctx = await contextFor(browser, null, MOBILE);
      const m = await mctx.newPage();
      for (const [slug, title] of sites) {
        await m.goto(siteUrl(slug), { waitUntil: "domcontentloaded" });
        await shot(m, `01-public/${String(n++).padStart(2, "0")}-site-${slug}-mobile.png`, `${title} (mobile)`, { fullPage: false });
      }
      await m.goto(siteUrl("greenvalley"), { waitUntil: "domcontentloaded" });
      await m.locator("summary[aria-label='Open menu']").click();
      await shot(m, `01-public/${String(n++).padStart(2, "0")}-site-mobile-menu-open.png`, "Mobile menu open", { fullPage: false });
      await mctx.close();

      // Visitor sends an admission enquiry.
      const vctx = await contextFor(browser, null);
      const v = await vctx.newPage();
      await v.goto(`${siteUrl("greenvalley")}/#admissions`, { waitUntil: "domcontentloaded" });
      const section = v.locator("section#admissions");
      const form = section.locator("form");
      await form.scrollIntoViewIfNeeded();
      await form.locator("input[name=name]").fill("Priya Sharma");
      await form.locator("input[name=phone]").fill("+91 98765 43210");
      await form.locator("input[name=email]").fill("priya.parent@example.com");
      await form.locator("textarea[name=message]").fill("Admission enquiry for Class 6 for the 2027 session.");
      await section.screenshot({ path: path.join(OUT, `01-public/${String(n).padStart(2, "0")}-enquiry-form-filled.png`) });
      manifest.push({ file: `01-public/${String(n++).padStart(2, "0")}-enquiry-form-filled.png`, title: "Visitor fills the enquiry form", url: v.url(), finalUrl: v.url() });
      await form.locator("button[type=submit]").click();
      await v.getByText("Thank you! We have received your details").waitFor();
      await section.screenshot({ path: path.join(OUT, `01-public/${String(n).padStart(2, "0")}-enquiry-sent.png`) });
      manifest.push({ file: `01-public/${String(n++).padStart(2, "0")}-enquiry-sent.png`, title: "Enquiry sent – thank-you message", url: v.url(), finalUrl: v.url() });
      await vctx.close();
    }

    // ---------------------------------------------------------- super admin
    console.log("Super Admin");
    const newEnquiry = await db.enquiry.findFirstOrThrow({ where: { siteId: greenvalley.id }, orderBy: { createdAt: "desc" } });
    {
      const ctx = await contextFor(browser, admin.session);
      const page = await ctx.newPage();
      const go = async (url: string, file: string, title: string, fullPage = true) => {
        await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
        await shot(page, `02-super-admin/${file}`, title, { fullPage });
      };

      await go("/admin", "01-dashboard.png", "Super Admin dashboard");
      await go("/admin/clients", "02-clients.png", "All clients");
      await go("/admin/clients/new", "03-client-new.png", "Create client – empty form");

      // Create a real demo client (removed in cleanup).
      await page.fill("#name", "Sunrise Demo Academy");
      await page.fill("#contactName", "Anita Verma");
      await page.fill("#phone", "+91 90000 12345");
      await page.fill("#email", tempEmails[1]);
      await page.fill("#password", randomBytes(12).toString("hex"));
      await page.getByText("School", { exact: false }).first().click().catch(() => {});
      await shot(page, "02-super-admin/04-client-new-filled.png", "Create client – form filled, module chosen");
      await page.locator("form button[type=submit]").last().click();
      await page.waitForURL((u) => /\/admin\/clients\/[^/]+$/.test(u.pathname) && !u.pathname.endsWith("/new"));
      await shot(page, "02-super-admin/05-client-created.png", "New client created (plan, website, logins)");

      await go(`/admin/clients/${greenvalley.clientId}`, "06-client-detail.png", "Client detail – billing plan, invoices, logins, reassign, delete");
      await go("/admin/sites", "07-sites.png", "All websites");

      await page.goto(`${BASE}/admin/sites/${greenvalley.id}`, { waitUntil: "domcontentloaded" });
      const tabs = ["Sections", "Design", "Content", "Automation", "Settings", "Enquiries", "Analytics"];
      let t = 8;
      for (const label of tabs) {
        await page.getByRole("button", { name: new RegExp(`^${label}`) }).first().click();
        await page.waitForTimeout(600);
        await shot(page, `02-super-admin/${String(t++).padStart(2, "0")}-builder-${label.toLowerCase()}.png`, `Website builder – ${label} tab`);
      }
      await page.getByRole("button", { name: "Sections" }).first().click();
      await page.getByRole("button", { name: "mobile" }).click();
      await page.waitForTimeout(1500);
      await shot(page, `02-super-admin/${String(t++).padStart(2, "0")}-builder-mobile-preview.png`, "Website builder – mobile preview", { fullPage: false });

      await go("/admin/enquiries", `${String(t++).padStart(2, "0")}-enquiries.png`, "All enquiries (CRM)");
      await go("/admin/enquiries?status=NEW", `${String(t++).padStart(2, "0")}-enquiries-filter-new.png`, "Enquiries filtered by status NEW");
      await go(`/admin/enquiries/${newEnquiry.id}`, `${String(t++).padStart(2, "0")}-enquiry-detail.png`, "Enquiry detail – status, assignee, notes, notifications");

      // CSV export: save the header and the demo enquiry as a sample.
      const csv = await page.request.get(`${BASE}/api/enquiries/export`);
      const lines = (await csv.text()).split("\n");
      const sample = [lines[0], ...lines.filter((l) => l.includes("priya.parent@example.com"))];
      await writeFile(path.join(OUT, "02-super-admin/enquiries-export-sample.csv"), sample.join("\n") + "\n");

      await go("/admin/team", `${String(t++).padStart(2, "0")}-team.png`, "Team members");
      await go("/admin/team/new", `${String(t++).padStart(2, "0")}-team-new.png`, "Add team member – limits and permissions");
      await go(`/admin/team/${staff.id}`, `${String(t++).padStart(2, "0")}-team-edit.png`, "Edit team member permissions");
      await go("/admin/activity", `${String(t++).padStart(2, "0")}-activity.png`, "Activity log");
      await go("/admin/billing", `${String(t++).padStart(2, "0")}-billing.png`, "Billing – all invoices");
      await ctx.close();
    }

    // ---------------------------------------------------------- team member
    console.log("Team member");
    {
      const ctx = await contextFor(browser, staff.session);
      const page = await ctx.newPage();
      const go = async (url: string, file: string, title: string) => {
        await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
        await shot(page, `03-team-member/${file}`, title);
      };

      await go("/admin", "01-dashboard.png", "Team member dashboard with their limits");
      await go("/admin/clients", "02-clients-own-only.png", "Clients – only the ones they own");
      await go("/admin/clients/new", "03-client-new-allowed-modules.png", "Create client – only allowed modules");

      // Limit demo: set max clients to the number they already own, try to add one.
      const owned = await db.client.count({ where: { ownerId: staff.id } });
      await db.user.update({ where: { id: staff.id }, data: { permissions: { ...(staffPermsBefore as object), maxClients: owned } } });
      await page.goto(`${BASE}/admin/clients/new`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
      await page.fill("#name", "Limit Test Co");
      await page.fill("#contactName", "Test");
      await page.fill("#email", "limit-test@siteplatform.test");
      await page.fill("#password", randomBytes(12).toString("hex"));
      await page.locator("form button[type=submit]").last().click();
      await page.getByText("You have reached your limit").waitFor();
      await shot(page, "03-team-member/04-client-limit-reached.png", "Client limit reached");
      await db.user.update({ where: { id: staff.id }, data: { permissions: staffPermsBefore ?? {} } });

      await go("/admin/sites", "05-sites-own-only.png", "Websites – only their clients'");
      await page.goto(`${BASE}/admin/sites/${nexora.id}`, { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "Settings" }).click();
      await page.waitForTimeout(500);
      await shot(page, "03-team-member/06-builder-no-publish.png", "Builder – Publish disabled (no permission)");
      await go("/admin/enquiries", "07-enquiries-own-only.png", "Enquiries – only their clients'");

      await blocked(page, "03-team-member/08-blocked-team.png", "Team page blocked", "/admin/team");
      await blocked(page, "03-team-member/09-blocked-activity.png", "Activity log blocked", "/admin/activity");
      await blocked(page, "03-team-member/10-blocked-billing.png", "Billing blocked", "/admin/billing");
      await blocked(page, "03-team-member/11-blocked-other-client.png", "Another owner's client – not found", `/admin/clients/${greenvalley.clientId}`);
      await blocked(page, "03-team-member/12-blocked-other-site.png", "Another owner's website – not found", `/admin/sites/${greenvalley.id}`);
      await ctx.close();
    }

    // --------------------------------------------------------------- client
    console.log("Client");
    {
      const ctx = await contextFor(browser, schoolClient.session);
      const page = await ctx.newPage();
      const go = async (url: string, file: string, title: string) => {
        await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
        await shot(page, `04-client/${file}`, title);
      };

      await go("/portal", "01-portal-home.png", "Client portal home");
      await go(`/portal/sites/${greenvalley.id}`, "02-site-editor-content.png", "Client edits their website content");
      await page.getByRole("button", { name: /enquiries/i }).first().click();
      await page.waitForTimeout(500);
      await shot(page, "04-client/03-site-editor-enquiries.png", "Client – enquiries tab in the editor");
      await go("/portal/enquiries", "04-enquiries.png", "Client – their enquiries");
      await go(`/portal/enquiries/${newEnquiry.id}`, "05-enquiry-detail.png", "Client – enquiry detail and notes");
      await go("/portal/billing", "06-billing.png", "Client – their invoices");

      await blocked(page, "04-client/07-blocked-admin.png", "Admin panel blocked", "/admin");
      await blocked(page, "04-client/08-blocked-other-site.png", "Another client's website – not found", `/portal/sites/${horizon.id}`);
      const otherEnquiry = await db.enquiry.findFirst({ where: { siteId: nexora.id } });
      if (otherEnquiry) await blocked(page, "04-client/09-blocked-other-enquiry.png", "Another client's enquiry – not found", `/portal/enquiries/${otherEnquiry.id}`);
      await ctx.close();

      // Every client gets the same portal, scoped to their own site.
      let c = 10;
      for (const email of ["university@siteplatform.test", "company@siteplatform.test", "shop@siteplatform.test"]) {
        const u = await userByEmail(email);
        const cctx = await contextFor(browser, u.session);
        const p = await cctx.newPage();
        await p.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
        await shot(p, `04-client/${c++}-portal-home-${email.split("@")[0]}.png`, `Portal home – ${email}`, { fullPage: false });
        await cctx.close();
      }
    }
  } finally {
    await db.user.update({ where: { id: staff.id }, data: { permissions: staffPermsBefore ?? {} } });
    const demoClients = await db.client.findMany({ where: { users: { some: { email: tempEmails[1] } } } });
    await db.client.deleteMany({ where: { id: { in: demoClients.map((c) => c.id) } } });
    await db.user.deleteMany({ where: { email: { in: tempEmails } } });
    await db.activity.deleteMany({ where: { details: { contains: '"Sunrise Demo Academy"' } } });
    await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    await browser.close();
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
