# __NAME__: custom code

__NAME__ (__URL__) is built with the oneKampus website builder. This repository adds
**your own code on top of it**. The builder keeps working: text and images are still
edited in the admin panel / client portal.

| File | What it does |
|---|---|
| `custom.css` | Extra styles, loaded after the builder's design |
| `custom.js` | Extra JavaScript, run on the live site after the page loads |
| `sections/after-<section>.html` | An HTML block shown right **after** that builder section |
| `sections/before-<section>.html` | An HTML block shown right **before** that builder section |

Sections on this site: __SECTIONS__

## Publish

Push to `main` (or click **Commit & deploy** in Code Studio). It goes live in about a
minute. History and **Roll back** are on the website's **Code** tab in the admin panel.

## Notes

- `<script>` tags inside `sections/*.html` don't run: put scripts in `custom.js`.
- In the admin panel's live preview, `custom.js` doesn't run, and HTML sections are shown
  without scripts or event handlers. Everything runs on the real website.
- Files ending in `.off` are ignored (e.g. `sections/example-after-hero.html.off`).
