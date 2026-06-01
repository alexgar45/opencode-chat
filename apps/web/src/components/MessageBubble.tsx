import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../lib/types";
import { Markdown } from "./Markdown";

type Props = {
  message: ChatMessage;
  onUpdate?: (id: string, content: string) => void;
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, onUpdate }: Props) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-3xl w-fit rounded-2xl px-4 py-3 border ${
          isUser
            ? "bg-accent/15 border-accent/30 text-ink"
            : isSystem
              ? "bg-bg-card border-border text-ink-soft text-sm italic"
              : "bg-bg-card border-border text-ink"
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-ink-mute mb-1.5">
          <span className="font-medium">
            {isUser ? "Vos" : isAssistant ? "Asistente" : "Sistema"}
          </span>
          {message.createdAt ? <span>{formatTime(message.createdAt)}</span> : null}
          {message.pending ? <span className="italic">pensando…</span> : null}
        </div>

        {message.error ? (
          <div className="text-red-400 text-sm">⚠ {message.error}</div>
        ) : isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : message.content ? (
          <Markdown content={message.content} />
        ) : message.pending ? (
          <span className="inline-flex items-center text-ink-mute">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
        ) : null}

        {!isUser && !message.pending && message.content && onUpdate ? (
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(message.content).catch(() => {});
              }}
              className="text-xs text-ink-mute hover:text-ink"
            >
              Copy
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
