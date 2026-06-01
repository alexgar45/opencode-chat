const KEYS = {
  model: "opencode-go-chat.model",
  system: "opencode-go-chat.system",
};

export function loadStoredModel(): string | null {
  return localStorage.getItem(KEYS.model);
}

export function storeModel(key: string | null) {
  if (!key) localStorage.removeItem(KEYS.model);
  else localStorage.setItem(KEYS.model, key);
}

export function loadStoredSystem(): string {
  return localStorage.getItem(KEYS.system) ?? "";
}

export function storeSystem(value: string) {
  localStorage.setItem(KEYS.system, value);
}
