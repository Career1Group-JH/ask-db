import { useCallback, useState } from "react";
import { loadConversations, saveConversations } from "@/lib/storage";
import type { Conversation, Message } from "@/types";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(
    () => loadConversations()
  );
  const [activeId, setActiveId] = useState<string | null>(
    () => conversations[0]?.id ?? null
  );

  const persist = useCallback((next: Conversation[]) => {
    setConversations(next);
    saveConversations(next);
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? null;

  const createConversation = useCallback(
    (title?: string): string => {
      const id = crypto.randomUUID();
      const conv: Conversation = {
        id,
        title: title ?? "Neue Konversation",
        messages: [],
        historySummary: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      persist([conv, ...conversations]);
      setActiveId(id);
      return id;
    },
    [conversations, persist]
  );

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      const next = conversations.filter((c) => c.id !== id);
      persist(next);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
      }
    },
    [conversations, activeId, persist]
  );

  const addMessage = useCallback(
    (conversationId: string, message: Message) => {
      const next = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const isFirst = c.messages.length === 0;
        return {
          ...c,
          title: isFirst ? message.question.slice(0, 60) : c.title,
          messages: [...c.messages, message],
          updatedAt: Date.now(),
        };
      });
      persist(next);
    },
    [conversations, persist]
  );

  const updateSummary = useCallback(
    (conversationId: string, summary: string) => {
      const next = conversations.map((c) =>
        c.id === conversationId
          ? { ...c, historySummary: summary, updatedAt: Date.now() }
          : c
      );
      persist(next);
    },
    [conversations, persist]
  );

  return {
    conversations,
    activeConversation,
    activeId,
    selectConversation,
    createConversation,
    deleteConversation,
    addMessage,
    updateSummary,
  };
}
