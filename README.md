# Site Platform

One Next.js app that creates and hosts many websites (schools, companies, …) from reusable **modules**, with an admin panel for you and your team and a portal for clients.

## Run locally

```bash
npm install
npm run db:migrate   # creates tables in the database from DATABASE_URL
npm run db:seed      # demo accounts + 2 demo websites
npm run dev
```

- Admin panel / client portal: http://localhost:3000
- Demo sites: http://greenvalley.localhost:3000 (School), http://horizon.localhost:3000 (University), http://nexora.localhost:3000 (Company), http://urbanthreads.localhost:3000 (Shop)

Seeded logins (password = `SEED_PASSWORD` in `.env`):

| Email | Role |
|---|---|
| admin@siteplatform.test | Super Admin |
| staff@siteplatform.test | Team Member (limited) |
| school@siteplatform.test | Client (Green Valley) |
| company@siteplatform.test | Client (Nexora) |
| university@siteplatform.test | Client (Horizon University) |
| shop@siteplatform.test | Client (Urban Threads) |

## Roles

- **Super Admin** – sees everything: all clients, team performance, activity log. Creates team members and sets their limits (max clients, can publish, can delete, allowed modules). Can reassign clients.
- **Team Member** – creates and manages *their own* clients and websites within their limits. No platform totals, no team page.
- **Client** – signs in to the portal and edits content of *their own* websites, and reads their enquiries. Cannot change sections, design or settings.

## How it fits together

```
src/modules/          Module definitions (pure config)
  types.ts            SectionDef / ModuleDef / Theme types
  shared.ts           Reusable field sets, fonts, style options
  school.ts           School module: sections + design presets
  university.ts       University / College module
  company.ts          Company module
  shop.ts             Shop module (product catalogue, WhatsApp ordering)
  registry.ts         Register modules here; defaults/merging helpers
src/components/site/  SiteRenderer: turns module + theme + content into a website
src/components/builder/ Builder UI (sections, design, content, settings, enquiries)
src/app/admin/        Admin panel (super admin + team)
src/app/portal/       Client portal
src/app/sites/[site]/ Public website route
src/middleware.ts     Routes <slug>.PLATFORM_HOST and custom domains to /sites/<key>
prisma/schema.prisma  Users, Clients, Sites (JSONB theme/content), Enquiries, Activity
```

### Adding a new module (e.g. Shop, Hospital)

1. Create `src/modules/<name>.ts` exporting a `ModuleDef` — list its sections using the existing kinds (`hero`, `about`, `stats`, `cards`, `list`, `gallery`, `testimonials`, `products`, `contact`) and 2–3 design presets.
2. Add it to `MODULES` in `src/modules/registry.ts`.

It immediately appears in the "New client" form, the builder and team permissions. Only add a new section *kind* (in `SiteRenderer.tsx`) when no existing one fits.

## Business automation (Phase 2)

- **Enquiry CRM** – `/admin/enquiries` (team) and `/portal/enquiries` (clients): status pipeline New → Contacted → Converted / Lost, notes, assignment, CSV export.
- **Alerts & auto-reply** – each website's *Automation* tab controls who is emailed / WhatsApp'd on a new enquiry and the visitor's thank-you email. Every message is recorded in the `Notification` table and shown on the enquiry.
  - Email: set `SMTP_*` in `.env`. Without `SMTP_HOST`, messages are recorded as "not configured" instead of sent.
  - WhatsApp: set `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` (Meta WhatsApp Cloud API). Use an approved template (`WHATSAPP_TEMPLATE`) for alerts outside the 24-hour window.
- **Image uploads** – "Upload" button on every image field. PNG/JPG/WEBP/GIF up to 5 MB, stored in `UPLOAD_DIR` (default `storage/uploads`) and served from `/api/uploads/<id>`.

## Growth features (Phase 3)

- **Modules**: School, University / College, Company, Shop. Shop products have prices, categories and an "Order on WhatsApp" button; any site with a WhatsApp number in Brand settings gets a floating chat button.
- **SEO**: page title/description, Open Graph + Twitter cards, canonical URL and Organization structured data for every site; `/sitemap.xml` and `/robots.txt` per site (draft sites are `noindex`).
- **Analytics**: anonymous page views (no cookies, no IP storage, daily-rotating visitor hash) via `/api/track`. See the *Analytics* tab in the builder, totals on the dashboard and in the client portal. Builder previews and bots are not counted.
- **Billing (super admin only)**: set a plan per client (fee, monthly / quarterly / yearly, next due date) on the client page. `/admin/billing` shows recurring revenue, outstanding and overdue amounts, and lets you mark invoices paid, send reminders or cancel. Clients see their invoices under *Billing* in the portal.
  - Daily job: call `GET /api/cron/billing` with `Authorization: Bearer $CRON_SECRET`. It creates invoices due within 7 days and emails reminders for invoices due within 3 days or overdue (at most every 3 days).

## Production notes

- Set `PLATFORM_HOST` to your real domain (e.g. `yourplatform.com`) and point a wildcard DNS record `*.yourplatform.com` to the server.
- Custom domains: client adds a CNAME to the server, then you enter the domain in the website's Settings tab.
