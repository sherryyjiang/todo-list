import type { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const transports = new Map<string, SSEServerTransport>();

export function setTransport(sessionId: string, transport: SSEServerTransport) {
  transports.set(sessionId, transport);
}

export function getTransport(sessionId: string) {
  return transports.get(sessionId);
}

export function deleteTransport(sessionId: string) {
  transports.delete(sessionId);
}
