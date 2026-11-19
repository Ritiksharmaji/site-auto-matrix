# __NAME__ (Next.js)

This website was converted from the oneKampus website builder into a Next.js project (exported as static pages).
It lives at __URL__ and is now edited here.

## Where things are

| Path | What it is |
|---|---|
| `app/page.jsx` | The page: header, every section in order, footer |
| `sections/*.jsx` | One component per section (Hero, Services, About, …). Edit text and layout here |
| `components/Header.jsx`, `Footer.jsx` | Header (logo + menu) and footer |
| `components/EnquiryForm.jsx` | The contact form. Submissions go to the Enquiries inbox (alerts + auto-reply) |
| `app/globals.css` | All styling. The website's own styles are near the end (`/* website styles */`) |
| `public/assets/` | Images and fonts. Use them as `/assets/name.png` |
| `app/layout.jsx` | Page `<head>`: title, description, social sharing tags, fonts |

Colours and fonts are CSS variables on the outer `<div className="site …">` in `app/page.jsx`
(`--c-primary`, `--c-secondary`, `--f-heading`, …). Change them there to restyle everything.

## Work on it

```bash
npm install
npm run dev        # http://localhost:3000
```

Push to `main` (or click **Commit & deploy** in Code Studio). GitHub builds it and it goes
live in about 1–2 minutes. History, **Roll back** and **Switch back to builder** are on
the website's **Code** tab in the admin panel.

## Forms

Wrap fields in `<EnquiryForm formType="contact" className="…">…</EnquiryForm>`. Field names:
`name`, `email`, `phone`, `message`; fields named `extra.<something>` are saved as extra
answers, labelled with their `aria-label`. Nothing is sent from `localhost`.

## Next.js rules

`next.config.mjs` uses `output: "export"`: the site is published as static files (`out/`).
API routes, server actions, middleware and server rendering aren't available. Use the
EnquiryForm for contact forms.
