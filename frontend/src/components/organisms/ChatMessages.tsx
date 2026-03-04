import { useEffect, useRef } from "react";
import { Database } from "lucide-react";
import { Spinner } from "@/components/atoms/Spinner";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "@/types";

interface ChatMessagesProps {
  messages: Message[];
  isPending: boolean;
  error: Error | null;
}

export function ChatMessages({ messages, isPending, error }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  if (messages.length === 0 && !isPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-muted-foreground">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Database className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">AskDB</p>
          <p className="mt-1 text-sm">
            Stelle eine Frage an die Datenbank — in natürlicher Sprache.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isPending && (
          <div className="flex items-center gap-3 py-2">
            <Spinner size={18} />
            <p className="text-sm text-muted-foreground">
              Datenbank wird abgefragt…
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
