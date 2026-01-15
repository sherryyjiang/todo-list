import { getTransport } from "@/lib/mcp/transports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSessionId(url: string) {
  return new URL(url).searchParams.get("sessionId");
}

export async function POST(request: Request) {
  const sessionId = getSessionId(request.url);
  if (!sessionId) {
    return new Response("Missing sessionId", { status: 400 });
  }

  const transport = getTransport(sessionId);
  if (!transport) {
    return new Response("Unknown session", { status: 404 });
  }

  const body = await request.json();
  await transport.handleMessage(body, {
    requestInfo: { headers: Object.fromEntries(request.headers.entries()) },
  });

  return new Response("Accepted", {
    status: 202,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
