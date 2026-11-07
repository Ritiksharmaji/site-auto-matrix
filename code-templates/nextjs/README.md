# __NAME__ (Next.js, static export)

This website is hosted by **oneKampus** at __URL__.

## Work on it

```bash
npm install
npm run dev        # http://localhost:3000
```

Edit files in `app/` and `components/`. When you're happy:

```bash
git add -A
git commit -m "Describe your change"
git push
```

Every push to `main` is built by GitHub Actions (`.github/workflows/onekampus-deploy.yml`) and goes live in a few minutes. Deploy status, history and **Roll back** are in the oneKampus admin panel → the website → **Code** tab.

## Built-in connections

- `components/EnquiryForm.jsx`: the contact form. Submissions go to the oneKampus **Enquiries** inbox and trigger the site's email/WhatsApp alerts and auto-reply. Use `sendEnquiry()` from `lib/onekampus.js` for your own forms.
- `trackPageView()` counts anonymous page views for the **Analytics** tab.
- Both do nothing on `localhost`, so testing locally never creates real enquiries.

## Rules

- `next.config.mjs` uses `output: "export"`: the finished site is written to `out/`. Keep it that way.
- Only static files are published: API routes, server actions, middleware and `dynamic` rendering are not available. Use the oneKampus APIs for forms.
