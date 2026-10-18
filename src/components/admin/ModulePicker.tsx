"use client";

import { useState } from "react";

type ModuleOption = {
  key: string;
  name: string;
  description: string;
  presets: { key: string; label: string; primary: string; secondary: string; headingFont: string }[];
};

/** Choose a module and a starting design preset. Submits `moduleKey` and `preset` form fields. */
export default function ModulePicker({ modules }: { modules: ModuleOption[] }) {
  const [moduleKey, setModuleKey] = useState(modules[0]?.key ?? "");
  const mod = modules.find((m) => m.key === moduleKey);
  const [preset, setPreset] = useState(mod?.presets[0]?.key ?? "");

  return (
    <div className="space-y-4">
      <input type="hidden" name="moduleKey" value={moduleKey} />
      <input type="hidden" name="preset" value={preset} />
      <div>
        <span className="label">Module</span>
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map((m) => (
            <button
              type="button"
              key={m.key}
              onClick={() => {
                setModuleKey(m.key);
                setPreset(m.presets[0]?.key ?? "");
              }}
              className={`rounded-lg border p-4 text-left transition ${
                m.key === moduleKey ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="font-semibold text-slate-900">{m.name}</p>
              <p className="mt-1 text-xs text-slate-500">{m.description}</p>
            </button>
          ))}
        </div>
      </div>
      {mod && (
        <div>
          <span className="label">Starting design</span>
          <div className="grid gap-3 sm:grid-cols-3">
            {mod.presets.map((p) => (
              <button
                type="button"
                key={p.key}
                onClick={() => setPreset(p.key)}
                className={`rounded-lg border p-3 text-left transition ${
                  p.key === preset ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="mb-2 flex gap-1">
                  <span className="h-5 w-5 rounded" style={{ background: p.primary }} />
                  <span className="h-5 w-5 rounded" style={{ background: p.secondary }} />
                </div>
                <p className="text-sm font-medium text-slate-900">{p.label}</p>
                <p className="text-xs text-slate-500">{p.headingFont}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
