"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { DEFAULT_AUTOMATION, parseEmails, type AutomationSettings } from "@/lib/automation";
import { canPublish, siteScope } from "@/lib/permissions";
import { isReservedSlug } from "@/lib/hosts";
import { forgetCodeSiteLookups } from "@/lib/code-site-lookup";
import { getModule } from "@/modules/registry";
import { cleanTheme } from "@/modules/theme";
import { sanitizeContent } from "@/modules/content";
import type { ModuleDef, Theme } from "@/modules/types";

export type SaveResult = { ok: boolean; error?: string };

async function loadSite(siteId: string, opts: { staffOnly: boolean }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  if (opts.staffOnly && user.role === "CLIENT") throw new Error("Not allowed");
  const site = await db.site.findFirst({ where: { id: siteId, ...siteScope(user) } });
  if (!site) throw new Error("Website not found");
  const mod = getModule(site.moduleKey);
  // Code websites have no module: only settings, publishing and automation apply to them.
  if (!mod && site.moduleKey !== "code") throw new Error("Unknown module");
  return { user, site, mod: mod as ModuleDef };
}

/** For actions that edit sections, design or content (builder sites only). */
async function loadBuilderSite(siteId: string, opts: { staffOnly: boolean }) {
  const loaded = await loadSite(siteId, opts);
  if (loaded.site.moduleKey === "code") throw new Error("This is a code website: edit it in VS Code and push.");
  return loaded;
}

function refresh(siteId: string) {
  revalidatePath(`/admin/sites/${siteId}`);
  revalidatePath(`/portal/sites/${siteId}`);
}

async function guarded(fn: () => Promise<void>): Promise<SaveResult> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function saveSections(siteId: string, keys: string[]): Promise<SaveResult> {
  return guarded(async () => {
    const { user, mod } = await loadBuilderSite(siteId, { staffOnly: true });
    const known = new Set(mod.sections.map((s) => s.key));
    // Keep the order chosen in the builder; required sections are always on.
    const enabled = Array.from(new Set(keys.filter((k) => known.has(k))));
    for (const s of mod.sections) if (s.required && !enabled.includes(s.key)) enabled.push(s.key);
    await db.site.update({ where: { id: siteId }, data: { enabledSections: enabled } });
    await log(user, siteId, "updated sections");
    refresh(siteId);
  });
}

export async function saveTheme(siteId: string, theme: Theme): Promise<SaveResult> {
  return guarded(async () => {
    const { user, mod } = await loadBuilderSite(siteId, { staffOnly: true });
    await db.site.update({ where: { id: siteId }, data: { theme: cleanTheme(mod, theme) as Prisma.InputJsonValue } });
    await log(user, siteId, "changed the design");
    refresh(siteId);
  });
}

export async function saveContent(siteId: string, content: Record<string, unknown>): Promise<SaveResult> {
  return guarded(async () => {
    const { user, mod } = await loadBuilderSite(siteId, { staffOnly: false });
    await db.site.update({ where: { id: siteId }, data: { content: sanitizeContent(mod, content) as Prisma.InputJsonValue } });
    await log(user, siteId, "edited content");
    refresh(siteId);
  });
}

const slugRe = /^[a-z0-9](?:[a-z0-9-]{0,40}[a-z0-9])?$/;
const domainRe = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export async function saveSettings(siteId: string, data: { name: string; slug: string; customDomain: string }): Promise<SaveResult> {
  return guarded(async () => {
    const { user } = await loadSite(siteId, { staffOnly: true });
    const name = data.name.trim();
    const slug = data.slug.trim().toLowerCase();
    const customDomain = data.customDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || null;
    if (name.length < 2) throw new Error("Website name is required");
    if (!slugRe.test(slug)) throw new Error("Web address: lowercase letters, numbers and dashes only");
    if (isReservedSlug(slug)) throw new Error("That web address is reserved");
    if (customDomain && !domainRe.test(customDomain)) throw new Error("Enter a valid domain, e.g. www.myschool.com");
    const clash = await db.site.findFirst({
      where: { id: { not: siteId }, OR: [{ slug }, ...(customDomain ? [{ customDomain }] : [])] },
    });
    if (clash) throw new Error(clash.slug === slug ? "That web address is taken" : "That domain is used by another site");
    await db.site.update({ where: { id: siteId }, data: { name, slug, customDomain } });
    forgetCodeSiteLookups();
    await log(user, siteId, "updated settings");
    refresh(siteId);
  });
}

export async function setPublished(siteId: string, publish: boolean): Promise<SaveResult> {
  return guarded(async () => {
    const { user } = await loadSite(siteId, { staffOnly: true });
    if (!canPublish(user)) throw new Error("You don't have permission to publish. Ask the admin.");
    await db.site.update({
      where: { id: siteId },
      data: { status: publish ? "PUBLISHED" : "DRAFT", publishedAt: publish ? new Date() : null },
    });
    await log(user, siteId, publish ? "published the website" : "unpublished the website");
    refresh(siteId);
  });
}

export async function saveAutomation(siteId: string, input: AutomationSettings): Promise<SaveResult> {
  return guarded(async () => {
    const { user } = await loadSite(siteId, { staffOnly: true });
    const clean: AutomationSettings = {
      notifyClient: !!input.notifyClient,
      notifyOwner: !!input.notifyOwner,
      extraEmails: parseEmails(String(input.extraEmails ?? "")).join(", "),
      whatsappNotify: !!input.whatsappNotify,
      whatsappNumber: String(input.whatsappNumber ?? "").replace(/[^\d]/g, "").slice(0, 15),
      autoReply: !!input.autoReply,
      autoReplySubject: String(input.autoReplySubject ?? "").slice(0, 200) || DEFAULT_AUTOMATION.autoReplySubject,
      autoReplyBody: String(input.autoReplyBody ?? "").slice(0, 3000) || DEFAULT_AUTOMATION.autoReplyBody,
    };
    if (clean.whatsappNotify && clean.whatsappNumber.length < 10) throw new Error("Enter the WhatsApp number with country code, e.g. 919876543210");
    await db.site.update({ where: { id: siteId }, data: { automation: clean } });
    await log(user, siteId, "updated automation settings");
    refresh(siteId);
  });
}

async function log(user: CurrentUser, siteId: string, what: string) {
  const site = await db.site.findUnique({ where: { id: siteId }, select: { name: true } });
  await logActivity(user.id, "site.update", `${user.name} ${what} on "${site?.name}"`);
}
