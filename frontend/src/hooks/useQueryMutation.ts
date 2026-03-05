import { useMutation } from "@tanstack/react-query";
import { postQuery, postSummarize } from "@/lib/api";
import { HISTORY_WINDOW_SIZE } from "@/lib/constants";
import type { Conversation, HistoryEntry, Message } from "@/types";

interface UseQueryMutationOptions {
  activeConversation: Conversation | null;
  addMessage: (conversationId: string, message: Message) => void;
  updateSummary: (conversationId: string, summary: string) => void;
}

function getConversationById(
  conv: Conversation | null,
  id: string
): Conversation | null {
  if (conv && conv.id === id) return conv;
  return null;
}

interface MutationVariables {
  question: string;
  conversationId: string;
  errorContext?: string;
}

export function useQueryMutation({
  activeConversation,
  addMessage,
  updateSummary,
}: UseQueryMutationOptions) {
  const mutation = useMutation({
    mutationFn: async ({
      question,
      conversationId,
      errorContext,
    }: MutationVariables) => {
      const conv = getConversationById(activeConversation, conversationId);
      const messages = conv?.messages ?? [];
      let historySummary = conv?.historySummary ?? "";

      const overflowCount = messages.length - HISTORY_WINDOW_SIZE;

      if (overflowCount > 0) {
        const overflowMessages: HistoryEntry[] = messages
          .slice(0, overflowCount)
          .map((m) => ({
            question: m.question,
            answer: m.answer,
            sql: m.sql,
          }));

        const { summary } = await postSummarize({
          messages: overflowMessages,
          existing_summary: historySummary,
        });
        historySummary = summary;
        updateSummary(conversationId, summary);
      }

      const recentHistory: HistoryEntry[] = messages
        .slice(Math.max(0, overflowCount))
        .map((m) => ({
          question: m.question,
          answer: m.answer,
          sql: m.sql,
        }));

      const response = await postQuery({
        question,
        history: recentHistory,
        history_summary: historySummary,
        error_context: errorContext,
      });

      return { response, conversationId };
    },
    onSuccess: ({ response, conversationId }) => {
      const message: Message = {
        id: crypto.randomUUID(),
        question: response.question,
        answer: response.answer,
        reasoning: response.reasoning,
        sql: response.sql,
        columns: response.columns,
        rows: response.rows,
        rowCount: response.row_count,
        steps: response.steps,
        timestamp: Date.now(),
      };
      addMessage(conversationId, message);
    },
  });

  return {
    ...mutation,
    variables: mutation.variables,
  };
}
