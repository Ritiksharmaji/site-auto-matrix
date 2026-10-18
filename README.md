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
- Demo sites: http://greenvalley.localhost:3000 (School), http://nexora.localhost:3000 (Company)

Seeded logins (password = `SEED_PASSWORD` in `.env`):

| Email | Role |
|---|---|
| admin@siteplatform.test | Super Admin |
| staff@siteplatform.test | Team Member (limited) |
| school@siteplatform.test | Client (Green Valley) |
| company@siteplatform.test | Client (Nexora) |

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
  company.ts          Company module
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

1. Create `src/modules/<name>.ts` exporting a `ModuleDef` — list its sections using the existing kinds (`hero`, `about`, `stats`, `cards`, `list`, `gallery`, `testimonials`, `contact`) and 2–3 design presets.
2. Add it to `MODULES` in `src/modules/registry.ts`.

It immediately appears in the "New client" form, the builder and team permissions. Only add a new section *kind* (in `SiteRenderer.tsx`) when no existing one fits.

## Production notes

- Set `PLATFORM_HOST` to your real domain (e.g. `yourplatform.com`) and point a wildcard DNS record `*.yourplatform.com` to the server.
- Custom domains: client adds a CNAME to the server, then you enter the domain in the website's Settings tab.
