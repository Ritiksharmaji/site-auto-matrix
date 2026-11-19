# __NAME__ (code website)

This website was converted from the oneKampus website builder into plain code. It lives
at __URL__ and is now edited here.

| File | What it is |
|---|---|
| `index.html` | The whole page: header, every section, footer. Edit text, links and layout here |
| `styles.css` | All styling. The website's own styles are near the end (search for `/* website styles */`) |
| `onekampus.js` | Sends the contact form to the Enquiries inbox (alerts + auto-reply) and counts page views. Keep it |
| `assets/` | Images and fonts the page uses. Add your own here and link them as `/assets/name.png` |
| `custom.js` | Only present if the site had custom code. Your own scripts |

The page uses CSS utility classes (`grid`, `md:grid-cols-2`, `gap-6`…) that are defined in
`styles.css`, plus the site's own classes (`site-section`, `site-card`, `site-btn`…).
Colours and fonts are CSS variables on the outer `<div class="site …" style="--c-primary:…">`.

## Publish

Push to `main`, or click **Commit & deploy** in Code Studio. It goes live in about a
minute. History and **Roll back** are on the website's **Code** tab in the admin panel.
There you'll also find **Switch back to builder**, which restores the builder version
from before the conversion (changes made here aren't carried back).

## Forms

Any `<form data-onekampus-form="contact">` is sent to the Enquiries inbox. Fields: `name`,
`email`, `phone`, `message`; fields named `extra.<something>` are saved as extra answers,
labelled with their `aria-label`.
