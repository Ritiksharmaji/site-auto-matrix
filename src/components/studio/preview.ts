// Instant previews for Code Studio, built in the browser from the editor's files.
//
//   HTML sites  → the chosen page with its CSS / JS / images inlined
//   React sites → compiled with esbuild-wasm; npm packages load from esm.sh at the
//                 versions in package.json (one shared React for every package)
//
// The result is a complete HTML document that the preview shell (served on the
// site's own address) renders.

export type PreviewFiles = {
  /** path → text content (source files) */
  text: Record<string, string>;
  /** path → data: URL (images, fonts) */
  data: Record<string, string>;
};

const ESBUILD_VERSION = "0.25.12";
const ESBUILD_URL = `https://cdn.jsdelivr.net/npm/esbuild-wasm@${ESBUILD_VERSION}/esm/browser.min.js`;
const ESBUILD_WASM = `https://cdn.jsdelivr.net/npm/esbuild-wasm@${ESBUILD_VERSION}/esbuild.wasm`;

const ERROR_OVERLAY = `<script>
(function(){function show(m){var d=document.getElementById("__err")||document.body.appendChild(Object.assign(document.createElement("pre"),{id:"__err"}));
d.style.cssText="position:fixed;left:0;right:0;bottom:0;max-height:45%;overflow:auto;margin:0;padding:12px 16px;background:#7f1d1d;color:#fff;font:12px/1.5 ui-monospace,monospace;z-index:2147483647;white-space:pre-wrap";
d.textContent=(d.textContent?d.textContent+"\\n":"")+m;}
addEventListener("error",function(e){show((e.message||"Error")+(e.filename?"\\n  at "+e.filename+":"+e.lineno:""));});
addEventListener("unhandledrejection",function(e){show(String(e.reason&&e.reason.stack||e.reason));});})();
</script>`;

function escapeScript(code: string) {
  return code.replace(/<\/script/gi, "<\\/script");
}

