import { useEffect, useRef } from "react";
import { RotateCw } from "lucide-react";
import { Spinner } from "@/components/atoms/Spinner";
import { ChatMessage } from "./ChatMessage";
import { QueryError } from "@/lib/api";
import type { Message } from "@/types";

interface ChatMessagesProps {
  messages: Message[];
  isPending: boolean;
  error: Error | null;
  pendingQuestion?: string;
  onRetry?: () => void;
}

export function ChatMessages({
  messages,
  isPending,
  error,
  pendingQuestion,
  onRetry,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending, error]);

  const errorSql = error instanceof QueryError ? error.sql : "";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {pendingQuestion && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-3xl bg-muted px-5 py-3 text-sm">
                {pendingQuestion}
              </div>
            </div>
          </div>
        )}

        {isPending && (
          <div className="flex items-center gap-3 py-2">
            <Spinner size={16} />
            <p className="text-sm text-muted-foreground">Denkt nach…</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p>{error.message}</p>
            {errorSql && (
              <pre className="mt-2 rounded-md bg-destructive/10 p-2 text-xs overflow-x-auto">
                <code>{errorSql}</code>
              </pre>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-destructive/15 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/25 transition-colors"
              >
                <RotateCw className="h-3 w-3" />
                Nochmal versuchen
              </button>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
