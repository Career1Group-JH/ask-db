import { ArrowUp } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (question: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const value = textareaRef.current?.value.trim();
    if (!value || disabled) return;
    onSend(value);
    if (textareaRef.current) textareaRef.current.value = "";
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-4">
      <div className="relative flex items-end rounded-2xl border bg-muted/40 shadow-sm transition-colors focus-within:border-ring/40 focus-within:bg-muted/60">
        <textarea
          ref={textareaRef}
          placeholder="Stelle irgendeine Frage"
          className="max-h-[200px] min-h-[52px] flex-1 resize-none bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground/60"
          rows={1}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          disabled={disabled}
          aria-label="Senden"
          className="m-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-80 disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
