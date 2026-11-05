import { after } from "next/server";
import { handleWorkflowRun } from "@/lib/code-sites";
import { verifyWebhookSignature } from "@/lib/github";

// GitHub calls this when a code website's deploy workflow starts and finishes
// (registered automatically on each site repo). Every call is signed.

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-hub-signature-256"))) return new Response("bad signature", { status: 401 });
  const event = req.headers.get("x-github-event");
  if (event === "ping") return new Response("pong");
  if (event !== "workflow_run") return new Response("ignored", { status: 202 });
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }
  // Downloading and unpacking a build can take a while: answer GitHub right away.
  after(() =>
    handleWorkflowRun(payload)
      .then((note) => console.log(`[deploy] ${payload.repository?.full_name} run ${payload.workflow_run?.id} ${payload.action}: ${note}`))
      .catch((e) => console.error("[deploy] webhook failed", e)),
  );
  return new Response("accepted", { status: 202 });
}
