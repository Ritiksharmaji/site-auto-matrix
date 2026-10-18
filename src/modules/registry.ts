import { companyModule } from "./company";
import { schoolModule } from "./school";
import { shopModule } from "./shop";
import { universityModule } from "./university";
import type { Brand, ModuleDef, SectionContent, Theme } from "./types";

/** All available industry modules. Register new modules here. */
export const MODULES: ModuleDef[] = [schoolModule, universityModule, companyModule, shopModule];

export function getModule(key: string): ModuleDef | undefined {
  return MODULES.find((m) => m.key === key);
}

export function getPresetTheme(mod: ModuleDef, presetKey?: string): Theme {
  const preset = mod.presets.find((p) => p.key === presetKey) ?? mod.presets[0];
  return { preset: preset.key, ...preset.theme };
}

/** Starting configuration for a brand-new site using a module. */
export function initialSiteConfig(mod: ModuleDef, presetKey?: string, siteName?: string) {
  const content: Record<string, SectionContent | Brand> = {
    brand: { ...mod.defaultBrand, ...(siteName ? { siteName } : {}) },
  };
  for (const s of mod.sections) content[s.key] = structuredClone(s.defaults);
  return {
    enabledSections: mod.sections.filter((s) => s.required || s.defaultEnabled).map((s) => s.key),
    theme: getPresetTheme(mod, presetKey),
    content,
  };
}

/** Merge stored theme over the module default so missing keys never break rendering. */
export function resolveTheme(mod: ModuleDef, stored: unknown): Theme {
  const base = getPresetTheme(mod, (stored as Partial<Theme> | null)?.preset);
  return { ...base, ...((stored as Partial<Theme>) ?? {}) };
}

export function resolveContent(mod: ModuleDef, stored: unknown) {
  const raw = (stored ?? {}) as Record<string, unknown>;
  const brand: Brand = { whatsapp: "", metaDescription: "", ...mod.defaultBrand, ...((raw.brand as Partial<Brand>) ?? {}) };
  const sections: Record<string, SectionContent> = {};
  for (const s of mod.sections) {
    sections[s.key] = { ...s.defaults, ...((raw[s.key] as SectionContent) ?? {}) };
  }
  return { brand, sections };
}
