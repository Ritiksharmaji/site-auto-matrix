import "server-only";
import { createHash } from "node:crypto";
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

// "Convert to code website": turns a builder site's current page into plain files
// (index.html, styles.css, onekampus.js, assets/…) that look exactly the same and can
// be edited in VS Code / Code Studio.
//
// The page is fetched from this server (as a visitor on the site's own address would
// see it), then:
//   • Next.js scripts and preload tags are removed (the page is fully server-rendered)
//   • every stylesheet and inline <style> goes into styles.css, in the original order
//   • images, fonts and other files used by the page are saved under assets/
//   • the contact form posts to /api/public/enquiries through onekampus.js

export type ExportFile = { path: string; content: string; encoding?: "utf-8" | "base64" };

type Fetched = { status: number; type: string; body: Buffer };

/** GET from this same server with a given Host header (Node's fetch can't set Host). */
function local(host: string, urlPath: string, cookie?: string): Promise<Fetched> {
  const port = Number(process.env.PORT ?? 3000);
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: urlPath, method: "GET", headers: { Host: host, "User-Agent": "oneKampus site export", ...(cookie ? { Cookie: cookie } : {}) } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, type: String(res.headers["content-type"] ?? ""), body: Buffer.concat(chunks) }));
      },
    );
    req.on("error", reject);
    req.setTimeout(30_000, () => req.destroy(new Error("Timed out while reading the site")));
    req.end();
  });
}

const EXT: Record<string, string> = {
  "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif", "image/svg+xml": ".svg",
  "image/avif": ".avif", "image/x-icon": ".ico", "image/vnd.microsoft.icon": ".ico", "font/woff2": ".woff2", "font/woff": ".woff",
  "font/ttf": ".ttf", "application/pdf": ".pdf",
};

function nameFor(urlPath: string, type: string) {
  const clean = urlPath.split(/[?#]/)[0];
  const base = path.posix.basename(clean).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 60) || "file";
  const ext = path.posix.extname(base) || EXT[type.split(";")[0].trim()] || "";
  const hash = createHash("sha1").update(urlPath).digest("hex").slice(0, 6);
  const stem = path.posix.extname(base) ? base.slice(0, -path.posix.extname(base).length) : base;
  return `${stem}-${hash}${ext}`;
}

/** The onekampus.js shipped with exported sites: form → Enquiries (incl. extra questions), page views → Analytics. */
export async function exportScript() {
  return readFile(path.join(process.cwd(), "code-templates", "export", "onekampus.js"), "utf8");
}

export async function exportSite(opts: { host: string; siteName: string; url: string; cookie?: string; customJs?: string | null }) {
  const page = await local(opts.host, "/", opts.cookie);
  if (page.status !== 200) throw new Error(`Couldn't read the website (HTTP ${page.status}). Is it published?`);
  let html = page.body.toString("utf8");

  const assets = new Map<string, { file: string; body: Buffer }>();
  async function asset(ref: string): Promise<string | null> {
    if (!ref.startsWith("/") || ref.startsWith("//")) return null; // external URLs stay as they are
    const key = ref.replace(/&amp;/g, "&");
    const hit = assets.get(key);
    if (hit) return hit.file;
    const res = await local(opts.host, key);
    if (res.status !== 200) return null;
    if (res.body.length > 5 * 1024 * 1024) return null;
    const file = `assets/${nameFor(key, res.type)}`;
    assets.set(key, { file, body: res.body });
    return file;
  }

  // 1. Styles, in document order: <link rel=stylesheet> (head) then inline <style> blocks.
  const cssParts: string[] = [];
  const linkRe = /<link\b[^>]*rel="stylesheet"[^>]*>/gi;
  for (const tag of html.match(linkRe) ?? []) {
    const href = /href="([^"]+)"/.exec(tag)?.[1];
    if (href?.startsWith("/")) {
      const css = await local(opts.host, href.replace(/&amp;/g, "&"));
      if (css.status === 200) cssParts.push(`/* ${href.split("?")[0]} */\n${css.body.toString("utf8")}`);
    }
  }
  html = html.replace(linkRe, (tag) => (/href="https?:/.test(tag) ? tag : ""));
  html = html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_m, attrs: string, css: string) => {
    cssParts.push(`/* ${/data-custom-css/.test(attrs) ? "custom styles" : "website styles"} */\n${css}`);
    return "";
  });

  // 2. Scripts: keep structured data only; drop Next.js runtime, preloads and the draft banner.
  html = html.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (m, attrs: string) => (/application\/ld\+json/.test(attrs) ? m : ""));
  html = html.replace(/<link\b[^>]*rel="(?:preload|modulepreload|prefetch)"[^>]*>/gi, "");
  html = html.replace(/<meta name="next-size-adjust"[^>]*>/gi, "");
  html = html.replace(/<div class="bg-amber-400[^"]*">Draft preview[^<]*<\/div>/, "");
  html = html.replace(/<!--\$-->|<!--\/\$-->|<!--\$\?-->|<!--\/?\$!?-->/g, "");
  html = html.replace(/<div hidden="">\s*<\/div>/g, "");

  // 3. The enquiry form(s): standalone forms handled by onekampus.js.
  html = html.replace(/<form\b[^>]*>([\s\S]*?)<\/form>/gi, (_m, inner: string) => {
    const formType = /name="formType" value="([^"]*)"/.exec(inner)?.[1] ?? "contact";
    const body = inner
      .replace(/<input type="hidden" name="(?:\$ACTION[^"]*|siteId|formType)"[^>]*>/g, "")
      .replace(/<input type="hidden" name="\$ACTION[^>]*>/g, "");
    // The (hidden) error line goes first so it doesn't change the form's spacing.
    return `<form class="space-y-3" data-onekampus-form="${formType}"><p class="form-error text-sm text-red-600" hidden></p>${body}</form>`;
  });

  // 4. Files the page uses (uploads, stock photos, artwork, icons, fonts in CSS).
  const urlAttrs = /(\s(?:src|href|content|poster)=")(\/[^"]+)(")/g;
  const refs = new Set<string>();
  for (const m of html.matchAll(urlAttrs)) if (/^\/(api\/(uploads|art)|blueprints|favicon|_next\/static\/media|[^/]+\.(png|jpe?g|webp|gif|svg|ico|avif))/.test(m[2])) refs.add(m[2]);
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) for (const part of m[1].split(",")) refs.add(part.trim().split(/\s+/)[0]);
  let css = cssParts.join("\n\n");
  const cssRefs = new Set<string>();
  for (const m of css.matchAll(/url\(\s*["']?(\/[^"')]+)["']?\s*\)/g)) cssRefs.add(m[1]);
  for (const r of [...refs, ...cssRefs]) await asset(r);
  html = html.replace(urlAttrs, (m, a: string, ref: string, b: string) => {
    const hit = assets.get(ref.replace(/&amp;/g, "&"));
    return hit ? `${a}/${hit.file}${b}` : m;
  });
  html = html.replace(/srcset="([^"]+)"/g, (_m, list: string) =>
    `srcset="${list.split(",").map((part) => { const [u, ...rest] = part.trim().split(/\s+/); const hit = assets.get(u); return [hit ? "/" + hit.file : u, ...rest].join(" "); }).join(", ")}"`,
  );
  css = css.replace(/url\(\s*["']?(\/[^"')]+)["']?\s*\)/g, (m, ref: string) => {
    const hit = assets.get(ref);
    return hit ? `url("/${hit.file}")` : m;
  });

  // 5. Our stylesheet and script.
  html = html.replace(/<\/head>/i, `<link rel="stylesheet" href="/styles.css"/></head>`);
  html = html.replace(/<\/body>/i, `<script src="/onekampus.js" defer></script>${opts.customJs ? `<script src="/custom.js" defer></script>` : ""}</body>`);
  html = formatHtml(html);

  const files: ExportFile[] = [
    { path: "index.html", content: html },
    { path: "styles.css", content: css + "\n" },
    { path: "onekampus.js", content: await exportScript() },
    ...[...assets.values()].map((a) => ({ path: a.file, content: a.body.toString("base64"), encoding: "base64" as const })),
  ];
  if (opts.customJs) files.push({ path: "custom.js", content: opts.customJs });
  return files;
}

