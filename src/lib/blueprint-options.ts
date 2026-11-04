import "server-only";
import { BLUEPRINT_CATEGORIES, BLUEPRINTS, SAVED_PREFIX } from "@/blueprints";
import { db } from "@/lib/db";
import { getModule } from "@/modules/registry";
import type { Theme } from "@/modules/types";

/** Serializable blueprint summary for the gallery and the "New website" picker. */
export type BlueprintOption = {
  key: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  moduleKey: string;
  moduleName: string;
  primary: string;
  secondary: string;
  background: string;
  headingFont: string;
  saved?: { by: string; canDelete: boolean };
};

export const SAVED_CATEGORY = { key: "saved", label: "Saved by the team", description: "Designs saved from real sites with “Save as blueprint”" };

export function blueprintCategories() {
  return [...BLUEPRINT_CATEGORIES, SAVED_CATEGORY];
}

function summary(theme: Theme) {
  return { primary: theme.primary, secondary: theme.secondary, background: theme.background, headingFont: theme.headingFont };
}

/** Built-in and saved blueprints whose module the user may use. */
export async function blueprintOptions(user: { id: string; role: string }, allowedModules: string[]): Promise<BlueprintOption[]> {
  const builtIn = BLUEPRINTS.filter((b) => allowedModules.includes(b.moduleKey)).map((b) => ({
    key: b.key,
    name: b.name,
    category: b.category,
    description: b.description,
    tags: b.tags,
    moduleKey: b.moduleKey,
    moduleName: getModule(b.moduleKey)?.name ?? b.moduleKey,
    ...summary(b.theme),
  }));
  const saved = await db.savedBlueprint.findMany({
    where: { moduleKey: { in: allowedModules } },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });
  return [
    ...builtIn,
    ...saved.map((s) => ({
      key: `${SAVED_PREFIX}${s.id}`,
      name: s.name,
      category: SAVED_CATEGORY.key,
      description: s.description,
      tags: ["Saved"],
      moduleKey: s.moduleKey,
      moduleName: getModule(s.moduleKey)?.name ?? s.moduleKey,
      ...summary(s.theme as unknown as Theme),
      saved: { by: s.createdBy?.name ?? "former member", canDelete: user.role === "SUPER_ADMIN" || s.createdById === user.id },
    })),
  ];
}
