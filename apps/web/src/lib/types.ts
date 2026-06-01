export type Model = {
  providerID: string;
  providerName: string;
  modelID: string;
  modelName: string;
  isDefault: boolean;
};

export type ModelRef = {
  providerID: string;
  modelID: string;
};

export function modelKey(m: ModelRef) {
  return `${m.providerID}/${m.modelID}`;
}

export function parseModelKey(key: string): ModelRef | null {
  const [providerID, ...rest] = key.split("/");
  if (!providerID || rest.length === 0) return null;
  return { providerID, modelID: rest.join("/") };
}

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  pending?: boolean;
  error?: string;
  createdAt: number;
};

export type ChatSession = {
  id: string;
  title?: string;
  updatedAt?: number;
};

export type ServerEvent =
  | { type: "session"; id: string }
  | { type: "delta"; text: string; messageID?: string }
  | { type: "done"; messageID?: string }
  | { type: "error"; message: string };
