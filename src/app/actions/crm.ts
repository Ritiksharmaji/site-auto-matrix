"use server";

import type { EnquiryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { siteScope } from "@/lib/permissions";

// Enquiry pipeline actions. Admin, team and clients can update status and add
// notes on enquiries they can see; only platform users can assign.

export type CrmResult = { ok: boolean; error?: string };

const STATUSES: EnquiryStatus[] = ["NEW", "CONTACTED", "CONVERTED", "LOST"];

async function loadEnquiry(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  const enquiry = await db.enquiry.findFirst({ where: { id, site: siteScope(user) }, include: { site: { select: { name: true } } } });
  if (!enquiry) throw new Error("Enquiry not found");
  return { user, enquiry };
}

function refresh(id: string, siteId: string) {
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath(`/admin/sites/${siteId}`);
  revalidatePath("/portal/enquiries");
  revalidatePath(`/portal/sites/${siteId}`);
}

async function run(fn: () => Promise<void>): Promise<CrmResult> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function setEnquiryStatus(id: string, status: EnquiryStatus): Promise<CrmResult> {
  return run(async () => {
    if (!STATUSES.includes(status)) throw new Error("Invalid status");
    const { user, enquiry } = await loadEnquiry(id);
    await db.enquiry.update({ where: { id }, data: { status } });
    await logActivity(user.id, "enquiry.status", `${user.name} marked enquiry from ${enquiry.name} (${enquiry.site.name}) as ${status.toLowerCase()}`);
    refresh(id, enquiry.siteId);
  });
}

export async function assignEnquiry(id: string, assigneeId: string | null): Promise<CrmResult> {
  return run(async () => {
    const { user, enquiry } = await loadEnquiry(id);
    if (user.role === "CLIENT") throw new Error("Not allowed");
    if (assigneeId) {
      // Team members can only take enquiries themselves; the super admin can assign anyone on the team.
      if (user.role === "STAFF" && assigneeId !== user.id) throw new Error("You can only assign enquiries to yourself");
      const assignee = await db.user.findFirst({ where: { id: assigneeId, role: { in: ["SUPER_ADMIN", "STAFF"] }, isActive: true } });
      if (!assignee) throw new Error("Invalid team member");
    }
    await db.enquiry.update({ where: { id }, data: { assignedToId: assigneeId } });
    refresh(id, enquiry.siteId);
  });
}

export async function addEnquiryNote(id: string, body: string): Promise<CrmResult> {
  return run(async () => {
    const text = body.trim().slice(0, 2000);
    if (!text) throw new Error("Write a note first");
    const { user, enquiry } = await loadEnquiry(id);
    await db.enquiryNote.create({ data: { enquiryId: id, authorId: user.id, body: text } });
    // Adding the first note on a new enquiry moves it along the pipeline.
    if (enquiry.status === "NEW") await db.enquiry.update({ where: { id }, data: { status: "CONTACTED" } });
    refresh(id, enquiry.siteId);
  });
}
