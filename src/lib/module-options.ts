import { MODULES } from "@/modules/registry";

/** Serializable module summaries for client components, limited to what the user may use. */
export function moduleOptions(allowed: string[]) {
  return MODULES.filter((m) => allowed.includes(m.key)).map((m) => ({
    key: m.key,
    name: m.name,
    description: m.description,
    presets: m.presets.map((p) => ({
      key: p.key,
      label: p.label,
      primary: p.theme.primary,
      secondary: p.theme.secondary,
      headingFont: p.theme.headingFont,
    })),
  }));
}
