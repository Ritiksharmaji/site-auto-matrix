"use server";

import { revalidatePath } from "next/cache";
import { contentForSaving } from "@/blueprints";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { siteScope } from "@/lib/permissions";
import { getModule } from "@/modules/registry";
import { cleanTheme } from "@/modules/theme";
import type { Theme } from "@/modules/types";

export type BlueprintResult = { ok: boolean; error?: string };

/** "Save as blueprint": stores a site's sections, design and content so the team can reuse it. */
export async function saveSiteAsBlueprint(siteId: string, name: string, description: string): Promise<BlueprintResult> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "CLIENT") throw new Error("Not allowed");
    const site = await db.site.findFirst({ where: { id: siteId, ...siteScope(user) } });
    if (!site) throw new Error("Website not found");
    const mod = getModule(site.moduleKey);
    if (!mod) throw new Error("Unknown module");
    const cleanName = name.trim().slice(0, 80);
    if (cleanName.length < 3) throw new Error("Give the blueprint a name (at least 3 characters).");
    await db.savedBlueprint.create({
      data: {
        name: cleanName,
        description: description.trim().slice(0, 300),
        moduleKey: site.moduleKey,
        enabledSections: site.enabledSections ?? [],
        theme: cleanTheme(mod, { ...(site.theme as Theme) }),
        content: contentForSaving(site.content),
        createdById: user.id,
      },
    });
    await logActivity(user.id, "blueprint.save", `${user.name} saved "${site.name}" as blueprint "${cleanName}"`);
    revalidatePath("/admin/blueprints");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save the blueprint" };
  }
}

/** Delete a saved blueprint: its creator or a super admin. Sites made from it are not affected. */
export async function deleteSavedBlueprint(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role === "CLIENT") throw new Error("Not allowed");
  const id = String(formData.get("id"));
  const row = await db.savedBlueprint.findUnique({ where: { id } });
  if (!row) return;
  if (user.role !== "SUPER_ADMIN" && row.createdById !== user.id) throw new Error("Only the person who saved it or the admin can delete it");
  await db.savedBlueprint.delete({ where: { id } });
  await logActivity(user.id, "blueprint.delete", `${user.name} deleted saved blueprint "${row.name}"`);
  revalidatePath("/admin/blueprints");
}
