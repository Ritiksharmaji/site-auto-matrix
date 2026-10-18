"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, requireStaff, requireSuperAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { clientScope, DEFAULT_STAFF_PERMISSIONS, staffPermissions, type StaffPermissions } from "@/lib/permissions";
import { getModule, initialSiteConfig } from "@/modules/registry";

export type FormState = { error?: string; ok?: string };

const slugRe = /^[a-z0-9](?:[a-z0-9-]{0,40}[a-z0-9])?$/;
const RESERVED_SLUGS = new Set(["www", "admin", "api", "app", "portal", "login", "mail"]);

// ---------- Clients ----------

const newClientSchema = z.object({
  name: z.string().trim().min(2, "Business name is required"),
  contactName: z.string().trim().min(2, "Contact name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "Client password must be at least 8 characters"),
  moduleKey: z.string(),
  preset: z.string().optional(),
  slug: z.string().trim().toLowerCase().regex(slugRe, "Web address: lowercase letters, numbers and dashes only"),
});

/** Creates the client business, its login, and its first website in one step. */
export async function createClient(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const parsed = newClientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const perms = staffPermissions(user);
  const owned = await db.client.count({ where: { ownerId: user.id } });
  if (user.role === "STAFF" && owned >= perms.maxClients) {
    return { error: `You have reached your limit of ${perms.maxClients} clients. Ask the admin to raise it.` };
  }
  const mod = getModule(d.moduleKey);
  if (!mod || !perms.allowedModules.includes(mod.key)) return { error: "You are not allowed to use this module." };
  if (RESERVED_SLUGS.has(d.slug)) return { error: "That web address is reserved." };
  if (await db.site.findUnique({ where: { slug: d.slug } })) return { error: "That web address is already taken." };
  if (await db.user.findUnique({ where: { email: d.email } })) return { error: "A login with this email already exists." };

  const config = initialSiteConfig(mod, d.preset, d.name);
  const passwordHash = await hashPassword(d.password);

  const client = await db.$transaction(async (tx) => {
    const c = await tx.client.create({
      data: { name: d.name, contactName: d.contactName, email: d.email, phone: d.phone || null, ownerId: user.id },
    });
    await tx.user.create({
      data: { name: d.contactName, email: d.email, passwordHash, role: "CLIENT", clientId: c.id, createdById: user.id },
    });
    await tx.site.create({
      data: {
        clientId: c.id,
        name: d.name,
        slug: d.slug,
        moduleKey: mod.key,
        enabledSections: config.enabledSections,
        theme: config.theme as Prisma.InputJsonValue,
        content: config.content as Prisma.InputJsonValue,
      },
    });
    return c;
  });

  await logActivity(user.id, "client.create", `${user.name} created client "${d.name}" (${mod.name})`);
  revalidatePath("/admin");
  redirect(`/admin/clients/${client.id}`);
}

const updateClientSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(2),
  contactName: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function updateClient(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const parsed = updateClientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, ...data } = parsed.data;
  const res = await db.client.updateMany({ where: { id, ...clientScope(user) }, data: { ...data, phone: data.phone || null, notes: data.notes || null } });
  if (!res.count) return { error: "Client not found." };
  revalidatePath(`/admin/clients/${id}`);
  return { ok: "Saved" };
}

export async function deleteClient(formData: FormData) {
  const user = await requireStaff();
  if (!staffPermissions(user).canDeleteClients) throw new Error("Not allowed");
  const id = String(formData.get("id"));
  const client = await db.client.findFirst({ where: { id, ...clientScope(user) } });
  if (!client) throw new Error("Not found");
  await db.client.delete({ where: { id } });
  await logActivity(user.id, "client.delete", `${user.name} deleted client "${client.name}"`);
  revalidatePath("/admin");
  redirect("/admin/clients");
}

/** Add another website for an existing client. */
export async function createSiteForClient(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const clientId = String(formData.get("clientId"));
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const moduleKey = String(formData.get("moduleKey") ?? "");
  const preset = String(formData.get("preset") ?? "") || undefined;

  const client = await db.client.findFirst({ where: { id: clientId, ...clientScope(user) } });
  if (!client) return { error: "Client not found." };
  const mod = getModule(moduleKey);
  if (!mod || !staffPermissions(user).allowedModules.includes(mod.key)) return { error: "You are not allowed to use this module." };
  if (name.length < 2) return { error: "Website name is required." };
  if (!slugRe.test(slug) || RESERVED_SLUGS.has(slug)) return { error: "Web address: lowercase letters, numbers and dashes only." };
  if (await db.site.findUnique({ where: { slug } })) return { error: "That web address is already taken." };

  const config = initialSiteConfig(mod, preset, name);
  const site = await db.site.create({
    data: {
      clientId,
      name,
      slug,
      moduleKey: mod.key,
      enabledSections: config.enabledSections,
      theme: config.theme as Prisma.InputJsonValue,
      content: config.content as Prisma.InputJsonValue,
    },
  });
  await logActivity(user.id, "site.create", `${user.name} created website "${name}" for ${client.name}`);
  redirect(`/admin/sites/${site.id}`);
}

