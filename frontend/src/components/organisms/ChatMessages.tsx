import { useEffect, useRef } from "react";
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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isPending && (
          <div className="flex items-center gap-3 py-2">
            <Spinner size={16} />
            <p className="text-sm text-muted-foreground">Denkt nach…</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
