# __NAME__ (React + Vite)

This website is hosted by **oneKampus** at __URL__.

## Work on it

```bash
npm install
npm run dev        # http://localhost:5173
```

Edit files in `src/`. When you're happy:

```bash
git add -A
git commit -m "Describe your change"
git push
```

Every push to `main` is built by GitHub Actions (`.github/workflows/onekampus-deploy.yml`) and goes live in a few minutes. Deploy status, history and **Roll back** are in the oneKampus admin panel → the website → **Code** tab.

## Built-in connections

- `src/components/EnquiryForm.jsx`: the contact form. Submissions go to the oneKampus **Enquiries** inbox and trigger the site's email/WhatsApp alerts and auto-reply. Use `sendEnquiry()` from `src/onekampus.js` for your own forms.
- `trackPageView()` counts anonymous page views for the **Analytics** tab.
- Both do nothing on `localhost`, so testing locally never creates real enquiries.

## Rules

- The build must write the finished site to `dist/` (Vite does this).
- Only static files are published: no server code. Use the oneKampus APIs for forms.