/** Add another login for a client, or reset an existing client login's password. */
export async function setClientLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const clientId = String(formData.get("clientId"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const client = await db.client.findFirst({ where: { id: clientId, ...clientScope(user) } });
  if (!client) return { error: "Client not found." };
  if (!z.string().email().safeParse(email).success) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing && existing.clientId !== clientId) return { error: "This email belongs to another account." };
  const passwordHash = await hashPassword(password);
  if (existing) {
    await db.user.update({ where: { id: existing.id }, data: { passwordHash } });
    await logActivity(user.id, "client.password", `${user.name} reset password for ${email}`);
    revalidatePath(`/admin/clients/${clientId}`);
    return { ok: "Password updated." };
  }
  if (name.length < 2) return { error: "Name is required for a new login." };
  await db.user.create({ data: { name, email, passwordHash, role: "CLIENT", clientId, createdById: user.id } });
  await logActivity(user.id, "client.login", `${user.name} added login ${email} for ${client.name}`);
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: "Login created." };
}

// ---------- Team (super admin only) ----------

function readPermissions(formData: FormData): StaffPermissions {
  const max = Number(formData.get("maxClients"));
  return {
    maxClients: Number.isFinite(max) && max >= 0 ? Math.floor(max) : DEFAULT_STAFF_PERMISSIONS.maxClients,
    canPublish: formData.get("canPublish") === "on",
    canDeleteClients: formData.get("canDeleteClients") === "on",
    allowedModules: formData.getAll("allowedModules").map(String).filter((k) => getModule(k)),
  };
}

export async function createTeamMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSuperAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "SUPER_ADMIN" ? "SUPER_ADMIN" : "STAFF";
  if (name.length < 2) return { error: "Name is required." };
  if (!z.string().email().safeParse(email).success) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (await db.user.findUnique({ where: { email } })) return { error: "A user with this email already exists." };

  await db.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: await hashPassword(password),
      createdById: admin.id,
      permissions: role === "STAFF" ? readPermissions(formData) : {},
    },
  });
  await logActivity(admin.id, "team.create", `${admin.name} added ${role === "STAFF" ? "team member" : "super admin"} ${name}`);
  redirect("/admin/team");
}

export async function updateTeamMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSuperAdmin();
  const id = String(formData.get("id"));
  const member = await db.user.findUnique({ where: { id } });
  if (!member || member.role === "CLIENT") return { error: "User not found." };

  const password = String(formData.get("password") ?? "");
  if (password && password.length < 8) return { error: "Password must be at least 8 characters." };

  await db.user.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? member.name).trim() || member.name,
      ...(member.role === "STAFF" ? { permissions: readPermissions(formData) } : {}),
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });
  await logActivity(admin.id, "team.update", `${admin.name} updated access for ${member.name}`);
  revalidatePath("/admin/team");
  return { ok: "Saved" };
}

export async function setUserActive(formData: FormData) {
  const admin = await requireSuperAdmin();
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";
  if (id === admin.id) throw new Error("You cannot deactivate yourself");
  const u = await db.user.update({ where: { id }, data: { isActive: active } });
  await logActivity(admin.id, "user.active", `${admin.name} ${active ? "activated" : "deactivated"} ${u.name}`);
  revalidatePath("/admin/team");
  revalidatePath(`/admin/team/${id}`);
}

/** Move a client to a different team member. */
export async function reassignClient(formData: FormData) {
  const admin = await requireSuperAdmin();
  const id = String(formData.get("id"));
  const ownerId = String(formData.get("ownerId"));
  const owner = await db.user.findFirst({ where: { id: ownerId, role: { in: ["SUPER_ADMIN", "STAFF"] } } });
  if (!owner) throw new Error("Invalid owner");
  const c = await db.client.update({ where: { id }, data: { ownerId } });
  await logActivity(admin.id, "client.reassign", `${admin.name} assigned "${c.name}" to ${owner.name}`);
  revalidatePath(`/admin/clients/${id}`);
}
