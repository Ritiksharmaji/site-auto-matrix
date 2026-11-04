import type { Prisma } from "@prisma/client";
import { sanitizeContent } from "@/modules/content";
import { getModule, initialSiteConfig } from "@/modules/registry";
import { cleanTheme } from "@/modules/theme";
import type { Brand, ModuleDef, SectionContent, Theme } from "@/modules/types";
import { BUSINESS_BLUEPRINTS } from "./business";
import { CUSTOM_BLUEPRINTS } from "./custom";
import { SCHOOL_BLUEPRINTS, UNIVERSITY_BLUEPRINTS } from "./education";
import { SHOP_BLUEPRINTS } from "./shop";
import { TECH_BLUEPRINTS } from "./tech";
import type { Blueprint } from "./types";

export { BLUEPRINT_CATEGORIES } from "./types";
export type { Blueprint, BlueprintCategory } from "./types";

/** Every built-in blueprint, grouped by category in gallery order. */
export const BLUEPRINTS: Blueprint[] = [
  ...TECH_BLUEPRINTS,
  ...BUSINESS_BLUEPRINTS,
  ...SHOP_BLUEPRINTS,
  ...SCHOOL_BLUEPRINTS,
  ...UNIVERSITY_BLUEPRINTS,
  ...CUSTOM_BLUEPRINTS,
];

export function getBlueprint(key: string) {
  return BLUEPRINTS.find((b) => b.key === key);
}

/** Prefix used for saved (team) blueprints in forms and URLs: "saved:<id>". */
export const SAVED_PREFIX = "saved:";

type BlueprintSource = {
  moduleKey: string;
  theme: Theme;
  sections: string[];
  brand: Partial<Brand>;
  content: Record<string, Partial<SectionContent>>;
};

/**
 * Starting configuration for a new site cloned from a blueprint: module defaults,
 * overlaid with the blueprint's sections, design and content, then validated the
 * same way the builder validates edits.
 */
export function blueprintSiteConfig(bp: BlueprintSource, siteName?: string) {
  const mod = getModule(bp.moduleKey);
  if (!mod) throw new Error(`Unknown module ${bp.moduleKey}`);
  const base = initialSiteConfig(mod, undefined, siteName);

  const raw: Record<string, unknown> = {
    brand: { ...(base.content.brand as Brand), ...bp.brand, ...(siteName ? { siteName } : {}) },
  };
  for (const s of mod.sections) raw[s.key] = { ...(base.content[s.key] as SectionContent), ...(bp.content[s.key] ?? {}) };

  return {
    module: mod,
    enabledSections: orderedSections(mod, bp.sections),
    theme: cleanTheme(mod, bp.theme),
    content: sanitizeContent(mod, raw),
  };
}

/** Known sections in the given order, with required sections always included. */
export function orderedSections(mod: ModuleDef, keys: string[]) {
  const known = new Set(mod.sections.map((s) => s.key));
  const out = Array.from(new Set(keys.filter((k) => known.has(k))));
  for (const s of mod.sections) if (s.required && !out.includes(s.key)) out.push(s.key);
  return out;
}

/** Turns a saved-blueprint row into the same shape as a built-in blueprint. */
export function savedToSource(row: { moduleKey: string; theme: Prisma.JsonValue; enabledSections: Prisma.JsonValue; content: Prisma.JsonValue }): BlueprintSource {
  const content = ((row.content ?? {}) as Record<string, unknown>) ?? {};
  const { brand, ...sections } = content as { brand?: Partial<Brand> } & Record<string, Partial<SectionContent>>;
  return {
    moduleKey: row.moduleKey,
    theme: row.theme as unknown as Theme,
    sections: (row.enabledSections as string[]) ?? [],
    brand: brand ?? {},
    content: sections,
  };
}

/** Content stored with a saved blueprint: the site's sections, minus the client's contact details. */
export function contentForSaving(content: Prisma.JsonValue) {
  const c = { ...((content ?? {}) as Record<string, unknown>) };
  const brand = (c.brand ?? {}) as Partial<Brand>;
  c.brand = { tagline: brand.tagline ?? "", footerText: "", logo: "", phone: "", email: "", address: "", whatsapp: "", metaDescription: "" };
  return c as Prisma.InputJsonValue;
}
