import "dotenv/config";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import fastifyStatic from "@fastify/static";
import { chatRoutes } from "./routes/chat.js";
import { sessionRoutes } from "./routes/sessions.js";
import { modelRoutes } from "./routes/models.js";
import { healthRoutes } from "./routes/health.js";

const port = Number(process.env.SERVER_PORT ?? 3001);
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
const staticDir = process.env.STATIC_DIR
  ? resolve(process.env.STATIC_DIR)
  : resolve(dirname(fileURLToPath(import.meta.url)), "../../web/dist");

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? "info",
  },
});

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = [webOrigin, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3001", "http://127.0.0.1:3001"];
    if (allowed.includes(origin)) return cb(null, true);
    return cb(null, true);
  },
  credentials: true,
});

await app.register(sensible);

await app.register(healthRoutes);
await app.register(modelRoutes);
await app.register(sessionRoutes);
await app.register(chatRoutes);

if (existsSync(staticDir)) {
  await app.register(fastifyStatic, {
    root: staticDir,
    prefix: "/",
    decorateReply: false,
  });
  app.log.info(`Serving static frontend from ${staticDir}`);
} else if (process.env.STATIC_DIR) {
  app.log.warn(
    `STATIC_DIR=${process.env.STATIC_DIR} does not exist (${staticDir}); not serving static files`,
  );
}

app.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith("/api/")) {
    return reply.code(404).send({ error: "NotFound", message: req.url });
  }
  if (existsSync(staticDir)) {
    return reply.sendFile("index.html");
  }
  return reply.code(404).send({ error: "NotFound", message: req.url });
});

app.setErrorHandler((error: Error & { statusCode?: number }, request, reply) => {
  request.log.error(error);
  const status = error.statusCode ?? 500;
  reply.status(status).send({
    error: error.name ?? "InternalServerError",
    message: error.message ?? "Unexpected error",
  });
});

try {
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`Chat backend ready on http://localhost:${port}`);
  app.log.info(
    `Pointing at opencode server: ${process.env.OPENCODE_SERVER_URL ?? "http://127.0.0.1:4096"}`,
  );
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
