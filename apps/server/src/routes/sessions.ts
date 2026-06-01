import type { FastifyInstance } from "fastify";
import { getClient } from "../opencode.js";

type Part =
  | { type: "text"; text: string }
  | { type: "file"; url?: string; mime?: string; filename?: string };

async function loadSession(id: string) {
  const client = getClient();
  return client.session.get({ path: { id } });
}

export async function sessionRoutes(app: FastifyInstance) {
  app.get("/api/sessions", async () => {
    const client = getClient();
    const sessions = await client.session.list();
    return { sessions: sessions.data ?? [] };
  });

  app.post("/api/sessions", async (req) => {
    const client = getClient();
    const body = (req.body ?? {}) as { title?: string };
    const created = await client.session.create({
      body: { title: body.title ?? "New chat" },
    });
    return { session: created.data };
  });

  app.get<{ Params: { id: string } }>("/api/sessions/:id", async (req, reply) => {
    try {
      const session = await loadSession(req.params.id);
      return { session: session.data };
    } catch (err) {
      return reply.notFound((err as Error).message);
    }
  });

  app.get<{ Params: { id: string } }>("/api/sessions/:id/messages", async (req, reply) => {
    try {
      const client = getClient();
      const messages = await client.session.messages({ path: { id: req.params.id } });
      return { messages: messages.data ?? [] };
    } catch (err) {
      return reply.notFound((err as Error).message);
    }
  });

  app.delete<{ Params: { id: string } }>("/api/sessions/:id", async (req) => {
    const client = getClient();
    const result = await client.session.delete({ path: { id: req.params.id } });
    return { ok: result.data ?? true };
  });

  app.post<{ Params: { id: string }; Body: { title: string } }>(
    "/api/sessions/:id/rename",
    async (req) => {
      const client = getClient();
      const updated = await client.session.update({
        path: { id: req.params.id },
        body: { title: req.body.title },
      });
      return { session: updated.data };
    },
  );
}

export type { Part };
