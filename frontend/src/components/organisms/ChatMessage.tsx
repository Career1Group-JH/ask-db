import { Bot } from "lucide-react";
import { SqlBlock } from "@/components/molecules/SqlBlock";
import { ResultTable } from "@/components/molecules/ResultTable";
import type { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.question}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <Bot className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {message.answer && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.answer}
            </p>
          )}

          {message.columns.length > 0 && (
            <ResultTable
              columns={message.columns}
              rows={message.rows}
              rowCount={message.rowCount}
            />
          )}

          <SqlBlock
            sql={message.sql}
            reasoning={message.reasoning}
            steps={message.steps}
          />
        </div>
      </div>
    </div>
  );
}
