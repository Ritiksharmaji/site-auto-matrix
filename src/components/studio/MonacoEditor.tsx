"use client";

import Editor, { loader, type BeforeMount } from "@monaco-editor/react";

// VS Code's editor (Monaco), loaded from jsDelivr at a pinned version.
loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs" } });

const LANG: Record<string, string> = {
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript", ts: "typescript", tsx: "typescript",
  json: "json", html: "html", htm: "html", css: "css", scss: "scss", less: "less", md: "markdown", mdx: "markdown",
  yml: "yaml", yaml: "yaml", xml: "xml", svg: "xml", sh: "shell", txt: "plaintext",
};

function language(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return LANG[ext] ?? "plaintext";
}

// JSX in .js/.jsx files, and no "cannot find module" errors for npm packages the
// browser can't see (they're installed by GitHub at build time).
const setup: BeforeMount = (monaco) => {
  type Defaults = { setCompilerOptions(o: object): void; setDiagnosticsOptions(o: object): void };
  const ts = (monaco as unknown as { languages: { typescript?: Record<string, unknown> }; typescript?: Record<string, unknown> }).languages.typescript ??
    (monaco as unknown as { typescript?: Record<string, unknown> }).typescript;
  if (!ts) return;
  const opts = {
    jsx: (ts.JsxEmit as Record<string, number>)?.Preserve ?? 1,
    allowJs: true,
    allowNonTsExtensions: true,
    target: (ts.ScriptTarget as Record<string, number>)?.ESNext ?? 99,
    module: (ts.ModuleKind as Record<string, number>)?.ESNext ?? 99,
    moduleResolution: 2,
    esModuleInterop: true,
  };
  for (const key of ["javascriptDefaults", "typescriptDefaults"]) {
    const d = ts[key] as Defaults | undefined;
    d?.setCompilerOptions(opts);
    d?.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
  }
};

export default function MonacoEditor({ path, value, onChange }: { path: string; value: string; onChange: (v: string) => void }) {
  return (
    <Editor
      path={path}
      language={language(path)}
      value={value}
      theme="vs-dark"
      beforeMount={setup}
      onChange={(v) => onChange(v ?? "")}
      options={{
        fontSize: 13,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 2,
        automaticLayout: true,
        renderWhitespace: "selection",
        bracketPairColorization: { enabled: true },
        "semanticHighlighting.enabled": true,
      }}
    />
  );
}
