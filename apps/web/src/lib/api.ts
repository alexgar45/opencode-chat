import type { ChatSession, Model, ModelRef } from "./types";
import { modelKey } from "./types";

async function jsonFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchHealth(): Promise<{
  ok: boolean;
  opencode: { healthy: boolean; version?: string } | null;
  error?: string;
}> {
  return jsonFetch("/api/health");
}

export async function fetchModels(): Promise<{ models: Model[] }> {
  return jsonFetch("/api/models");
}

export async function fetchSessions(): Promise<{ sessions: ChatSession[] }> {
  return jsonFetch("/api/sessions");
}

export async function createSession(title?: string): Promise<{ session: ChatSession }> {
  return jsonFetch("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function deleteSession(id: string): Promise<{ ok: boolean }> {
  return jsonFetch(`/api/sessions/${id}`, { method: "DELETE" });
}

export async function renameSession(id: string, title: string): Promise<{ session: ChatSession }> {
  return jsonFetch(`/api/sessions/${id}/rename`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function fetchMessages(id: string): Promise<{
  messages: Array<{
    info: { id: string; role: string; createdAt?: number };
    parts: Array<{ type: string; text?: string; [k: string]: unknown }>;
  }>;
}> {
  return jsonFetch(`/api/sessions/${id}/messages`);
}

export type ChatResponse = {
  session: { id: string };
  messageID: string | null;
  text: string;
};

export type ChatError = {
  error: string;
  message: string;
};

export async function sendChat(
  args: { sessionId?: string; message: string; model?: ModelRef; system?: string },
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
    signal,
  });

  if (!res.ok) {
    let payload: ChatError | null = null;
    try {
      payload = (await res.json()) as ChatError;
    } catch {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }
    throw new Error(payload.message || `${res.status} ${res.statusText}`);
  }

  return (await res.json()) as ChatResponse;
}

export function defaultModelLabel(m: Model | null): string {
  if (!m) return "Default model";
  return `${m.providerName} / ${m.modelName}`;
}

export function findModelByKey(models: Model[], ref: ModelRef | null): Model | null {
  if (!ref) return null;
  const key = modelKey(ref);
  return models.find((m) => modelKey(m) === key) ?? null;
}
