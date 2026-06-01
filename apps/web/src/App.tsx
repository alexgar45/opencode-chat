import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Composer } from "./components/Composer";
import { MessageBubble } from "./components/MessageBubble";
import { ModelPicker } from "./components/ModelPicker";
import {
  createSession,
  deleteSession,
  fetchHealth,
  fetchMessages,
  fetchModels,
  fetchSessions,
  findModelByKey,
  renameSession,
  sendChat,
} from "./lib/api";
import {
  loadStoredModel,
  loadStoredSystem,
  storeModel,
  storeSystem,
} from "./lib/storage";
import type { ChatMessage, ChatSession, Model, ModelRef } from "./lib/types";
import { modelKey, parseModelKey } from "./lib/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [serverVersion, setServerVersion] = useState<string | null>(null);

  const [model, setModel] = useState<ModelRef | null>(null);
  const [system, setSystem] = useState<string>(loadStoredSystem());
  const [systemEditing, setSystemEditing] = useState(false);
  const [systemDraft, setSystemDraft] = useState(system);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>(
    {},
  );
  const [streaming, setStreaming] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const health = await fetchHealth();
        setServerOk(health.ok);
        setServerVersion(health.opencode?.version ?? null);
      } catch (err) {
        setServerOk(false);
        setModelsError((err as Error).message);
      }
      try {
        const { models } = await fetchModels();
        setModels(models);
        const stored = loadStoredModel();
        const parsedStored = stored ? parseModelKey(stored) : null;
        const storedModel = parsedStored
          ? findModelByKey(models, parsedStored)
          : null;
        const fallback = models.find((m) => m.isDefault) ?? models[0] ?? null;
        const chosen = storedModel ?? fallback;
        if (chosen) {
          const ref = { providerID: chosen.providerID, modelID: chosen.modelID };
          setModel(ref);
          storeModel(modelKey(ref));
        }
      } catch (err) {
        setModelsError((err as Error).message);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    if (messagesBySession[activeId]) return;
    (async () => {
      try {
        const { messages } = await fetchMessages(activeId);
        const flat: ChatMessage[] = [];
        for (const m of messages ?? []) {
          const role = (m.info.role as ChatMessage["role"]) ?? "assistant";
          const text = (m.parts ?? [])
            .filter((p) => p.type === "text" && typeof p.text === "string")
            .map((p) => p.text as string)
            .join("\n\n");
          flat.push({
            id: m.info.id ?? uid(),
            role,
            content: text,
            createdAt:
              typeof m.info.createdAt === "number"
                ? m.info.createdAt
                : Date.now(),
          });
        }
        setMessagesBySession((prev) => ({ ...prev, [activeId]: flat }));
      } catch (err) {
        console.warn("Failed to load messages", err);
      }
    })();
  }, [activeId, messagesBySession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesBySession, streaming]);

  const refreshSessions = useCallback(async () => {
    try {
      const { sessions } = await fetchSessions();
      setSessions(
        [...(sessions ?? [])].sort(
          (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
        ),
      );
    } catch (err) {
      console.warn("Failed to list sessions", err);
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const handleNewSession = useCallback(async () => {
    if (streaming) return;
    try {
      const { session } = await createSession("Nueva conversación");
      setSessions((prev) => [session, ...prev]);
      setActiveId(session.id);
      setMessagesBySession((prev) => ({ ...prev, [session.id]: [] }));
    } catch (err) {
      alert(`No pude crear la sesión: ${(err as Error).message}`);
    }
  }, [streaming]);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      try {
        await deleteSession(id);
        setSessions((prev) => prev.filter((s) => s.id !== id));
        setMessagesBySession((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        if (activeId === id) setActiveId(null);
      } catch (err) {
        alert(`No pude borrar: ${(err as Error).message}`);
      }
    },
    [activeId],
  );

  const handleRenameSession = useCallback(
    async (id: string, title: string) => {
      try {
        const { session } = await renameSession(id, title);
        setSessions((prev) => prev.map((s) => (s.id === id ? session : s)));
      } catch (err) {
        console.warn("Rename failed", err);
      }
    },
    [],
  );

  const updateMessage = useCallback(
    (sessionId: string, messageId: string, patch: Partial<ChatMessage>) => {
      setMessagesBySession((prev) => {
        const list = prev[sessionId] ?? [];
        return {
          ...prev,
          [sessionId]: list.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
        };
      });
    },
    [],
  );

  const appendMessage = useCallback((sessionId: string, msg: ChatMessage) => {
    setMessagesBySession((prev) => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] ?? []), msg],
    }));
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (streaming) return;
      if (!model) {
        alert("No hay modelos disponibles. Verificá que opencode esté conectado.");
        return;
      }

      let sessionId = activeId;
      if (!sessionId) {
        try {
          const { session } = await createSession(text.slice(0, 50));
          sessionId = session.id;
          setSessions((prev) => [session, ...prev]);
          setActiveId(session.id);
          setMessagesBySession((prev) => ({ ...prev, [session.id]: [] }));
        } catch (err) {
          alert(`No pude crear la sesión: ${(err as Error).message}`);
          return;
        }
      }

      const finalSessionId = sessionId;
      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: "",
        pending: true,
        createdAt: Date.now(),
      };
      appendMessage(finalSessionId, userMsg);
      appendMessage(finalSessionId, assistantMsg);

      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      try {
        const response = await sendChat(
          {
            sessionId: finalSessionId,
            message: text,
            model,
            system: system || undefined,
          },
          controller.signal,
        );

        updateMessage(finalSessionId, assistantMsg.id, {
          content: response.text,
          pending: false,
        });
        if (response.session?.id && response.session.id !== finalSessionId) {
          setActiveId(response.session.id);
        }
        refreshSessions();
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          updateMessage(finalSessionId, assistantMsg.id, {
            content: "(detenido por el usuario)",
            pending: false,
          });
        } else {
          updateMessage(finalSessionId, assistantMsg.id, {
            pending: false,
            error: (err as Error).message,
          });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [
      streaming,
      model,
      activeId,
      system,
      appendMessage,
      updateMessage,
      refreshSessions,
    ],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const activeMessages = useMemo(
    () => (activeId ? messagesBySession[activeId] ?? [] : []),
    [activeId, messagesBySession],
  );

  const headerSubtitle = useMemo(() => {
    if (serverOk === false) return "Servidor opencode no responde";
    if (serverVersion) return `opencode ${serverVersion}`;
    if (serverOk === null) return "Conectando…";
    return "Conectado";
  }, [serverOk, serverVersion]);

  return (
    <div className="h-full flex bg-bg text-ink">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={(id) => setActiveId(id)}
        onNew={handleNewSession}
        onDelete={handleDeleteSession}
        onRename={handleRenameSession}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-bg-soft flex items-center px-4 gap-4 shrink-0">
          <div className="flex flex-col">
            <span className="font-semibold text-sm">OpenCode Go Chat</span>
            <span className="text-[11px] text-ink-mute">{headerSubtitle}</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => {
              setSystemDraft(system);
              setSystemEditing((v) => !v);
            }}
            className="text-xs px-2 py-1 rounded-md border border-border hover:border-border-strong text-ink-soft"
          >
            {systemEditing ? "Cerrar system prompt" : "System prompt"}
          </button>
          <ModelPicker
            models={models}
            value={model}
            onChange={(m) => {
              setModel(m);
              storeModel(modelKey(m));
            }}
          />
        </header>

        {systemEditing ? (
          <div className="border-b border-border bg-bg-soft p-3">
            <label className="block text-xs text-ink-mute mb-1">
              System prompt (opcional, se envía en cada mensaje)
            </label>
            <textarea
              value={systemDraft}
              onChange={(e) => setSystemDraft(e.target.value)}
              rows={3}
              placeholder="Sos un asistente útil y conciso…"
              className="w-full bg-bg-card border border-border rounded-md p-2 text-sm text-ink focus:outline-none focus:border-accent"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setSystemDraft("");
                  storeSystem("");
                  setSystem("");
                }}
                className="text-xs px-2 py-1 rounded-md text-ink-soft hover:text-ink"
              >
                Limpiar
              </button>
              <button
                onClick={() => {
                  storeSystem(systemDraft);
                  setSystem(systemDraft);
                  setSystemEditing(false);
                }}
                className="text-xs px-3 py-1 rounded-md bg-accent hover:bg-accent-soft text-white"
              >
                Guardar
              </button>
            </div>
          </div>
        ) : null}

        {modelsError ? (
          <div className="m-4 p-3 rounded-md border border-red-500/40 bg-red-500/10 text-red-300 text-sm">
            No pude cargar los modelos: {modelsError}
            <br />
            Asegurate de tener <code className="bg-bg-card px-1 rounded">opencode serve</code>{" "}
            corriendo y que el provider OpenCode Go esté conectado con{" "}
            <code className="bg-bg-card px-1 rounded">/connect</code>.
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!activeId ? (
            <EmptyState onNew={handleNewSession} />
          ) : activeMessages.length === 0 && !streaming ? (
            <div className="text-center text-ink-mute mt-20">
              Empezá la conversación…
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {activeMessages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <Composer
          onSend={handleSend}
          onStop={handleStop}
          streaming={streaming}
          disabled={streaming}
          placeholder={
            streaming
              ? "Generando respuesta…"
              : activeId
                ? "Escribí tu mensaje…"
                : "Escribí tu primer mensaje (crea una conversación nueva)…"
          }
        />
      </main>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-soft mb-4 flex items-center justify-center">
        <svg viewBox="0 0 32 32" className="w-9 h-9 text-white" fill="currentColor">
          <path d="M9 11h10a4 4 0 0 1 0 8h-2l4 4h-4l-4-4h-4z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold mb-2">Empezá una conversación</h1>
      <p className="text-ink-soft max-w-md mb-6">
        Chat con los modelos curados de OpenCode Go. Creá una conversación nueva
        o seleccioná una del panel lateral.
      </p>
      <button
        onClick={onNew}
        className="px-4 py-2 rounded-md bg-accent hover:bg-accent-soft text-white font-medium"
      >
        + Nueva conversación
      </button>
    </div>
  );
}
