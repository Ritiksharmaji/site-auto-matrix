# __NAME__ (HTML)

This website is hosted by **oneKampus** at __URL__.

## Work on it

Open `index.html` in a browser, or run a tiny local server:

```bash
npx serve .        # http://localhost:3000
```

When you're happy:

```bash
git add -A
git commit -m "Describe your change"
git push
```

Every push to `main` goes live in a minute or two. Deploy status, history and **Roll back** are in the oneKampus admin panel → the website → **Code** tab.

## Built-in connections

- Any `<form data-onekampus-form="contact">` is sent to the oneKampus **Enquiries** inbox (with the site's email/WhatsApp alerts and auto-reply). Field names: `name`, `email`, `phone`, `message`.
- `onekampus.js` also counts anonymous page views for the **Analytics** tab.
- Nothing is sent on `localhost`.
