// Validates every built-in blueprint against its module: run with `npm run check:blueprints`.
// Catches unknown sections, unknown fields (which the builder would silently drop),
// invalid themes and duplicate keys.
import { BLUEPRINT_CATEGORIES, BLUEPRINTS, blueprintSiteConfig } from "../src/blueprints";
import { getModule } from "../src/modules/registry";

const errors: string[] = [];
const keys = new Set<string>();

for (const bp of BLUEPRINTS) {
  const where = `[${bp.key}]`;
  if (keys.has(bp.key)) errors.push(`${where} duplicate key`);
  keys.add(bp.key);
  if (!BLUEPRINT_CATEGORIES.some((c) => c.key === bp.category)) errors.push(`${where} unknown category ${bp.category}`);
  const mod = getModule(bp.moduleKey);
  if (!mod) { errors.push(`${where} unknown module ${bp.moduleKey}`); continue; }
  const byKey = new Map(mod.sections.map((s) => [s.key, s]));
  for (const k of bp.sections) if (!byKey.has(k)) errors.push(`${where} unknown section "${k}"`);
  for (const [k, content] of Object.entries(bp.content)) {
    const def = byKey.get(k);
    if (!def) { errors.push(`${where} content for unknown section "${k}"`); continue; }
    if (!bp.sections.includes(k)) errors.push(`${where} content for "${k}" but the section is not enabled`);
    const fieldKeys = new Set(def.fields.map((f) => f.key));
    for (const f of Object.keys(content ?? {})) {
      if (f === "items") { if (!def.itemFields) errors.push(`${where} ${k}: has items but the section takes none`); continue; }
      if (!fieldKeys.has(f)) errors.push(`${where} ${k}: unknown field "${f}"`);
    }
    const itemKeys = new Set((def.itemFields ?? []).map((f) => f.key));
    for (const [i, it] of ((content?.items as Record<string, string>[] | undefined) ?? []).entries()) {
      for (const f of Object.keys(it)) if (!itemKeys.has(f)) errors.push(`${where} ${k}.items[${i}]: unknown field "${f}"`);
    }
  }
  for (const v of Object.keys(bp.theme.variants ?? {})) if (!bp.sections.includes(v)) errors.push(`${where} variant for disabled/unknown section "${v}"`);
  try {
    const cfg = blueprintSiteConfig(bp, "Test");
    for (const [k, v] of Object.entries(bp.theme.variants ?? {})) if (cfg.theme.variants?.[k] !== v) errors.push(`${where} variant ${k}=${v} is not valid for that section`);
  } catch (e) {
    errors.push(`${where} ${(e as Error).message}`);
  }
}

const counts = BLUEPRINT_CATEGORIES.map((c) => `${c.label}: ${BLUEPRINTS.filter((b) => b.category === c.key).length}`).join(" · ");
console.log(`${BLUEPRINTS.length} blueprints (${counts})`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("All blueprints valid ✔");
