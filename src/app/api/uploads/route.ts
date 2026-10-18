import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteScope } from "@/lib/permissions";
import { MAX_UPLOAD_BYTES, sniffImage, uploadDir } from "@/lib/uploads";

/** Upload an image (logo, photo). Returns { url } usable in any site content field. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Please sign in again." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const siteId = form.get("siteId") ? String(form.get("siteId")) : null;
  if (!(file instanceof File)) return Response.json({ error: "No file received." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Image is larger than 5 MB." }, { status: 413 });
  if (siteId && !(await db.site.count({ where: { id: siteId, ...siteScope(user) } }))) {
    return Response.json({ error: "Website not found." }, { status: 404 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(buf);
  if (!type) return Response.json({ error: "Only PNG, JPG, WEBP or GIF images are allowed." }, { status: 415 });

  const storedName = `${randomBytes(16).toString("hex")}.${type.ext}`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(uploadDir(), storedName), buf);
  const asset = await db.asset.create({
    data: { siteId, uploadedById: user.id, filename: file.name.slice(0, 200), storedName, mimeType: type.mime, size: buf.length },
  });
  return Response.json({ url: `/api/uploads/${asset.id}` });
}