function clean(p: string) {
  return p.replace(/^\.?\//, "").replace(/^\/+/, "");
}

// ---------------------------------------------------------------- HTML

/** Inlines /styles.css, /script.js and images so an HTML page previews without a server. */
export function buildHtmlPreview(files: PreviewFiles, page: string): { html: string; path: string } {
  const source = files.text[page] ?? files.text["index.html"];
  if (source == null) throw new Error("This site has no index.html.");
  const dir = page.includes("/") ? page.slice(0, page.lastIndexOf("/") + 1) : "";
  const resolve = (href: string) => {
    if (/^(https?:|data:|\/\/|#|mailto:|tel:)/i.test(href)) return null;
    const p = href.startsWith("/") ? clean(href) : clean(dir + href);
    return p.split(/[?#]/)[0];
  };
  let html = source
    .replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, (tag) => {
      const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
      const p = href && resolve(href);
      return p && files.text[p] != null ? `<style>${files.text[p]}</style>` : tag;
    })
    .replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi, (tag, a, src, b) => {
      const p = resolve(src);
      return p && files.text[p] != null ? `<script${a}${b}>${escapeScript(files.text[p])}</script>` : tag;
    })
    .replace(/\b(src|href)=["']([^"']+\.(?:png|jpe?g|gif|webp|svg|avif|ico))["']/gi, (m, attr, src) => {
      const p = resolve(src);
      return p && files.data[p] ? `${attr}="${files.data[p]}"` : m;
    });
  html = html.replace(/<head[^>]*>/i, (h) => `${h}${ERROR_OVERLAY}`);
  return { html, path: "/" + (page === "index.html" ? "" : page) };
}

// ---------------------------------------------------------------- React

type Esbuild = {
  initialize(o: { wasmURL: string }): Promise<void>;
  build(o: Record<string, unknown>): Promise<{ outputFiles: { text: string }[]; warnings: unknown[] }>;
};
let esbuildReady: Promise<Esbuild> | null = null;

function loadEsbuild() {
  esbuildReady ??= (async () => {
    const mod = (await import(/* webpackIgnore: true */ ESBUILD_URL)) as Partial<Esbuild> & { default?: Esbuild };
    const esbuild = (typeof mod.build === "function" ? mod : mod.default) as Esbuild;
    await esbuild.initialize({ wasmURL: ESBUILD_WASM });
    return esbuild;
  })();
  esbuildReady.catch(() => (esbuildReady = null));
  return esbuildReady;
}

function versionOf(range: string | undefined) {
  if (!range) return "";
  const m = /\d+(?:\.\d+){0,2}(?:-[\w.]+)?/.exec(range);
  return m ? m[0] : "";
}

/** Splits "react-dom/client" → ["react-dom", "/client"], "@scope/pkg/x" → ["@scope/pkg", "/x"]. */
function splitSpecifier(spec: string): [string, string] {
  const parts = spec.split("/");
  const n = spec.startsWith("@") ? 2 : 1;
  return [parts.slice(0, n).join("/"), parts.length > n ? "/" + parts.slice(n).join("/") : ""];
}

const LOADERS: Record<string, string> = { js: "jsx", jsx: "jsx", mjs: "js", ts: "ts", tsx: "tsx", json: "json" };
const ASSET = /\.(png|jpe?g|gif|webp|svg|avif|ico|woff2?|ttf|otf)$/i;
const EXTS = ["", ".jsx", ".tsx", ".js", ".ts", ".mjs", ".json", "/index.jsx", "/index.tsx", "/index.js", "/index.ts"];

/** Compiles the React app in the browser and returns a full HTML document for the preview shell. */
export async function buildReactPreview(files: PreviewFiles, opts: { path?: string } = {}): Promise<{ html: string; path: string }> {
  const esbuild = await loadEsbuild();
  const indexHtml = files.text["index.html"] ?? '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>';
  const entryMatch = /<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/i.exec(indexHtml);
  const entry = clean(entryMatch?.[1] ?? "src/main.jsx");
  if (files.text[entry] == null) throw new Error(`Entry file ${entry} not found.`);

  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } = {};
  try {
    pkg = JSON.parse(files.text["package.json"] ?? "{}");
  } catch {
    throw new Error("package.json is not valid JSON.");
  }
  const deps = { ...(pkg.devDependencies ?? {}), ...(pkg.dependencies ?? {}) };
  const reactV = versionOf(deps.react) || "19.1.0";
  const reactDomV = versionOf(deps["react-dom"]) || reactV;

  // Bare imports become esm.sh URLs; React stays shared through the import map.
  const toUrl = (spec: string) => {
    const [name, sub] = splitSpecifier(spec);
    if (name === "react") return `https://esm.sh/react@${reactV}${sub}?dev`;
    if (name === "react-dom") return `https://esm.sh/react-dom@${reactDomV}${sub}?dev&external=react`;
    const v = versionOf(deps[name]);
    return `https://esm.sh/${name}${v ? "@" + v : ""}${sub}?dev&external=react,react-dom`;
  };

  const findFile = (p: string) => EXTS.map((e) => p + e).find((c) => files.text[c] != null || files.data[c] != null);

  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: "esm",
    target: "es2020",
    jsx: "automatic",
    logLevel: "silent",
    define: {
      "process.env.NODE_ENV": '"development"',
      "import.meta.env.MODE": '"development"',
      "import.meta.env.DEV": "true",
      "import.meta.env.PROD": "false",
      "import.meta.env.BASE_URL": '"/"',
    },
    plugins: [
      {
        name: "studio-files",
        setup(build: { onResolve: (o: object, cb: (a: { path: string; importer: string }) => unknown) => void; onLoad: (o: object, cb: (a: { path: string }) => unknown) => void }) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (/^https?:\/\//.test(args.path)) return { path: args.path, external: true };
            if (!args.path.startsWith(".") && !args.path.startsWith("/")) {
              if (args.importer === "") return { path: clean(args.path), namespace: "vfs" };
              return { path: toUrl(args.path), external: true };
            }
            const base = args.path.startsWith("/") ? "" : args.importer.includes("/") ? args.importer.slice(0, args.importer.lastIndexOf("/") + 1) : "";
            const joined = clean(new URL(base + args.path, "http://x/").pathname);
            const hit = findFile(joined);
            if (!hit) throw new Error(`Cannot find "${args.path}" (imported from ${args.importer || "the entry"})`);
            return { path: hit, namespace: "vfs" };
          });
          build.onLoad({ filter: /.*/ }, (args) => {
            const p = args.path;
            if (ASSET.test(p)) return { contents: `export default ${JSON.stringify(files.data[p] ?? "/" + p)};`, loader: "js" };
            if (p.endsWith(".css")) {
              return { contents: `const s=document.createElement("style");s.dataset.file=${JSON.stringify(p)};s.textContent=${JSON.stringify(files.text[p] ?? "")};document.head.appendChild(s);export default {};`, loader: "js" };
            }
            const ext = p.split(".").pop() ?? "js";
            return { contents: files.text[p] ?? "", loader: LOADERS[ext] ?? "jsx", resolveDir: "/" };
          });
        },
      },
    ],
  });

  const importMap = {
    imports: {
      react: `https://esm.sh/react@${reactV}?dev`,
      "react/": `https://esm.sh/react@${reactV}/`,
      "react-dom": `https://esm.sh/react-dom@${reactDomV}?dev&external=react`,
      "react-dom/": `https://esm.sh/react-dom@${reactDomV}/`,
    },
  };
  const code = escapeScript(result.outputFiles[0].text);
  let html = indexHtml.replace(/<script[^>]*type=["']module["'][^>]*src=["'][^"']+["'][^>]*><\/script>/i, "");
  html = html.replace(/<head[^>]*>/i, (h) => `${h}${ERROR_OVERLAY}<script type="importmap">${JSON.stringify(importMap)}</script>`);
  html = html.replace(/<\/body>/i, `<script type="module">${code}</script></body>`);
  return { html, path: opts.path ?? "/" };
}
