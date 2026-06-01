import { createOpencodeClient, type OpencodeClient } from "@opencode-ai/sdk";

export type ChatClient = OpencodeClient;

let cached: ChatClient | null = null;

export function getClient(): ChatClient {
  if (cached) return cached;

  const baseUrl = process.env.OPENCODE_SERVER_URL ?? "http://127.0.0.1:4096";
  const username = process.env.OPENCODE_SERVER_USERNAME;
  const password = process.env.OPENCODE_SERVER_PASSWORD;

  const headers: Record<string, string> = {};
  if (username && password) {
    const token = Buffer.from(`${username}:${password}`).toString("base64");
    headers.Authorization = `Basic ${token}`;
  }

  cached = createOpencodeClient({
    baseUrl,
    headers,
  });

  return cached;
}
