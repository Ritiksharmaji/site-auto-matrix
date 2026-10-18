import { db } from "./db";
import { buildRenderProps, siteUrl } from "./sites";

/** Load enquiries for a site in a client-component-friendly shape. */
export async function loadEnquiries(siteId: string) {
  const rows = await db.enquiry.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, name: true, phone: true, email: true, status: true, createdAt: true },
  });
  return rows.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }));
}

export function editorProps(site: Parameters<typeof buildRenderProps>[0] & { name: string; slug: string; customDomain: string | null; status: "DRAFT" | "PUBLISHED" }) {
  const render = buildRenderProps(site);
  if (!render) return null;
  return {
    site: { id: site.id, name: site.name, slug: site.slug, customDomain: site.customDomain, status: site.status, url: siteUrl(site) },
    module: render.module,
    enabledSections: render.enabledSections,
    theme: render.theme,
    brand: render.brand,
    sections: render.sections,
  };
}
