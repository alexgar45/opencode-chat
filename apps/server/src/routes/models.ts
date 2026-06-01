import type { FastifyInstance } from "fastify";
import { getClient } from "../opencode.js";

type ModelEntry = {
  providerID: string;
  providerName: string;
  modelID: string;
  modelName: string;
  isDefault: boolean;
};

export async function modelRoutes(app: FastifyInstance) {
  app.get("/api/models", async (_req, reply) => {
    const client = getClient();
    let response: { data?: unknown; error?: unknown };
    try {
      response = (await client.config.providers()) as { data?: unknown; error?: unknown };
    } catch (err) {
      app.log.error({ err }, "config.providers() threw");
      return reply.code(502).send({
        error: "OpencodeUnreachable",
        message: `No pude hablar con el server de opencode: ${(err as Error).message}`,
      });
    }

    if (response.error) {
      app.log.error({ error: response.error }, "config.providers() returned error");
      return reply.code(502).send({
        error: "OpencodeError",
        message: `opencode devolvió un error: ${JSON.stringify(response.error)}`,
      });
    }

    const data = (response.data ?? {}) as {
      providers?: Array<{
        id?: string;
        name?: string;
        models?: Record<string, { name?: string }>;
      }>;
      default?: Record<string, string>;
    };

    const providers = data.providers ?? [];
    const defaults = data.default ?? {};

    const result: ModelEntry[] = [];

    for (const provider of providers) {
      const providerID = provider.id;
      if (!providerID) continue;
      const providerName = provider.name ?? providerID;
      const modelsRecord = provider.models ?? {};
      for (const [modelID, model] of Object.entries(modelsRecord)) {
        result.push({
          providerID,
          providerName,
          modelID,
          modelName: model?.name ?? modelID,
          isDefault: defaults[providerID] === modelID,
        });
      }
    }

    result.sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.providerID.localeCompare(b.providerID) || a.modelID.localeCompare(b.modelID);
    });

    return { models: result };
  });
}
