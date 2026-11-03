# Application Flow — Site Platform

This guide explains, step by step, how the platform works: who uses it, what each person does, and what happens inside the application at every step.

- Every step has a **real screenshot** of the running app. All screenshots are in [`docs/screenshots/`](./screenshots).
- For the technical architecture, see [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md).
- **Roles and permissions, proven screen by screen:** [§17](#17-roles-and-permissions-proven-with-screenshots).

---

## 1. The big picture

One application does three jobs at the same time:

1. **Admin panel** (`/admin`) — you and your team create clients and build their websites.
2. **Client portal** (`/portal`) — each client logs in to update *their own* website and see their enquiries and invoices.
3. **Client websites** — every client website is served from the same app, on its own address (e.g. `greenvalley.yourplatform.com` or `www.greenvalley.edu`).

```mermaid
flowchart LR
    subgraph People
        SA[Super Admin<br/>you]
        TM[Team Member]
        CL[Client]
        VI[Website visitor]
    end

    subgraph App[Site Platform - one Next.js app]
        ADM[Admin panel<br/>/admin]
        POR[Client portal<br/>/portal]
        SITES[Client websites<br/>slug.yourplatform.com<br/>or custom domain]
        API[APIs<br/>uploads · tracking · export · cron]
    end

    DB[(PostgreSQL)]
    EXT[Email SMTP<br/>WhatsApp Cloud API]

    SA --> ADM
    TM --> ADM
    CL --> POR
    VI --> SITES
    ADM --> DB
    POR --> DB
    SITES --> DB
    API --> DB
    SITES -- enquiry --> API
    API --> EXT
```

**Key idea:** a website is not code — it is a *configuration* stored in the database:

```
Website = module (School / University / Company / Shop)
        + enabled sections (which parts are switched on)
        + theme (colours, fonts, layout style)
        + content (text, images, lists)
        + automation settings (who gets alerts, auto-reply text)
```

The same rendering code reads that configuration and produces a completely different website for each client.

---

## 2. Roles and what each can do

| | Super Admin (you) | Team Member | Client |
|---|---|---|---|
| Logs in to | `/admin` | `/admin` | `/portal` |
| Sees clients | **All** clients | Only clients **they created** | Only **their own** business |
| Dashboard | Platform totals, team performance, activity log | Their own totals + their limits | Their websites, views, new enquiries |
| Create clients | ✅ unlimited | ✅ up to their **max clients** limit | ❌ |
| Modules allowed | All | Only modules you allow | — |
| Sections / design / settings | ✅ | ✅ | ❌ |
| Edit website content | ✅ | ✅ | ✅ (own sites only) |
| Publish website | ✅ | Only if you allow **Can publish** | ❌ |
| Delete clients | ✅ | Only if you allow **Can delete** | ❌ |
| Automation settings | ✅ | ✅ | ❌ |
| Enquiries | All | Their clients' | Their own |
| Assign enquiries | To anyone on the team | Only to themselves | ❌ |
| Team page, activity log | ✅ | ❌ | ❌ |
| Billing | ✅ (only role) | ❌ | Views own invoices |

How the limits are enforced: every database query goes through a **scope filter** (`clientScope` / `siteScope` in `src/lib/permissions.ts`). A team member's query automatically becomes "clients where owner = me"; a client's becomes "sites where client = my business". So even if someone types another ID into the URL, they get *404 Not found*.

Each row of this table is shown with screenshots in [§17](#17-roles-and-permissions-proven-with-screenshots).

---

## 3. First-time setup

```mermaid
flowchart TD
    A[npm install] --> B[Create .env<br/>DATABASE_URL, AUTH_SECRET,<br/>PLATFORM_HOST, SEED_PASSWORD]
    B --> C[npm run db:migrate<br/>creates all tables]
    C --> D[npm run db:seed<br/>demo accounts + 4 demo websites]
    D --> E[npm run dev]
    E --> F[Open http://localhost:3000<br/>sign in as admin@siteplatform.test]
```

Optional settings in `.env` (see `.env.example`):
- `SMTP_*` → real emails are sent (otherwise they are only recorded).
- `WHATSAPP_*` → real WhatsApp alerts (otherwise only recorded).
- `CRON_SECRET` → protects the daily billing job.
- `UPLOAD_DIR` → where uploaded images are stored.

---

## 4. Login flow

```mermaid
sequenceDiagram
    participant U as User
    participant L as /login page
    participant A as login action
    participant DB as Database
    participant M as Middleware

    U->>L: Enter email + password
    L->>A: Submit
    A->>DB: Find user by email
    A->>A: Check password (bcrypt) and isActive
    alt wrong password
        A-->>L: "Invalid email or password."
    else account deactivated
        A-->>L: "This account has been deactivated."
    else OK
        A->>A: Create signed session token (JWT, 7 days)
        A-->>U: Set httpOnly cookie, record "login" in activity log
        A-->>U: Redirect: Client → /portal, others → /admin
    end
    U->>M: Later requests to /admin or /portal
    M->>M: Verify cookie signature
    M-->>U: No valid cookie → redirect to /login
```

Every page also re-loads the user from the database, so if you **deactivate** a team member their next click logs them out.

**Step 1: open `/login`.**

![Login page: the same page for every role](screenshots/01-public/01-login.png)

*Login page: the same page for every role*

**Step 2a: wrong password.** The message doesn't say whether the email exists.

![Wrong password](screenshots/01-public/02-login-wrong-password.png)

*Wrong password*

**Step 2b: deactivated account.** The password was right, but the Super Admin switched this person off.

![Deactivated account](screenshots/01-public/03-login-deactivated.png)

*Deactivated account*

**Step 2c: not signed in.** Opening `/admin` without signing in sends you back to `/login`.

![Signed-out visitor is redirected to the login page](screenshots/01-public/04-anonymous-admin-blocked.png)

*Signed-out visitor is redirected to the login page*

**Step 3: signed in.** Super Admin and Team Member land on `/admin`; a Client lands on `/portal`.

![Super Admin dashboard: platform totals, team performance, recent activity](screenshots/02-super-admin/01-dashboard.png)

*Super Admin dashboard: platform totals, team performance, recent activity*

![Team Member dashboard: only their own numbers, with their limits shown](screenshots/03-team-member/01-dashboard.png)

*Team Member dashboard: only their own numbers, with their limits shown*

![Client portal home: only their own website](screenshots/04-client/01-portal-home.png)

*Client portal home: only their own website*

---

## 5. Super Admin: building your team

1. Go to **Team → + Add member**.
2. Enter name, email, password and role:
   - **Team Member** (limited) or **Super Admin** (full access).
3. For a team member, set **Access limits**:
   - Maximum clients they can create
   - Can publish websites (yes/no)
   - Can delete clients (yes/no)
   - Which modules they may use (School, University, Company, Shop)
4. Save. They can now sign in at `/admin`.

Later you can open the member to change limits, reset the password, see their clients, or **Deactivate** them. You can also move a client to another member from the client page (**Assigned team member**).

![Step 1: Team page, listing every member with clients used out of their limit and publish rights](screenshots/02-super-admin/19-team.png)

*Step 1: Team page, listing every member with clients used out of their limit and publish rights*

![Step 2: Add member, with role, login details and access limits](screenshots/02-super-admin/20-team-new.png)

*Step 2: Add member, with role, login details and access limits*

![Step 3: Edit a member: change limits, reset password, deactivate](screenshots/02-super-admin/21-team-edit.png)

*Step 3: Edit a member: change limits, reset password, deactivate*

---

## 6. Creating a client and their website

Done by the Super Admin or a Team Member: **Clients → + New client**. One form, three parts:

```mermaid
flowchart TD
    A[1. Business details<br/>name, contact person, phone] --> B[2. Client login<br/>email + password]
    B --> C[3. Website<br/>choose module + starting design + web address]
    C --> D{Checks}
    D -->|Team member over max clients| X1[Error: limit reached]
    D -->|Module not allowed| X2[Error: not allowed]
    D -->|Web address taken / reserved| X3[Error]
    D -->|Email already used| X4[Error]
    D -->|All OK| E[Save in one transaction]
    E --> E1[Client record<br/>owner = the person who created it]
    E --> E2[Client login user<br/>role = CLIENT]
    E --> E3[Website record<br/>status = DRAFT<br/>default sections, preset theme,<br/>module's sample content]
    E1 & E2 & E3 --> F[Activity log entry]
    F --> G[Open the client page]
```

The new website already looks complete because each module ships with sample text for every section. It stays a **Draft** (not public) until it is published.

From the client page you can also:
- **Add another website** for the same client.
- **Add another login** for the client, or reset a client's password.
- Edit details and internal notes.
- (Super Admin) set the **billing plan** and see invoices.
- Delete the client (if permitted).

**Step 1: Clients list.**

![All clients (Super Admin view)](screenshots/02-super-admin/02-clients.png)

*All clients (Super Admin view)*

**Step 2: New client, empty form.** The Super Admin sees all 4 modules.

![New client form](screenshots/02-super-admin/03-client-new.png)

*New client form*

**Step 3: Fill in the three parts and choose a module and starting design.**

![Form filled: business, login, module, design, web address](screenshots/02-super-admin/04-client-new-filled.png)

*Form filled: business, login, module, design, web address*

**Step 4: Saved.** You land on the new client's page, with a Draft website, the login, the billing plan and the delete option.

![New client created](screenshots/02-super-admin/05-client-created.png)

*New client created*

**Step 5: An existing client** with invoices and a live website.

![Client detail: websites, invoices, logins, billing plan, assigned member, delete](screenshots/02-super-admin/06-client-detail.png)

*Client detail: websites, invoices, logins, billing plan, assigned member, delete*

**Team member view of the same steps:**

![A team member only sees the modules the admin allowed (here: School and Company)](screenshots/03-team-member/03-client-new-allowed-modules.png)

*A team member only sees the modules the admin allowed (here: School and Company)*

![Once a team member reaches their max-clients limit, creating another client is refused](screenshots/03-team-member/04-client-limit-reached.png)

*Once a team member reaches their max-clients limit, creating another client is refused*

---

## 7. Building the website (the builder)

Open **Websites → (a site)**. The left side has tabs, the right side shows a **live preview** (desktop or mobile) that reloads after each save.

```mermaid
flowchart LR
    S[Sections] --> D[Design] --> C[Content] --> AU[Automation] --> ST[Settings & Publish]
    ST --> LIVE((Website live))
    LIVE -.-> EN[Enquiries tab]
    LIVE -.-> AN[Analytics tab]
```

Every website, with its module, status and enquiries:

![Websites list](screenshots/02-super-admin/07-sites.png)

*Websites list*

### Step 1 — Sections
Switch parts of the website on or off, and use **↑ ↓** to set the order they appear in. Each website keeps its own order, so one Company site can show Services before About while another shows About first. Each module has its own list, for example:

| Module | Sections |
|---|---|
| School | Hero, About, Highlights, Academics, Admissions form, Faculty, Notices, Events, Gallery, Parent testimonials, Contact |
| University | Hero, About, Key numbers, Departments, Programs, Admissions form, Research, Placements, News & events, Campus gallery, Alumni, Contact |
| Company | Hero, About, Key numbers, Services, Portfolio, Team, Testimonials, **Why choose us**, **FAQs**, Careers, Contact / quote form |
| Shop | Hero, Offers, Products, About, Gallery, Customer reviews, Contact |

Sections marked *required* (e.g. Hero, Contact) cannot be switched off.

![Builder, Sections tab: switch parts on and off, with live preview on the right](screenshots/02-super-admin/08-builder-sections.png)

*Builder, Sections tab: switch parts on and off, with live preview on the right*

### Step 2 — Design
- Pick a **preset** (each module has 3), or customise:
- **Colours**: primary, accent, background, section background, text
- **Fonts**: heading font and body font (10 Google Fonts)
- **Layout style**: Classic (solid header, bordered cards), Modern (gradient hero, shadows), Minimal (white space, thin lines)
- **Hero layout**: centered, or text + image side by side
- **Corners**: square → pill

The design is saved as a small JSON "theme". The website turns it into CSS variables, so one change restyles the whole site.

![Builder, Design tab: presets, colours, fonts, style, hero layout, corners](screenshots/02-super-admin/09-builder-design.png)

*Builder, Design tab: presets, colours, fonts, style, hero layout, corners*

### Step 3 — Content
A form is generated automatically from the module definition:
- **Brand & contact details**: site name, tagline, logo, phone, email, WhatsApp number, address, footer text, Google search description.
- One panel per enabled section with its fields (title, text, images…).
- Repeating items (courses, teachers, products, notices, FAQs…) can be **added, removed and re-ordered**.
- Cards (services, programs…) can have a banner **image**, a small square **icon** (good for "Why choose us" points) and an optional **button link**, for example "Visit site →".
- Image fields accept a URL or an **Upload** button (PNG/JPG/WEBP/GIF, max 5 MB).

On save, the server keeps only the fields the module knows about (anything else is dropped), so stored content always matches the module.

![Builder, Content tab: brand details, then one panel per section](screenshots/02-super-admin/10-builder-content.png)

*Builder, Content tab: brand details, then one panel per section*

### Step 4 — Automation
What happens when someone fills a form on this website:
- Email the client ✅/❌
- Email the account manager (team member) ✅/❌
- Extra email addresses
- WhatsApp alert + number ✅/❌
- Auto-reply email to the visitor ✅/❌ with editable subject and message (`{{name}}`, `{{site}}` placeholders)

![Builder, Automation tab](screenshots/02-super-admin/11-builder-automation.png)

*Builder, Automation tab*

### Step 5 — Settings & Publish
- Website name, web address (subdomain), optional **custom domain**.
- **Publish** makes the website public (only Super Admin, or team members with *Can publish*). **Unpublish** turns it back into a draft.

![Builder, Settings tab (Super Admin): Publish/Unpublish is available](screenshots/02-super-admin/12-builder-settings.png)

*Builder, Settings tab (Super Admin): Publish/Unpublish is available*

![Same tab for a team member without Can publish: the button is disabled](screenshots/03-team-member/06-builder-no-publish.png)

*Same tab for a team member without Can publish: the button is disabled*

**Preview on mobile:** the Mobile switch above the preview shows the site at phone width.

![Builder with mobile preview](screenshots/02-super-admin/15-builder-mobile-preview.png)

*Builder with mobile preview*

---

## 8. How a website is served to a visitor

```mermaid
flowchart TD
    R[Visitor opens<br/>greenvalley.yourplatform.com<br/>or www.greenvalley.edu] --> M{Middleware<br/>checks the host}
    M -->|path starts with /api/| API[Shared API routes]
    M -->|platform host itself| P[Admin / portal / login pages]
    M -->|subdomain or custom domain| RW[Rewrite internally to<br/>/sites/greenvalley]
    RW --> F[Find site by slug<br/>or custom domain]
    F -->|not found| NF[404]
    F -->|DRAFT and visitor is not<br/>the team or the client| NF
    F -->|PUBLISHED, or draft preview| R2[Build render data<br/>module + sections + theme + content<br/>missing values filled from module defaults]
    R2 --> H[SiteRenderer draws:<br/>header + menu, sections in module order,<br/>forms, footer, WhatsApp button]
    H --> SEO[Adds SEO: title, description,<br/>share image, structured data]
    H --> T[Page view tracker<br/>live sites only]
```

Extra per-site addresses:
- `/sitemap.xml` and `/robots.txt` — generated per site (drafts tell search engines not to index).

For production: point a wildcard DNS record `*.yourplatform.com` to the server; for a custom domain, the client adds a CNAME to your server and you enter the domain in **Settings**.

### What visitors see: one app, four different websites

The same rendering code, with a different module, theme and content for each site:

| School: `greenvalley.localhost:3000` | University: `horizon.localhost:3000` |
|---|---|
| ![School website](screenshots/01-public/05-site-greenvalley-desktop.png) | ![University website](screenshots/01-public/06-site-horizon-desktop.png) |

| Company: `nexora.localhost:3000` | Shop: `urbanthreads.localhost:3000` |
|---|---|
| ![Company website](screenshots/01-public/07-site-nexora-desktop.png) | ![Shop website](screenshots/01-public/08-site-urbanthreads-desktop.png) |

**On a phone,** every site is responsive and the menu folds into ☰:

| School | University | Company | Shop | Menu open |
|---|---|---|---|---|
| <img src="screenshots/01-public/09-site-greenvalley-mobile.png" alt="School mobile" width="180"> | <img src="screenshots/01-public/10-site-horizon-mobile.png" alt="University mobile" width="180"> | <img src="screenshots/01-public/11-site-nexora-mobile.png" alt="Company mobile" width="180"> | <img src="screenshots/01-public/12-site-urbanthreads-mobile.png" alt="Shop mobile" width="180"> | <img src="screenshots/01-public/13-site-mobile-menu-open.png" alt="Mobile menu" width="180"> |

---

## 9. Visitor submits a form → automation

```mermaid
sequenceDiagram
    participant V as Visitor
    participant S as Website form
    participant A as submitEnquiry
    participant DB as Database
    participant AU as Automation (runs after reply)
    participant E as Email / WhatsApp

    V->>S: Fill name, phone/email, message<br/>+ the module's extra questions
    S->>A: Submit
    A->>A: Validate (name required, phone or email required)<br/>bot honeypot check
    A->>DB: Save Enquiry (status = NEW)
    A-->>V: "Thank you! We will contact you soon."
    A->>AU: Start automation in the background
    AU->>DB: Load site automation settings
    AU->>E: Email client logins (if on)
    AU->>E: Email account manager (if on)
    AU->>E: Email extra addresses
    AU->>E: WhatsApp alert (if on)
    AU->>E: Auto-reply to visitor (if on and email given)
    E-->>DB: Record each message:<br/>SENT / FAILED / LOGGED (channel not configured)
```

The visitor never waits for emails to be sent — automation runs after the response.

**Extra form questions.** A module can add extra questions to its contact form. The Company module asks for **Business name**, **Website or social media link** and **Service interested in**. The service dropdown is filled automatically from that website's own Services list, so it always matches. The answers are saved with the enquiry, shown on the enquiry page, included in the alert emails and WhatsApp messages, and exported in an **Other details** CSV column.

**Step 1: the visitor fills in the form** (here, the School admissions form).

![Enquiry form filled](screenshots/01-public/14-enquiry-form-filled.png)

*Enquiry form filled*

**Step 2: they submit and see the thank-you message straight away.**

![Enquiry sent](screenshots/01-public/15-enquiry-sent.png)

*Enquiry sent*

**Step 3:** the enquiry appears in the CRM immediately (next section), with its alerts listed under *Automated messages*.

---

## 10. Handling enquiries (CRM)

Where: **Enquiries** in the admin panel (all enquiries in your scope) or in the client portal (client's own).

```mermaid
stateDiagram-v2
    [*] --> New: form submitted
    New --> Contacted: first note or status change
    Contacted --> Converted: became a customer / admission
    Contacted --> Lost: not interested
    Lost --> Contacted: re-opened
    Converted --> [*]
```

Step by step:
1. Open **Enquiries**. Filter by status tabs (New / Contacted / Converted / Lost), website, assigned person, or search by name/email/phone.
2. Change the status straight from the list, or open an enquiry.
3. On the enquiry page:
   - **Call / WhatsApp / Email** buttons.
   - **Notes & follow-ups** — adding the first note moves a *New* enquiry to *Contacted*.
   - **Assigned to** — Super Admin assigns to anyone; team members can take it themselves.
   - **Automated messages** — shows every alert/auto-reply and whether it was sent.
4. **Export CSV** downloads exactly the filtered list (and only what you're allowed to see).

![Step 1: Enquiries list, where the new enquiry from the website is at the top](screenshots/02-super-admin/16-enquiries.png)

*Step 1: Enquiries list, where the new enquiry from the website is at the top*

![Filtered by the New status tab](screenshots/02-super-admin/17-enquiries-filter-new.png)

*Filtered by the New status tab*

![Step 3: Enquiry detail: contact buttons, status, assignee, notes, automated messages](screenshots/02-super-admin/18-enquiry-detail.png)

*Step 3: Enquiry detail: contact buttons, status, assignee, notes, automated messages*

![The same enquiries also appear in the builder's Enquiries tab for that website](screenshots/02-super-admin/13-builder-enquiries.png)

*The same enquiries also appear in the builder's Enquiries tab for that website*

CSV export sample ([full file](./screenshots/02-super-admin/enquiries-export-sample.csv)):

```csv
Received,Name,Phone,Email,Message,Other details,Form,Website,Status,Assigned to
2026-11-03T17:37:00.809Z,Priya Sharma,'+91 98765 43210,priya.parent@example.com,Admission enquiry for Class 6 for the 2027 session.,,Admissions,Green Valley Public School,NEW,
```

Phone numbers starting with `+` are prefixed with `'` so spreadsheets don't treat them as formulas.

---

## 11. Client portal flow

```mermaid
flowchart TD
    L[Client signs in] --> P["My websites (/portal)<br/>status, page views, new enquiries"]
    P --> E[Edit content]
    E --> E1[Brand details, text, images,<br/>lists — same editor as admin]
    E1 --> E2[Save → preview refreshes]
    P --> Q[Enquiries<br/>change status, add notes, export CSV]
    P --> B[Billing<br/>plan + invoices, read-only]
```

Clients **cannot** change sections, design, web address, automation or publish status — they only update their own content. Those requests go to their account manager.

![Step 1: My websites, showing only the client's own site with views and new enquiries](screenshots/04-client/01-portal-home.png)

*Step 1: My websites, showing only the client's own site with views and new enquiries*

![Step 2: Edit content, with the same content editor as the admin builder but no Sections, Design, Automation or Settings tabs](screenshots/04-client/02-site-editor-content.png)

*Step 2: Edit content, with the same content editor as the admin builder but no Sections, Design, Automation or Settings tabs*

![Enquiries tab inside the client's editor](screenshots/04-client/03-site-editor-enquiries.png)

*Enquiries tab inside the client's editor*

![Step 3: Enquiries, only for this client's website](screenshots/04-client/04-enquiries.png)

*Step 3: Enquiries, only for this client's website*

![Enquiry detail: the client can change status and add notes, but can't assign](screenshots/04-client/05-enquiry-detail.png)

*Enquiry detail: the client can change status and add notes, but can't assign*

![Step 4: Billing, showing only the client's own invoices (read-only)](screenshots/04-client/06-billing.png)

*Step 4: Billing, showing only the client's own invoices (read-only)*

Every client gets the same portal, scoped to their own business:

| University client | Company client | Shop client |
|---|---|---|
| ![University client portal](screenshots/04-client/10-portal-home-university.png) | ![Company client portal](screenshots/04-client/11-portal-home-company.png) | ![Shop client portal](screenshots/04-client/12-portal-home-shop.png) |

---

## 12. Visitor analytics

1. When a page of a **published** site loads, a tiny script sends one "page view" to `/api/track`.
2. Builder previews (`?preview=1`) and bots are ignored.
3. No cookies and no IP addresses are stored. Unique visitors are counted with a one-way hash of (IP + browser + today's date + secret) that changes every day.
4. Results appear in:
   - Builder → **Analytics** tab (views, unique visitors, daily chart, top referrers — last 30 days)
   - Admin dashboard (page views across your sites)
   - Client portal (views per website)

![Builder, Analytics tab](screenshots/02-super-admin/14-builder-analytics.png)

*Builder, Analytics tab*

---

## 13. Billing flow (Super Admin only)

```mermaid
flowchart TD
    A[Client page → Billing plan<br/>plan name, fee, cycle, next due date] --> B
    B[Daily job /api/cron/billing<br/>or 'Generate invoices & send reminders' button] --> C{Next due date<br/>within 7 days?}
    C -->|Yes| D[Create invoice INV-YYYY-NNNN<br/>for that period<br/>move next due date forward one cycle]
    C -->|No| E[Nothing to create]
    D --> F{Unpaid invoice due within 3 days<br/>or overdue, and not reminded<br/>in the last 3 days?}
    E --> F
    F -->|Yes| G[Email reminder to client contact + logins]
    F -->|No| H[Wait]
    G --> I[Client pays you<br/>UPI / bank / cash]
    I --> J[Billing page → Mark paid<br/>with payment note]
```

The **Billing** page shows: recurring revenue per month, collected this month, outstanding, overdue, due in 7 days, and the invoice list with **Mark paid / Remind / Cancel**. One-off invoices (e.g. setup fee) can be created on the client page. Clients see their invoices under **Billing** in the portal.

> Online payment collection is not built in yet — invoices are tracked and marked paid manually.

![Billing page (Super Admin only): revenue, outstanding, overdue, invoice actions](screenshots/02-super-admin/23-billing.png)

*Billing page (Super Admin only): revenue, outstanding, overdue, invoice actions*

The billing plan is set on each client's page (see the *Billing plan* card in §6, Step 5). Clients see their invoices in the portal (§11, Step 4). Team members can't open Billing at all (§17).

---

## 14. Data model

```mermaid
erDiagram
    User ||--o{ Client : "owns (manages)"
    User ||--o{ User : "created"
    Client ||--o{ User : "client logins"
    Client ||--o{ Site : has
    Client ||--o{ Invoice : billed
    Site ||--o{ Enquiry : receives
    Site ||--o{ PageView : tracks
    Site ||--o{ Asset : "uploaded images"
    Enquiry ||--o{ EnquiryNote : has
    Enquiry ||--o{ Notification : "alerts sent"
    User ||--o{ Enquiry : "assigned"
    User ||--o{ Activity : performed

    User {
        string role "SUPER_ADMIN, STAFF or CLIENT"
        json permissions "staff limits"
    }
    Client {
        string name
        int planAmount "in paise"
        string billingCycle
        datetime nextDueDate
    }
    Site {
        string slug
        string customDomain
        string moduleKey
        json enabledSections
        json theme
        json content
        json automation
        string status "DRAFT or PUBLISHED"
    }
    Enquiry {
        string formType
        string status "NEW, CONTACTED, CONVERTED or LOST"
    }
    Invoice {
        string number
        int amount
        datetime dueDate
        string status "UNPAID, PAID or CANCELLED"
    }
```

Structured data (users, clients, permissions, invoices) uses normal tables with relations; flexible per-module data (theme, content, automation) is stored as **JSONB** on the `Site` row.

---

## 15. Where each step lives in the code

| Flow | Files |
|---|---|
| Host routing (subdomain / custom domain), login guard | `src/middleware.ts` |
| Login, session cookie | `src/app/login/`, `src/app/actions/auth.ts`, `src/lib/session.ts`, `src/lib/auth.ts` |
| Roles and limits | `src/lib/permissions.ts` |
| Dashboard | `src/app/admin/page.tsx` |
| Clients, team, client logins | `src/app/admin/clients/`, `src/app/admin/team/`, `src/app/actions/admin.ts` |
| Builder (sections, design, content, automation, settings) | `src/components/builder/`, `src/app/admin/sites/[id]/`, `src/app/actions/site.ts` |
| Module definitions | `src/modules/*.ts`, `src/modules/registry.ts` |
| Website rendering | `src/app/sites/[site]/`, `src/components/site/SiteRenderer.tsx` |
| Public forms + automation | `src/app/actions/enquiry.ts`, `src/lib/enquiry-automation.ts`, `src/lib/notify.ts`, `src/lib/automation.ts` |
| Enquiry CRM + CSV | `src/app/admin/enquiries/`, `src/app/portal/enquiries/`, `src/components/crm/`, `src/app/actions/crm.ts`, `src/app/api/enquiries/export/` |
| Image uploads | `src/app/api/uploads/`, `src/lib/uploads.ts` |
| Analytics | `src/app/api/track/`, `src/components/site/PageViewTracker.tsx`, `src/lib/analytics.ts` |
| Billing | `src/app/admin/billing/`, `src/app/portal/billing/`, `src/lib/billing.ts`, `src/app/actions/billing.ts`, `src/app/api/cron/billing/` |
| Client portal | `src/app/portal/` |
| Database schema / demo data | `prisma/schema.prisma`, `prisma/seed.ts` |

---

## 16. Adding a new industry module (e.g. Hospital)

1. Create `src/modules/hospital.ts` exporting a `ModuleDef`:
   - `sections`: reuse existing kinds — `hero`, `about`, `stats`, `cards`, `list`, `gallery`, `testimonials`, `products`, `contact` — with labels and sample content.
   - `presets`: 2–3 design presets.
   - `defaultBrand`: sample name, phone, address.
2. Add it to `MODULES` in `src/modules/registry.ts`.

It then appears automatically in **New client**, the builder, team permissions and the content editor — no other changes needed.

---

## 17. Roles and permissions, proven with screenshots

Each check below was performed by signing in as that role and opening the page. A red bar at the bottom of a screenshot shows **which URL was tried and what happened**.

### 17.1 Super Admin: full access

| Area | Screenshot |
|---|---|
| Dashboard (platform-wide) | [01-dashboard](./screenshots/02-super-admin/01-dashboard.png) |
| All clients / create / detail | [02](./screenshots/02-super-admin/02-clients.png) · [03](./screenshots/02-super-admin/03-client-new.png) · [05](./screenshots/02-super-admin/05-client-created.png) · [06](./screenshots/02-super-admin/06-client-detail.png) |
| All websites + every builder tab | [07](./screenshots/02-super-admin/07-sites.png) · [08–15](./screenshots/02-super-admin/) |
| All enquiries | [16](./screenshots/02-super-admin/16-enquiries.png) · [18](./screenshots/02-super-admin/18-enquiry-detail.png) |
| Team management | [19](./screenshots/02-super-admin/19-team.png) · [20](./screenshots/02-super-admin/20-team-new.png) · [21](./screenshots/02-super-admin/21-team-edit.png) |
| Activity log | [22](./screenshots/02-super-admin/22-activity.png) |
| Billing | [23](./screenshots/02-super-admin/23-billing.png) |

![Activity log (Super Admin only): who did what and when](screenshots/02-super-admin/22-activity.png)

*Activity log (Super Admin only): who did what and when*

### 17.2 Team Member: limited to their own clients

The demo team member has: **max clients = 10**, **cannot publish**, **cannot delete clients**, **modules = School and Company**.

![Dashboard showing their limits: clients used, publish right, allowed modules](screenshots/03-team-member/01-dashboard.png)

*Dashboard showing their limits: clients used, publish right, allowed modules*

![Clients: only the 2 they own. The admin's clients (Green Valley, Horizon) are not listed.](screenshots/03-team-member/02-clients-own-only.png)

*Clients: only the 2 they own. The admin's clients (Green Valley, Horizon) are not listed.*

![New client: only School and Company appear](screenshots/03-team-member/03-client-new-allowed-modules.png)

*New client: only School and Company appear*

![Limit reached: the server refuses to create one more client](screenshots/03-team-member/04-client-limit-reached.png)

*Limit reached: the server refuses to create one more client*

![Websites: only their clients' websites](screenshots/03-team-member/05-sites-own-only.png)

*Websites: only their clients' websites*

![Publish/Unpublish disabled without the Can publish permission](screenshots/03-team-member/06-builder-no-publish.png)

*Publish/Unpublish disabled without the Can publish permission*

![Enquiries: only from their clients' websites](screenshots/03-team-member/07-enquiries-own-only.png)

*Enquiries: only from their clients' websites*

**Blocked pages for a team member:**

| Tried | Result | Screenshot |
|---|---|---|
| `/admin/team` | Redirected to dashboard | [08-blocked-team](./screenshots/03-team-member/08-blocked-team.png) |
| `/admin/activity` | Redirected to dashboard | [09-blocked-activity](./screenshots/03-team-member/09-blocked-activity.png) |
| `/admin/billing` | Redirected to dashboard | [10-blocked-billing](./screenshots/03-team-member/10-blocked-billing.png) |
| Admin-owned client by ID | 404 Not Found | [11-blocked-other-client](./screenshots/03-team-member/11-blocked-other-client.png) |
| Admin-owned website by ID | 404 Not Found | [12-blocked-other-site](./screenshots/03-team-member/12-blocked-other-site.png) |

![Example: a team member opening /admin/billing is sent back to their dashboard (no Billing in their menu)](screenshots/03-team-member/10-blocked-billing.png)

*Example: a team member opening /admin/billing is sent back to their dashboard (no Billing in their menu)*

![Example: a team member guessing another owner's client ID gets 404](screenshots/03-team-member/11-blocked-other-client.png)

*Example: a team member guessing another owner's client ID gets 404*

### 17.3 Client: only their own website

![Portal menu has only My websites, Enquiries and Billing](screenshots/04-client/01-portal-home.png)

*Portal menu has only My websites, Enquiries and Billing*

| Tried | Result | Screenshot |
|---|---|---|
| `/admin` | Redirected to `/portal` | [07-blocked-admin](./screenshots/04-client/07-blocked-admin.png) |
| Another client's website editor (`/portal/sites/<horizon id>`) | 404 Not Found | [08-blocked-other-site](./screenshots/04-client/08-blocked-other-site.png) |
| Another client's enquiry (`/portal/enquiries/<nexora enquiry id>`) | 404 Not Found | [09-blocked-other-enquiry](./screenshots/04-client/09-blocked-other-enquiry.png) |

![A client opening /admin is sent to their portal](screenshots/04-client/07-blocked-admin.png)

*A client opening /admin is sent to their portal*

![A client opening another client's website editor gets 404](screenshots/04-client/08-blocked-other-site.png)

*A client opening another client's website editor gets 404*

### 17.4 Visitor (not signed in)

| Tried | Result | Screenshot |
|---|---|---|
| `/admin` | Redirected to `/login` | [04-anonymous-admin-blocked](./screenshots/01-public/04-anonymous-admin-blocked.png) |
| A published website | Shown | [05–13](./screenshots/01-public/) |
| An enquiry form | Accepted, then automation runs | [14](./screenshots/01-public/14-enquiry-form-filled.png) · [15](./screenshots/01-public/15-enquiry-sent.png) |

---

## 18. Regenerating the screenshots

All 62 images are produced by one script, so they can be refreshed after any UI change:

```bash
npm run dev                # terminal 1
npm run docs:screenshots   # terminal 2
```

The script (`scripts/screenshots.ts`):
- signs in as each role **in-process** using `AUTH_SECRET`, so no password is typed or stored
- walks every step in this guide and saves `docs/screenshots/<role>/NN-name.png`, plus a `manifest.json`
- creates a temporary demo client and a temporary deactivated user, and lowers the team member's limit for the limit-reached demo, then **restores and deletes everything** at the end
- masks the contact details of any real (non-demo) enquiry, so the images are safe to publish
