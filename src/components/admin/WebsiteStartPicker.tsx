"use client";

import { useState } from "react";
import type { BlueprintOption } from "@/lib/blueprint-options";
import ModulePicker from "./ModulePicker";

type Category = { key: string; label: string };
type Props = {
  modules: Parameters<typeof ModulePicker>[0]["modules"];
  blueprints: BlueprintOption[];
  categories: Category[];
  /** Pre-selected blueprint (from the Blueprints page). */
  initialBlueprint?: string;
  /** Present when the user may create code websites. */
  code?: { frameworks: { value: string; label: string; description: string }[]; githubReady: boolean };
};

/**
 * How a new website starts. "Standard" (module + starting design) is the default
 * and works exactly as before; "Blueprint" clones a ready-made website instead.
 * Submits moduleKey + preset, or blueprint.
 */
export default function WebsiteStartPicker({ modules, blueprints, categories, initialBlueprint, code }: Props) {
  const valid = blueprints.some((b) => b.key === initialBlueprint);
  const [mode, setMode] = useState<"standard" | "blueprint" | "code">(valid ? "blueprint" : "standard");
  const [framework, setFramework] = useState(code?.frameworks[0]?.value ?? "");
  const [selected, setSelected] = useState(valid ? initialBlueprint! : "");
  const initialCat = blueprints.find((b) => b.key === initialBlueprint)?.category ?? blueprints[0]?.category ?? "";
  const [cat, setCat] = useState(initialCat);
  const used = categories.filter((c) => blueprints.some((b) => b.category === c.key));

  return (
    <div className="space-y-4">
      <div>
        <span className="label">How do you want to start?</span>
        <div className={`grid gap-3 ${code ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <ModeButton active={mode === "standard"} onClick={() => setMode("standard")} title="Standard (module + design)" hint="Pick a module and a starting design, then fill in content. The usual way." />
          <ModeButton
            active={mode === "blueprint"}
            onClick={() => setMode("blueprint")}
            disabled={blueprints.length === 0}
            title={`From a blueprint (${blueprints.length})`}
            hint="Clone a ready-made website with design, sections, text and images. Just swap the content."
          />
          {code && (
            <ModeButton
              active={mode === "code"}
              onClick={() => setMode("code")}
              title="Code website (VS Code)"
              hint="React, Next.js or HTML in its own GitHub repo. Open it in VS Code, push, and it goes live."
            />
          )}
        </div>
      </div>

      {mode === "standard" && <ModulePicker modules={modules} />}

      {mode === "code" && code && (
        <div className="space-y-3">
          <input type="hidden" name="codeFramework" value={framework} />
          <span className="label">Framework</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {code.frameworks.map((f) => (
              <button
                type="button"
                key={f.value}
                onClick={() => setFramework(f.value)}
                className={`rounded-lg border p-3 text-left transition ${f.value === framework ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <p className="text-sm font-medium text-slate-900">{f.label}</p>
                <p className="text-xs text-slate-500">{f.description}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Creates a private GitHub repository with a starter site (contact form and analytics already connected) and starts the first build. You then open it in VS Code from the website&apos;s Code tab.
          </p>
          {!code.githubReady && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">GitHub isn&apos;t connected on this server yet, so code websites can&apos;t be created. See docs/DEPLOYMENT.md → Code websites.</p>
          )}
        </div>
      )}

      {mode === "blueprint" && (
        <div>
          <input type="hidden" name="blueprint" value={selected} />
          <div className="mb-3 flex flex-wrap gap-1.5">
            {used.map((c) => (
              <button
                type="button"
                key={c.key}
                onClick={() => setCat(c.key)}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${cat === c.key ? "border-indigo-500 bg-indigo-50 font-medium text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {blueprints.filter((b) => b.category === cat).map((b) => (
              <div
                key={b.key}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(b.key)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelected(b.key))}
                className={`cursor-pointer rounded-lg border p-3 text-left transition ${b.key === selected ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="mb-1.5 flex items-center gap-1">
                  <span className="h-4 w-4 rounded" style={{ background: b.primary }} />
                  <span className="h-4 w-4 rounded" style={{ background: b.secondary }} />
                  <span className="h-4 w-4 rounded border border-slate-200" style={{ background: b.background }} />
                  <a href={`/blueprint-preview/${encodeURIComponent(b.key)}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="ml-auto text-xs text-indigo-600 hover:underline">
                    Preview ↗
                  </a>
                </div>
                <p className="text-sm font-medium text-slate-900">{b.name}</p>
                <p className="text-xs text-slate-500">{b.moduleName} · {b.tags.join(" · ")}</p>
              </div>
            ))}
          </div>
          {!selected && <p className="mt-2 text-xs text-amber-700">Choose a blueprint above.</p>}
        </div>
      )}
    </div>
  );
}

function ModeButton({ active, onClick, title, hint, disabled }: { active: boolean; onClick: () => void; title: string; hint: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border p-4 text-left transition disabled:opacity-50 ${active ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200" : "border-slate-200 bg-white hover:border-slate-300"}`}
    >
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </button>
  );
}
