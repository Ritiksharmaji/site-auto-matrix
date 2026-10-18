import { getCurrentUser } from "@/lib/auth";
import { enquiryWhere, formLabel } from "@/lib/crm";
import { db } from "@/lib/db";

/** CSV download of the enquiries the current user can see, using the same filters as the list. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const filters = { status: sp.get("status") ?? undefined, siteId: sp.get("siteId") ?? undefined, q: sp.get("q") ?? undefined, assigned: sp.get("assigned") ?? undefined };

  const rows = await db.enquiry.findMany({
    where: enquiryWhere(user, filters),
    orderBy: { createdAt: "desc" },
    include: { site: { select: { name: true, moduleKey: true } }, assignedTo: { select: { name: true } } },
  });

  const header = ["Received", "Name", "Phone", "Email", "Message", "Form", "Website", "Status", "Assigned to"];
  const lines = rows.map((r) =>
    [r.createdAt.toISOString(), r.name, r.phone, r.email, r.message, formLabel(r.site.moduleKey, r.formType), r.site.name, r.status, r.assignedTo?.name]
      .map(csvCell)
      .join(","),
  );
  const csv = "﻿" + [header.join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csvCell(v: unknown) {
  let s = v == null ? "" : String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
