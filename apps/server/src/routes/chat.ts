import type { FastifyInstance } from "fastify";
import type { SessionPromptData } from "@opencode-ai/sdk";
import { getClient } from "../opencode.js";

type ChatBody = {
  sessionId?: string;
  message: string;
  model?: { providerID: string; modelID: string };
  system?: string;
  title?: string;
};

export async function chatRoutes(app: FastifyInstance) {
  app.post("/api/chat", async (req, reply) => {
    const body = req.body as ChatBody;
    if (!body?.message || typeof body.message !== "string") {
      return reply.badRequest("`message` is required");
    }

    const client = getClient();

    let sessionID = body.sessionId;
    if (!sessionID) {
      const title = body.title ?? body.message.slice(0, 60);
      const created = await client.session.create({ body: { title } });
      if (!created.data) {
        return reply.internalServerError("Failed to create session");
      }
      sessionID = created.data.id;
    }

    const promptBody: NonNullable<SessionPromptData["body"]> = {
      parts: [{ type: "text", text: body.message }],
    };
    if (body.model) promptBody.model = body.model;
    if (body.system) promptBody.system = body.system;

    try {
      const result = await client.session.prompt({
        path: { id: sessionID },
        body: promptBody,
      });

      if (result.error) {
        const errMsg =
          (result.error as { data?: { message?: string } }).data?.message ??
          (result.error as { message?: string }).message ??
          "opencode returned an error";
        app.log.error({ error: result.error }, "opencode prompt error");
        return reply.code(502).send({
          error: "OpencodeError",
          message: errMsg,
        });
      }

      const data = (result.data ?? {}) as {
        info?: { id?: string };
        parts?: Array<{ type: string; text?: string }>;
      };

      const text = (data.parts ?? [])
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text as string)
        .join("");

      return {
        session: { id: sessionID },
        messageID: data.info?.id ?? null,
        text,
      };
    } catch (err) {
      app.log.error({ err }, "prompt failed");
      return reply.code(502).send({
        error: "OpencodeUnreachable",
        message: (err as Error).message,
      });
    }
  });
}
