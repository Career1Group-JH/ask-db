import { ArrowUp } from "lucide-react";
import { useCallback, useRef, type KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (question: string) => void;
  disabled?: boolean;
}

const MAX_HEIGHT = 200;

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, []);

  const handleSend = () => {
    const value = textareaRef.current?.value.trim();
    if (!value || disabled) return;
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-4">
      <div className="relative flex items-end rounded-2xl border bg-muted/40 p-3 shadow-sm transition-colors focus-within:border-ring/40 focus-within:bg-muted/60">
        <textarea
          ref={textareaRef}
          name="chat-input"
          placeholder="Stelle irgendeine Frage"
          className="min-h-[28px] flex-1 resize-none overflow-hidden bg-transparent px-2 py-0.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60"
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={autoResize}
        />
        <button
          onClick={handleSend}
          disabled={disabled}
          aria-label="Senden"
          className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-80 disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
