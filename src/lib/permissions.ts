import type { Prisma, User } from "@prisma/client";
import { MODULES } from "@/modules/registry";

/** Limits the super admin sets for each team member. */
export type StaffPermissions = {
  maxClients: number;
  canPublish: boolean;
  canDeleteClients: boolean;
  allowedModules: string[];
};

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  maxClients: 20,
  canPublish: false,
  canDeleteClients: false,
  allowedModules: MODULES.map((m) => m.key),
};

type PermUser = Pick<User, "id" | "role" | "permissions" | "clientId">;

export function staffPermissions(user: PermUser): StaffPermissions {
  if (user.role === "SUPER_ADMIN") {
    return {
      maxClients: Infinity,
      canPublish: true,
      canDeleteClients: true,
      allowedModules: MODULES.map((m) => m.key),
    };
  }
  return { ...DEFAULT_STAFF_PERMISSIONS, ...((user.permissions as Partial<StaffPermissions>) ?? {}) };
}

/** Prisma filter for the clients a user may see. */
export function clientScope(user: PermUser): Prisma.ClientWhereInput {
  if (user.role === "SUPER_ADMIN") return {};
  if (user.role === "STAFF") return { ownerId: user.id };
  return { id: user.clientId ?? "__none__" };
}

/** Prisma filter for the sites a user may see. */
export function siteScope(user: PermUser): Prisma.SiteWhereInput {
  if (user.role === "SUPER_ADMIN") return {};
  return { client: clientScope(user) };
}

export function canPublish(user: PermUser) {
  return staffPermissions(user).canPublish && user.role !== "CLIENT";
}
