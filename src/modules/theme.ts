import { BUTTON_OPTIONS, FONTS, FOOTER_OPTIONS, HEADER_OPTIONS, HERO_LAYOUTS, RADIUS_OPTIONS, SECTION_VARIANTS, SPACING_OPTIONS, STYLE_OPTIONS } from "./shared";
import type { ModuleDef, Theme } from "./types";

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Validates a theme from the builder, a blueprint or a saved blueprint and returns
 * a clean copy with only known keys. Throws a readable error on bad input.
 */
export function cleanTheme(mod: ModuleDef, theme: Theme): Theme {
  const colors = ["primary", "secondary", "background", "surface", "text"] as const;
  for (const c of colors) if (!HEX.test(theme[c])) throw new Error(`Invalid colour for ${c}`);
  if (!FONTS.some((f) => f.name === theme.headingFont) || !FONTS.some((f) => f.name === theme.bodyFont)) throw new Error("Invalid font");
  if (!RADIUS_OPTIONS.some((r) => r.value === theme.radius)) throw new Error("Invalid corner style");
  if (!STYLE_OPTIONS.some((s) => s.value === theme.style)) throw new Error("Invalid style");
  if (!HERO_LAYOUTS.some((h) => h.value === theme.heroLayout)) throw new Error("Invalid hero layout");

  const pick = <T extends string>(value: T | undefined, options: { value: T }[], fallback: T): T =>
    options.some((o) => o.value === value) ? (value as T) : fallback;

  // Keep only variants of sections this module has, with values that section kind supports.
  const variants: Record<string, string> = {};
  for (const s of mod.sections) {
    const v = theme.variants?.[s.key];
    if (v && SECTION_VARIANTS[s.kind]?.some((o) => o.value === v)) variants[s.key] = v;
  }

  return {
    preset: mod.presets.some((p) => p.key === theme.preset) ? theme.preset : "custom",
    primary: theme.primary,
    secondary: theme.secondary,
    background: theme.background,
    surface: theme.surface,
    text: theme.text,
    headingFont: theme.headingFont,
    bodyFont: theme.bodyFont,
    radius: theme.radius,
    style: theme.style,
    heroLayout: theme.heroLayout,
    header: pick(theme.header, HEADER_OPTIONS, "auto"),
    headerSticky: theme.headerSticky !== false,
    headerCta: !!theme.headerCta,
    footer: pick(theme.footer, FOOTER_OPTIONS, "columns"),
    spacing: pick(theme.spacing, SPACING_OPTIONS, "normal"),
    buttonStyle: pick(theme.buttonStyle, BUTTON_OPTIONS, "auto"),
    variants,
  };
}
