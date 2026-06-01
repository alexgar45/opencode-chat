import { useState } from "react";
import type { ChatSession } from "../lib/types";

type Props = {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  collapsed: boolean;
  onToggle: () => void;
};

function relativeTime(ts?: number) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "ahora";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function Sidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  collapsed,
  onToggle,
}: Props) {
  if (collapsed) {
    return (
      <aside className="w-12 shrink-0 border-r border-border bg-bg-soft flex flex-col items-center py-3 gap-3">
        <button
          onClick={onToggle}
          aria-label="Expandir sidebar"
          className="w-9 h-9 rounded-md hover:bg-bg-hover flex items-center justify-center text-ink-soft"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z" />
          </svg>
        </button>
        <button
          onClick={onNew}
          aria-label="Nueva conversación"
          className="w-9 h-9 rounded-md bg-accent hover:bg-accent-soft text-white flex items-center justify-center"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1z" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-bg-soft flex flex-col">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <button
          onClick={onToggle}
          aria-label="Colapsar sidebar"
          className="w-8 h-8 rounded-md hover:bg-bg-hover flex items-center justify-center text-ink-soft"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z" />
          </svg>
        </button>
        <div className="flex-1 font-semibold">OpenCode Go</div>
        <button
          onClick={onNew}
          className="px-2.5 py-1.5 text-sm rounded-md bg-accent hover:bg-accent-soft text-white"
        >
          + Nuevo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <div className="text-ink-mute text-sm text-center py-8">
            Aún no hay conversaciones.
            <br />
            <button
              onClick={onNew}
              className="mt-2 text-accent hover:underline"
            >
              Empezá una
            </button>
          </div>
        ) : (
          sessions.map((s) => (
            <SessionItem
              key={s.id}
              session={s}
              active={s.id === activeId}
              onSelect={() => onSelect(s.id)}
              onDelete={() => onDelete(s.id)}
              onRename={(title) => onRename(s.id, title)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function SessionItem({
  session,
  active,
  onSelect,
  onDelete,
  onRename,
}: {
  session: ChatSession;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.title ?? "Sin título");

  return (
    <div
      className={`group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm ${
        active ? "bg-bg-hover text-ink" : "text-ink-soft hover:bg-bg-hover hover:text-ink"
      }`}
      onClick={() => !editing && onSelect()}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 text-ink-mute">
        <path d="M3 4a2 2 0 0 1 2-2h7l5 5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4z" />
      </svg>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onRename(draft.trim() || "Sin título");
              setEditing(false);
            } else if (e.key === "Escape") {
              setDraft(session.title ?? "Sin título");
              setEditing(false);
            }
          }}
          onBlur={() => {
            onRename(draft.trim() || "Sin título");
            setEditing(false);
          }}
          className="flex-1 bg-bg-card border border-border rounded px-1.5 py-0.5 text-ink text-sm focus:outline-none focus:border-accent"
        />
      ) : (
        <span
          className="flex-1 truncate"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
        >
          {session.title ?? "Sin título"}
        </span>
      )}
      <span className="text-[10px] text-ink-mute">{relativeTime(session.updatedAt)}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm("¿Borrar esta conversación?")) onDelete();
        }}
        aria-label="Borrar"
        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded hover:bg-bg-card flex items-center justify-center text-ink-mute hover:text-red-400"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M6 2a1 1 0 0 0-1 1v1H3a1 1 0 1 0 0 2h1l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12h1a1 1 0 1 0 0-2h-2V3a1 1 0 0 0-1-1H6zm1 4a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1zm5 0a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1z" />
        </svg>
      </button>
    </div>
  );
}
