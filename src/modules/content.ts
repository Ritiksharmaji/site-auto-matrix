import type { ModuleDef } from "./types";

/** Keep only known sections / fields as plain strings, so stored content always matches the module. */
export function sanitizeContent(mod: ModuleDef, raw: Record<string, unknown>) {
  const str = (v: unknown, max = 5000) => (typeof v === "string" ? v.slice(0, max) : "");
  const brandIn = (raw.brand ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {
    brand: Object.fromEntries(
      [...new Set([...Object.keys(mod.defaultBrand), "whatsapp", "metaDescription"])].map((k) => [k, str(brandIn[k], 300)]),
    ),
  };
  for (const s of mod.sections) {
    const src = (raw[s.key] ?? {}) as Record<string, unknown>;
    const section: Record<string, unknown> = Object.fromEntries(s.fields.map((f) => [f.key, str(src[f.key])]));
    if (s.itemFields) {
      const items = Array.isArray(src.items) ? src.items.slice(0, 50) : [];
      section.items = items.map((it) =>
        Object.fromEntries(s.itemFields!.map((f) => [f.key, str((it as Record<string, unknown>)?.[f.key], 2000)])),
      );
    }
    out[s.key] = section;
  }
  return out;
}
