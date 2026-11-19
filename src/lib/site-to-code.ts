import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ExportFile } from "./site-export";

// Turns an exported page (index.html + styles.css + assets/ from site-export.ts) into a
// React (Vite) or Next.js project: one component per section, a real EnquiryForm
// component, and the same styles and images, so the result looks identical.

export type CodeTarget = "REACT" | "NEXTJS";

// ---------------------------------------------------------------- tiny HTML tree

type El = { type: "el"; name: string; attrs: [string, string | null][]; children: Node[] };
type Text = { type: "text"; text: string };
type Node = El | Text;

const VOID = new Set(["meta", "link", "img", "input", "br", "hr", "source", "area", "base", "col", "embed", "wbr", "track"]);
const RAW = new Set(["script", "style", "textarea", "title"]);
const BLOCK = new Set([
  "html", "head", "body", "div", "section", "header", "footer", "main", "nav", "ul", "ol", "li", "article", "aside",
  "form", "figure", "figcaption", "blockquote", "dl", "dt", "dd", "h1", "h2", "h3", "h4", "h5", "h6", "p", "details",
  "summary", "select", "option", "table", "thead", "tbody", "tr", "td", "th", "meta", "link", "title", "script", "style",
]);

function parseAttrs(src: string): [string, string | null][] {
  const out: [string, string | null][] = [];
  for (const m of src.matchAll(/([^\s=/>]+)(?:\s*=\s*"([^"]*)")?/g)) out.push([m[1], m[2] ?? null]);
  return out;
}

export function parseHtml(html: string): Node[] {
  const root: El = { type: "el", name: "#root", attrs: [], children: [] };
  const stack: El[] = [root];
  const tokens = html.replace(/<!--[\s\S]*?-->/g, "").split(/(<[^>]+>)/).filter((t) => t !== "");
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const top = stack[stack.length - 1];
    if (tok.startsWith("<!")) continue;
    const close = /^<\/([a-zA-Z][\w-]*)\s*>$/.exec(tok);
    if (close) {
      const name = close[1].toLowerCase();
      for (let j = stack.length - 1; j > 0; j--) if (stack[j].name === name) { stack.length = j; break; }
      continue;
    }
    const open = /^<([a-zA-Z][\w-]*)([\s\S]*?)(\/?)>$/.exec(tok);
    if (!open) {
      top.children.push({ type: "text", text: tok });
      continue;
    }
    const name = open[1].toLowerCase();
    const el: El = { type: "el", name, attrs: parseAttrs(open[2]), children: [] };
    top.children.push(el);
    if (RAW.has(name)) {
      let raw = "";
      while (i + 1 < tokens.length && !new RegExp(`^</${name}\\s*>$`, "i").test(tokens[i + 1])) raw += tokens[++i];
      i++;
      if (raw) el.children.push({ type: "text", text: raw });
    } else if (!VOID.has(name) && !open[3]) stack.push(el);
  }
  return root.children;
}

const attr = (el: El, name: string) => el.attrs.find(([k]) => k === name)?.[1] ?? null;
const hasClass = (el: El, cls: string) => (attr(el, "class") ?? "").split(/\s+/).includes(cls);
function find(nodes: Node[], pred: (el: El) => boolean): El | null {
  for (const n of nodes) {
    if (n.type !== "el") continue;
    if (pred(n)) return n;
    const hit = find(n.children, pred);
    if (hit) return hit;
  }
  return null;
}

// ---------------------------------------------------------------- JSX output

