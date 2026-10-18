import "server-only";
import type { EnquiryStatus, Prisma, User } from "@prisma/client";
import { db } from "./db";
import { siteScope } from "./permissions";
import { getModule } from "@/modules/registry";

export type EnquiryFilters = { status?: string; siteId?: string; q?: string; assigned?: string };

const STATUSES = ["NEW", "CONTACTED", "CONVERTED", "LOST"];

export function enquiryWhere(user: Pick<User, "id" | "role" | "permissions" | "clientId">, f: EnquiryFilters): Prisma.EnquiryWhereInput {
  return {
    site: siteScope(user),
    ...(f.status && STATUSES.includes(f.status) ? { status: f.status as EnquiryStatus } : {}),
    ...(f.siteId ? { siteId: f.siteId } : {}),
    ...(f.assigned === "me" ? { assignedToId: user.id } : f.assigned === "none" ? { assignedToId: null } : {}),
    ...(f.q
      ? {
          OR: [
            { name: { contains: f.q, mode: "insensitive" } },
            { email: { contains: f.q, mode: "insensitive" } },
            { phone: { contains: f.q } },
          ],
        }
      : {}),
  };
}

export function formLabel(moduleKey: string, formType: string) {
  return getModule(moduleKey)?.sections.find((s) => s.key === formType)?.label ?? formType;
}

export async function getEnquiryDetail(user: Pick<User, "id" | "role" | "permissions" | "clientId">, id: string) {
  const e = await db.enquiry.findFirst({
    where: { id, site: siteScope(user) },
    include: {
      site: { select: { name: true, moduleKey: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      notifications: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!e) return null;
  return {
    enquiry: {
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      message: e.message,
      formLabel: formLabel(e.site.moduleKey, e.formType),
      siteName: e.site.name,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      assignedToId: e.assignedToId,
    },
    notes: e.notes.map((n) => ({ id: n.id, body: n.body, author: n.author?.name ?? "Deleted user", createdAt: n.createdAt.toISOString() })),
    notifications: e.notifications.map((n) => ({
      id: n.id,
      channel: n.channel,
      recipient: n.recipient,
      subject: n.subject,
      status: n.status,
      error: n.error,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}
