import type { FastifyInstance } from "fastify";
import { getClient } from "../opencode.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => {
    const client = getClient();
    try {
      const health = await client.global.health();
      return { ok: true, opencode: health.data };
    } catch (err) {
      return {
        ok: false,
        opencode: null,
        error: (err as Error).message,
      };
    }
  });
}