function decode(s: string) {
  return s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

const RENAME: Record<string, string> = {
  class: "className", for: "htmlFor", tabindex: "tabIndex", autocomplete: "autoComplete", inputmode: "inputMode",
  maxlength: "maxLength", minlength: "minLength", readonly: "readOnly", srcset: "srcSet", crossorigin: "crossOrigin",
  charset: "charSet", enctype: "encType", colspan: "colSpan", rowspan: "rowSpan", frameborder: "frameBorder",
  allowfullscreen: "allowFullScreen", referrerpolicy: "referrerPolicy", autoplay: "autoPlay", playsinline: "playsInline",
  spellcheck: "spellCheck", contenteditable: "contentEditable", datetime: "dateTime", "accept-charset": "acceptCharset",
  "http-equiv": "httpEquiv", "xlink:href": "xlinkHref", "xml:space": "xmlSpace", fetchpriority: "fetchPriority",
};

function jsxAttrName(name: string) {
  if (RENAME[name]) return RENAME[name];
  if (name.startsWith("aria-") || name.startsWith("data-")) return name;
  return name.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
}

function styleObject(css: string) {
  const entries = decode(css)
    .split(/;(?![^(]*\))/)
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const i = d.indexOf(":");
      const prop = d.slice(0, i).trim();
      const value = d.slice(i + 1).trim();
      const key = prop.startsWith("--") ? prop : prop.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
      return `${JSON.stringify(key)}: ${JSON.stringify(value)}`;
    });
  return `{{ ${entries.join(", ")} }}`;
}

function jsxAttrs(el: El) {
  const out: string[] = [];
  const isFormField = ["input", "textarea", "select"].includes(el.name);
  for (const [k, v] of el.attrs) {
    if (k === "style" && v != null) {
      out.push(`style=${styleObject(v)}`);
      continue;
    }
    if (k === "selected") continue; // handled on <select> as defaultValue
    if (k === "data-precedence") {
      out.push(`precedence="${v}"`); // React 19 stylesheet hoisting
      continue;
    }
    let name = jsxAttrName(k);
    if (isFormField && name === "value") name = "defaultValue";
    if (isFormField && name === "checked") name = "defaultChecked";
    out.push(v == null || (v === "" && ["required", "hidden", "open", "disabled", "defaultChecked", "readOnly", "multiple", "autoFocus", "noValidate", "async", "defer"].includes(name)) ? name : `${name}="${v.replace(/"/g, "&quot;")}"`);
  }
  if (el.name === "select") {
    const sel = el.children.find((c): c is El => c.type === "el" && c.name === "option" && attr(c, "selected") != null);
    if (sel) out.push(`defaultValue="${(attr(sel, "value") ?? "").replace(/"/g, "&quot;")}"`);
  }
  if (el.name === "textarea") {
    const text = el.children.map((c) => (c.type === "text" ? decode(c.text) : "")).join("");
    if (text) out.push(`defaultValue={${JSON.stringify(text)}}`);
  }
  return out.length ? " " + out.join(" ") : "";
}

function jsxText(text: string) {
  return text.replace(/[{}]/g, (c) => `{"${c}"}`);
}

type Opts = { components: Map<El, string> };

/** JSX for a node: block-level children go on their own lines, inline content stays on one line (no spacing changes). */
function toJsx(node: Node, depth: number, opts: Opts): string {
  const pad = "  ".repeat(depth);
  if (node.type === "text") return jsxText(node.text);
  const comp = opts.components.get(node);
  if (comp) return `<${comp} />`;
  if (node.name === "script") {
    const body = node.children.map((c) => (c.type === "text" ? c.text : "")).join("");
    return `<script${jsxAttrs(node)} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(body)} }} />`;
  }
  if (node.name === "form" && attr(node, "data-onekampus-form") != null) {
    const kids = node.children.filter((c) => !(c.type === "el" && c.name === "p" && hasClass(c, "form-error")));
    const formEl: El = { ...node, name: "EnquiryForm", attrs: [["formType", attr(node, "data-onekampus-form") ?? "contact"], ["class", attr(node, "class") ?? ""]], children: kids };
    return toJsx(formEl, depth, opts);
  }
  const tag = node.name === "EnquiryForm" ? "EnquiryForm" : node.name;
  const attrs = node.name === "EnquiryForm" ? ` formType="${attr(node, "formType")}" className="${attr(node, "class")}"` : jsxAttrs(node);
  if (VOID.has(node.name) || (node.children.length === 0 && node.name !== "textarea")) return `<${tag}${attrs} />`;
  if (node.name === "textarea") return `<textarea${attrs} />`;
  const blockKids = node.children.some((c) => c.type === "el" && (BLOCK.has(c.name) || c.name === "EnquiryForm" || opts.components.has(c)));
  if (!blockKids) return `<${tag}${attrs}>${node.children.map((c) => toJsx(c, depth + 1, opts)).join("")}</${tag}>`;
  const lines = node.children
    .filter((c) => !(c.type === "text" && !c.text.trim()))
    .map((c) => `${pad}  ${c.type === "text" ? jsxText(c.text.trim()) : toJsx(c, depth + 1, opts)}`);
  return `<${tag}${attrs}>\n${lines.join("\n")}\n${pad}</${tag}>`;
}

