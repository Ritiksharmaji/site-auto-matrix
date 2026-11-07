import "server-only";
import type { CodeFramework, Prisma } from "@prisma/client";
import { blueprintSiteConfig, getBlueprint, SAVED_PREFIX, savedToSource } from "@/blueprints";
import { CODE_MODULE_KEY, createCodeRepo, FRAMEWORKS } from "@/lib/code-sites";
import { forgetCodeSiteLookups } from "@/lib/code-site-lookup";
import { db } from "@/lib/db";
import type { StaffPermissions } from "@/lib/permissions";
import { siteUrl } from "@/lib/sites";
import { getModule, initialSiteConfig } from "@/modules/registry";
import type { ModuleDef } from "@/modules/types";

type StartChoice = { moduleKey?: string; preset?: string; blueprint?: string; codeFramework?: string };
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

/**
 * Everything needed to create the new Site row, for all three ways to start:
 * Standard (module + design, the default), Blueprint, or Code website. For a code
 * website this also creates the GitHub repo, so call it after all other checks.
 */
export async function siteStartData(
  choice: StartChoice,
  perms: StaffPermissions,
  site: { name: string; slug: string },
): Promise<{ error: string } | { data: Omit<Prisma.SiteUncheckedCreateInput, "clientId" | "name" | "slug">; label: string }> {
  if (choice.codeFramework) {
    const fw = FRAMEWORKS.find((f) => f.value === choice.codeFramework);
    if (!fw) return { error: "Choose React, Next.js or HTML for the code website." };
    if (!perms.canCreateCodeSites) return { error: "You are not allowed to create code websites. Ask the admin." };
    try {
      const repo = await createCodeRepo({ slug: site.slug, name: site.name, framework: fw.value as CodeFramework, url: siteUrl({ slug: site.slug, customDomain: null }) });
      forgetCodeSiteLookups();
      return {
        label: `code website, ${fw.label}`,
        data: {
          moduleKey: CODE_MODULE_KEY,
          enabledSections: [],
          theme: {},
          content: { brand: { siteName: site.name } },
          codeProject: { create: { framework: fw.value as CodeFramework, repoOwner: repo.owner, repoName: repo.repoName, branch: repo.branch, webhookId: repo.webhookId } },
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create the GitHub repository.";
      return { error: /already exists|name already/i.test(msg) ? `A GitHub repository named site-${site.slug} already exists. Choose another web address.` : msg };
    }
  }
  const config = await resolveSiteStart(choice, perms.allowedModules, site.name);
  if ("error" in config) return config;
  return {
    label: config.label,
    data: {
      moduleKey: config.module.key,
      enabledSections: config.enabledSections,
      theme: config.theme as Prisma.InputJsonValue,
      content: config.content as Prisma.InputJsonValue,
    },
  };
}
