import "server-only";
import { blueprintSiteConfig, getBlueprint, SAVED_PREFIX, savedToSource } from "@/blueprints";
import { db } from "@/lib/db";
import { getModule, initialSiteConfig } from "@/modules/registry";
import type { ModuleDef } from "@/modules/types";

type StartChoice = { moduleKey?: string; preset?: string; blueprint?: string };
type StartResult =
  | { error: string }
  | { module: ModuleDef; enabledSections: string[]; theme: object; content: object; label: string };

/**
 * Works out a new site's starting configuration from the "New website" form:
 * either the standard way (module + starting design, the default), or a blueprint
 * (built-in "tech-…", or a team-saved "saved:<id>"). Module permissions apply to both.
 */
export async function resolveSiteStart(choice: StartChoice, allowedModules: string[], siteName: string): Promise<StartResult> {
  const bpKey = (choice.blueprint ?? "").trim();

  if (bpKey) {
    let source;
    let label;
    if (bpKey.startsWith(SAVED_PREFIX)) {
      const row = await db.savedBlueprint.findUnique({ where: { id: bpKey.slice(SAVED_PREFIX.length) } });
      if (!row) return { error: "That saved blueprint no longer exists." };
      source = savedToSource(row);
      label = `saved blueprint "${row.name}"`;
    } else {
      const bp = getBlueprint(bpKey);
      if (!bp) return { error: "Unknown blueprint." };
      source = bp;
      label = `blueprint "${bp.name}"`;
    }
    if (!allowedModules.includes(source.moduleKey)) return { error: "You are not allowed to use this blueprint's module." };
    try {
      const cfg = blueprintSiteConfig(source, siteName);
      return { module: cfg.module, enabledSections: cfg.enabledSections, theme: cfg.theme, content: cfg.content, label };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "This blueprint could not be applied." };
    }
  }

  const mod = getModule(choice.moduleKey ?? "");
  if (!mod || !allowedModules.includes(mod.key)) return { error: "You are not allowed to use this module." };
  const cfg = initialSiteConfig(mod, choice.preset || undefined, siteName);
  return { module: mod, enabledSections: cfg.enabledSections, theme: cfg.theme, content: cfg.content, label: mod.name };
}
