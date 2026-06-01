import type { FastifyInstance } from "fastify";

const OPENCODE_SERVER_URL = process.env.OPENCODE_SERVER_URL ?? "http://127.0.0.1:4096";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => {
    try {
      const res = await fetch(`${OPENCODE_SERVER_URL}/global/health`);
      if (!res.ok) {
        return {
          ok: false,
          opencode: null,
          error: `HTTP ${res.status} ${res.statusText}`,
        };
      }
      const data = (await res.json()) as { healthy?: boolean; version?: string };
      return { ok: true, opencode: data };
    } catch (err) {
      return {
        ok: false,
        opencode: null,
        error: (err as Error).message,
      };
    }
  });
}