// ---------------------------------------------------------------- readable HTML

const BLOCK = new Set([
  "html", "head", "body", "div", "section", "header", "footer", "main", "nav", "ul", "ol", "li", "article", "aside",
  "form", "figure", "figcaption", "blockquote", "dl", "dt", "dd", "h1", "h2", "h3", "h4", "h5", "h6", "p", "details",
  "summary", "select", "option", "table", "thead", "tbody", "tr", "td", "th", "meta", "link", "title", "script", "style",
]);
const VOID = new Set(["meta", "link", "img", "input", "br", "hr", "source", "area", "base", "col", "embed", "wbr", "track"]);
const RAW = new Set(["script", "style", "textarea", "pre", "title"]);

/**
 * Puts structural tags on their own indented lines. Only whitespace between block-level
 * elements is added (which browsers ignore), so the page looks exactly the same.
 */
export function formatHtml(html: string) {
  const tokens = html.split(/(<[^>]+>)/).filter(Boolean);
  const out: string[] = [];
  const stack: { name: string; nested: boolean }[] = [];
  let raw: string | null = null;
  const indent = () => "\n" + "  ".repeat(stack.length);
  for (const tok of tokens) {
    if (raw) {
      out.push(tok);
      if (new RegExp(`^</${raw}\\s*>$`, "i").test(tok)) raw = null;
      continue;
    }
    const m = /^<(\/)?([a-zA-Z][a-zA-Z0-9-]*)/.exec(tok);
    if (!m || tok.startsWith("<!")) {
      out.push(tok);
      continue;
    }
    const closing = !!m[1];
    const name = m[2].toLowerCase();
    if (!BLOCK.has(name)) {
      out.push(tok);
      if (!closing && RAW.has(name) && !tok.endsWith("/>")) raw = name;
      continue;
    }
    if (closing) {
      const top = stack.pop();
      out.push(top?.nested ? indent() + tok : tok);
      continue;
    }
    if (stack.length) stack[stack.length - 1].nested = true;
    out.push((out.length ? indent() : "") + tok);
    if (RAW.has(name) && !tok.endsWith("/>")) raw = name;
    else if (!VOID.has(name) && !tok.endsWith("/>")) stack.push({ name, nested: false });
  }
  return out.join("").replace(/^\s+/, "") + "\n";
}
