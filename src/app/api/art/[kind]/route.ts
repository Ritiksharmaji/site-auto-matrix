import { parseArtParams, renderArt } from "@/lib/art";

/** Placeholder artwork for blueprints (see src/lib/art.ts). Public and cacheable. */
export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const svg = renderArt(kind, parseArtParams(new URL(req.url).searchParams));
  if (!svg) return new Response("unknown art", { status: 404 });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=604800, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
