"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteSavedBlueprint } from "@/app/actions/blueprints";
import type { BlueprintOption } from "@/lib/blueprint-options";
import ConfirmButton from "./ConfirmButton";

type Category = { key: string; label: string; description: string };

/** The Blueprints page: every ready-made website, filterable by category, with live thumbnails. */
export default function BlueprintGallery({ blueprints, categories }: { blueprints: BlueprintOption[]; categories: Category[] }) {
  const used = categories.filter((c) => blueprints.some((b) => b.category === c.key));
  const [cat, setCat] = useState<string>("all");
  const shown = used.filter((c) => cat === "all" || c.key === cat);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {[{ key: "all", label: `All (${blueprints.length})` }, ...used.map((c) => ({ key: c.key, label: `${c.label} (${blueprints.filter((b) => b.category === c.key).length})` }))].map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`rounded-full border px-3 py-1 text-sm ${cat === c.key ? "border-indigo-500 bg-indigo-50 font-medium text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {shown.map((c) => (
        <section key={c.key}>
          <h2 className="font-semibold text-slate-900">{c.label}</h2>
          <p className="mb-4 text-sm text-slate-500">{c.description}</p>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {blueprints.filter((b) => b.category === c.key).map((b) => (
              <BlueprintCard key={b.key} b={b} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function BlueprintCard({ b }: { b: BlueprintOption }) {
  const preview = `/blueprint-preview/${encodeURIComponent(b.key)}`;
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <a href={preview} target="_blank" rel="noreferrer" className="relative block aspect-[16/10] overflow-hidden border-b border-slate-200" style={{ background: b.background }} aria-label={`Preview ${b.name}`}>
        <iframe
          src={`${preview}?bare=1`}
          title={`${b.name} thumbnail`}
          loading="lazy"
          tabIndex={-1}
          className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-[.25] border-0"
        />
      </a>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: b.primary }} />
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: b.secondary }} />
          <span className="h-3.5 w-3.5 rounded-full border border-slate-200" style={{ background: b.background }} />
          <span className="ml-auto text-xs text-slate-400">{b.moduleName}</span>
        </div>
        <h3 className="font-semibold text-slate-900">{b.name}</h3>
        {b.description && <p className="mt-1 text-sm text-slate-500">{b.description}</p>}
        <div className="mt-2 flex flex-wrap gap-1">
          {b.tags.map((t) => <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{t}</span>)}
          {b.saved && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">by {b.saved.by}</span>}
        </div>
        <div className="mt-auto flex items-center gap-2 pt-4">
          <Link href={`/admin/clients/new?blueprint=${encodeURIComponent(b.key)}`} className="btn-primary !py-1.5 text-sm">Use for new client</Link>
          <a href={preview} target="_blank" rel="noreferrer" className="btn-secondary !py-1.5 text-sm">Preview ↗</a>
          {b.saved?.canDelete && (
            <form action={deleteSavedBlueprint} className="ml-auto">
              <input type="hidden" name="id" value={b.key.replace(/^saved:/, "")} />
              <ConfirmButton message={`Delete the saved blueprint "${b.name}"? Websites already made from it are not affected.`} className="text-sm text-red-600 hover:underline">Delete</ConfirmButton>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}
