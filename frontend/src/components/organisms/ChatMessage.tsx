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
        <div className="max-w-[80%] rounded-3xl bg-muted px-5 py-3 text-sm">
          {message.question}
        </div>
      </div>

      <div className="space-y-3">
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
  );
}
