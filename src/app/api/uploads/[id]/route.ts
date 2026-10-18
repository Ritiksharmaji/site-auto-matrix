import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { uploadDir } from "@/lib/uploads";

/** Serve an uploaded image. Public, since images appear on public websites. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const asset = await db.asset.findUnique({ where: { id: (await params).id } });
  if (!asset) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(uploadDir(), path.basename(asset.storedName)));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": asset.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