function componentName(raw: string, used: Set<string>) {
  let base = raw.replace(/[^a-zA-Z0-9]+(.)?/g, (_m, c: string) => (c ? c.toUpperCase() : "")).replace(/^[^a-zA-Z]+/, "");
  base = base.charAt(0).toUpperCase() + base.slice(1) || "Section";
  let name = base;
  for (let i = 2; used.has(name) || ["App", "Header", "Footer", "EnquiryForm"].includes(name); i++) name = `${base}${i}`;
  used.add(name);
  return name;
}

function usesForm(node: Node): boolean {
  return node.type === "el" && ((node.name === "form" && attr(node, "data-onekampus-form") != null) || node.children.some(usesForm));
}

function moduleFile(name: string, node: El, imports: string[], clientNote = "") {
  const opts: Opts = { components: new Map() };
  const needsForm = usesForm(node);
  const lines = [
    clientNote,
    ...(needsForm ? [imports[0]] : []),
    "",
    `export default function ${name}() {`,
    `  return (`,
    `    ${toJsx(node, 2, opts)}`,
    `  );`,
    `}`,
    "",
  ];
  return lines.filter((l, i) => i > 0 || l).join("\n").replace(/^\n+/, "");
}

// ---------------------------------------------------------------- project

async function template(rel: string, vars: Record<string, string>) {
  let text = await readFile(path.join(process.cwd(), "code-templates", rel), "utf8");
  for (const [k, v] of Object.entries(vars)) text = text.replaceAll(k, v);
  return text;
}

const ENQUIRY_FORM = (clientDirective: boolean, importPath: string) => `${clientDirective ? '"use client";\n\n' : ""}import { useState } from "react";
import { sendEnquiry } from "${importPath}";

/**
 * The contact form: submissions go to the oneKampus Enquiries inbox, with the site's
 * email / WhatsApp alerts and auto-reply. Inputs named "extra.<something>" are saved
 * as extra answers, labelled with their aria-label.
 */
export default function EnquiryForm({ formType = "contact", className = "", children }) {
  const [state, setState] = useState({ sending: false, done: false, error: "" });

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (data.get("company_website")) return; // spam trap
    const extra = {};
    form.querySelectorAll("[name^='extra.']").forEach((el) => {
      if (el.value) extra[el.getAttribute("aria-label") || el.name.slice(6)] = el.value;
    });
    setState({ sending: true, done: false, error: "" });
    try {
      await sendEnquiry({
        formType,
        name: data.get("name") || "",
        email: data.get("email") || "",
        phone: data.get("phone") || "",
        message: data.get("message") || "",
        extra,
      });
      setState({ sending: false, done: true, error: "" });
    } catch (err) {
      setState({ sending: false, done: false, error: err.message });
    }
  }

  if (state.done) return <p className="py-6 text-center font-medium">Thank you! We have received your details and will contact you soon.</p>;
  return (
    <form className={className} onSubmit={onSubmit} aria-busy={state.sending}>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {children}
    </form>
  );
}
`;

/**
 * Builds the React (Vite) or Next.js project for an exported site.
 * `exported` is the output of exportSite(): index.html, styles.css, onekampus.js, assets/…, custom.js?
 */
