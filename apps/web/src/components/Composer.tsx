import { useEffect, useRef, useState } from "react";

type Props = {
  onSend: (text: string) => void;
  onStop?: () => void;
  streaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function Composer({ onSend, onStop, streaming, disabled, placeholder }: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [text]);

  function submit() {
    if (streaming) return;
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) {
        el.style.height = "auto";
        el.focus();
      }
    });
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-border bg-bg-soft p-3">
      <div className="max-w-3xl mx-auto">
        <div
          className={`flex items-end gap-2 bg-bg-card border rounded-xl p-2 transition-colors ${
            streaming ? "border-red-500/40" : "border-border focus-within:border-accent"
          }`}
        >
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            disabled={disabled || streaming}
            rows={1}
            placeholder={placeholder ?? "Preguntale algo a OpenCode Go…"}
            className="flex-1 resize-none bg-transparent outline-none px-2 py-1.5 text-ink placeholder:text-ink-mute disabled:opacity-50 max-h-60"
          />
          {streaming ? (
            <button
              onClick={onStop}
              title="Detener la generación"
              aria-label="Detener"
              className="px-4 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-sm font-medium flex items-center gap-2 transition"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <rect x="4" y="4" width="12" height="12" rx="2" />
              </svg>
              Detener
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={disabled || !text.trim()}
              className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-soft text-white text-sm font-medium disabled:opacity-40 disabled:hover:bg-accent transition"
            >
              Enviar
            </button>
          )}
        </div>
        <p className="text-xs text-ink-mute mt-1.5 text-center">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}