export async function siteToCode(exported: ExportFile[], target: CodeTarget, vars: { name: string; url: string }): Promise<ExportFile[]> {
  const get = (p: string) => exported.find((f) => f.path === p)?.content ?? "";
  const tree = parseHtml(get("index.html"));
  const html = find(tree, (e) => e.name === "html");
  const head = find(tree, (e) => e.name === "head");
  const body = find(tree, (e) => e.name === "body");
  if (!html || !head || !body) throw new Error("Unexpected page structure.");
  const siteRoot = find(body.children, (e) => e.name === "div" && hasClass(e, "site"));
  if (!siteRoot) throw new Error("Couldn't find the website's root element.");
  const lang = attr(html, "lang") ?? "en";
  const bodyClass = attr(body, "class") ?? "";
  const hasCustomJs = exported.some((f) => f.path === "custom.js");

  // Head tags we carry over (styles and our scripts are handled by the project itself).
  const headTags = head.children.filter(
    (c): c is El => c.type === "el" && !(c.name === "link" && (attr(c, "href") === "/styles.css")) && !(c.name === "script" && attr(c, "src")),
  );
  const ldJson = body.children.filter((c): c is El => c.type === "el" && c.name === "script" && attr(c, "type") === "application/ld+json");

  // Components: header, footer and every child of <main>.
  const used = new Set<string>();
  const components: { name: string; dir: "components" | "sections"; node: El }[] = [];
  const opts: Opts = { components: new Map() };
  const header = siteRoot.children.find((c): c is El => c.type === "el" && c.name === "header");
  const footer = siteRoot.children.find((c): c is El => c.type === "el" && c.name === "footer");
  const main = siteRoot.children.find((c): c is El => c.type === "el" && c.name === "main");
  if (header) { components.push({ name: "Header", dir: "components", node: header }); opts.components.set(header, "Header"); used.add("Header"); }
  if (footer) { components.push({ name: "Footer", dir: "components", node: footer }); opts.components.set(footer, "Footer"); used.add("Footer"); }
  for (const c of main?.children ?? []) {
    if (c.type !== "el") continue;
    const id = attr(c, "id") ?? attr(c, "data-slot") ?? c.name;
    const name = componentName(attr(c, "data-slot") ? `custom-${id}` : id, used);
    components.push({ name, dir: "sections", node: c });
    opts.components.set(c, name);
  }

  const next = target === "NEXTJS";
  const formImport = next ? `import EnquiryForm from "${"../components/EnquiryForm"}";` : `import EnquiryForm from "../components/EnquiryForm";`;
  const files: ExportFile[] = [];
  for (const c of components) {
    const file = `${next ? "" : "src/"}${c.dir}/${c.name}.jsx`;
    files.push({ path: file, content: moduleFile(c.name, c.node, [c.dir === "components" ? formImport.replace("../components/", "./") : formImport]) });
  }

  const imports = components.map((c) => `import ${c.name} from "${next ? "../" : "./"}${c.dir}/${c.name}";`).join("\n");
  const page = toJsx(siteRoot, 2, opts);
  const assets = exported.filter((f) => f.path.startsWith("assets/")).map((f) => ({ ...f, path: `public/${f.path}` }));
  const common = {
    "__NAME__": vars.name.replace(/[<>"`$\\]/g, ""),
    "__URL__": vars.url,
  };

  if (!next) {
    // ---------------- React (Vite)
    const headHtml = headTags.map((t) => serializeHead(t)).join("\n    ");
    files.push(
      {
        path: "index.html",
        content: `<!doctype html>\n<html lang="${lang}">\n  <head>\n    ${headHtml}\n${ldJson.map((t) => "    " + serializeHead(t)).join("\n")}\n  </head>\n  <body class="${bodyClass}">\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>${hasCustomJs ? '\n    <script src="/custom.js" defer></script>' : ""}\n  </body>\n</html>\n`,
      },
      { path: "src/App.jsx", content: `${imports}\n\nexport default function App() {\n  return (\n    ${page}\n  );\n}\n` },
      { path: "src/main.jsx", content: `import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App.jsx";\nimport { trackPageView } from "./onekampus";\nimport "./styles.css";\n\ncreateRoot(document.getElementById("root")).render(\n  <StrictMode>\n    <App />\n  </StrictMode>,\n);\n\ntrackPageView();\n` },
      { path: "src/styles.css", content: get("styles.css") },
      { path: "src/onekampus.js", content: await template("react/src/onekampus.js", {}) },
      { path: "src/components/EnquiryForm.jsx", content: ENQUIRY_FORM(false, "../onekampus") },
      { path: "package.json", content: (await template("react/package.json", { __SLUG__: slugOf(vars.url) })).replace(/,\n\s*"react-router-dom": "[^"]+"/, "") },
      { path: "vite.config.js", content: await template("react/vite.config.js", {}) },
      { path: ".gitignore", content: await template("react/.gitignore", {}) },
      { path: ".github/workflows/onekampus-deploy.yml", content: await template("react/.github/workflows/onekampus-deploy.yml", {}) },
      { path: "README.md", content: await template("export/README-react.md", common) },
    );
    if (hasCustomJs) files.push({ path: "public/custom.js", content: get("custom.js") });
  } else {
    // ---------------- Next.js (static export)
    const headJsx = [...headTags.filter((t) => !(t.name === "meta" && (attr(t, "charset") != null || attr(t, "charSet") != null || attr(t, "name") === "viewport"))), ...ldJson]
      .map((t) => `        ${toJsx(t, 4, { components: new Map() })}`)
      .join("\n");
    files.push(
      {
        path: "app/layout.jsx",
        // <title>, <meta> and <link> are placed in the body: React moves them into <head>
        // (an explicit <head> would clash with the tags Next.js adds itself).
        content: `import PageViews from "../components/PageViews";\nimport "./globals.css";\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="${lang}">\n      <body className="${bodyClass}">\n        {/* Page title, description, sharing tags and fonts (React places them in <head>) */}\n${headJsx.replace(/^ {8}/gm, "        ")}\n        <PageViews />\n        {children}${hasCustomJs ? '\n        <script src="/custom.js" defer />' : ""}\n      </body>\n    </html>\n  );\n}\n`,
      },
      { path: "app/page.jsx", content: `${imports}\n\nexport default function Home() {\n  return (\n    ${page}\n  );\n}\n` },
      { path: "app/globals.css", content: get("styles.css") },
      { path: "lib/onekampus.js", content: await template("nextjs/lib/onekampus.js", {}) },
      { path: "components/EnquiryForm.jsx", content: ENQUIRY_FORM(true, "../lib/onekampus") },
      { path: "components/PageViews.jsx", content: await template("nextjs/components/PageViews.jsx", {}) },
      { path: "package.json", content: await template("nextjs/package.json", { __SLUG__: slugOf(vars.url) }) },
      { path: "next.config.mjs", content: await template("nextjs/next.config.mjs", {}) },
      { path: ".gitignore", content: await template("nextjs/.gitignore", {}) },
      { path: ".github/workflows/onekampus-deploy.yml", content: await template("nextjs/.github/workflows/onekampus-deploy.yml", {}) },
      { path: "README.md", content: await template("export/README-nextjs.md", common) },
    );
    if (hasCustomJs) files.push({ path: "public/custom.js", content: get("custom.js") });
  }
  return [...files, ...assets];
}

function slugOf(url: string) {
  return new URL(url).hostname.split(".")[0].replace(/[^a-z0-9-]/g, "") || "site";
}

/** Plain HTML for a head tag (Vite's index.html). */
function serializeHead(el: El): string {
  const attrs = el.attrs.map(([k, v]) => (v == null ? k : `${k}="${v}"`)).join(" ");
  const inner = el.children.map((c) => (c.type === "text" ? c.text : "")).join("");
  if (VOID.has(el.name)) return `<${el.name}${attrs ? " " + attrs : ""} />`;
  return `<${el.name}${attrs ? " " + attrs : ""}>${inner}</${el.name}>`;
}
