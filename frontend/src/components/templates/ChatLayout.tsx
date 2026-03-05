import { useCallback } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/organisms/AppSidebar";
import { ChatMessages } from "@/components/organisms/ChatMessages";
import { ChatInput } from "@/components/molecules/ChatInput";
import { QueryError } from "@/lib/api";
import { useConversations } from "@/hooks/useConversations";
import { useQueryMutation } from "@/hooks/useQueryMutation";

export function ChatLayout() {
  const {
    conversations,
    activeConversation,
    activeId,
    selectConversation,
    createConversation,
    deleteConversation,
    addMessage,
    updateSummary,
  } = useConversations();

  const { mutate, isPending, error, variables, reset } = useQueryMutation({
    activeConversation,
    addMessage,
    updateSummary,
  });

  const handleSend = (question: string) => {
    if (!activeId) {
      const newId = createConversation(question);
      mutate({ question, conversationId: newId });
    } else {
      mutate({ question, conversationId: activeId });
    }
  };

  const handleRetry = useCallback(() => {
    if (!variables || !error) return;

    const errorSql =
      error instanceof QueryError ? error.sql : "";

    const errorContext = errorSql
      ? `SQL: ${errorSql}\nFehler: ${error.message}`
      : "";

    reset();
    mutate({
      question: variables.question,
      conversationId: variables.conversationId,
      errorContext: errorContext || undefined,
    });
  }, [variables, error, reset, mutate]);

  const hasPendingActivity = isPending || !!error;
  const pendingQuestion = hasPendingActivity ? variables?.question : undefined;
  const messageCount = activeConversation?.messages.length ?? 0;
  const isEmpty = messageCount === 0 && !hasPendingActivity;

  return (
    <SidebarProvider>
      <AppSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={() => createConversation()}
        onDelete={deleteConversation}
      />
      <div className="relative flex h-svh w-full flex-col">
        <div className="h-3 shrink-0" />

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <h1 className="mb-8 text-3xl font-semibold text-foreground/80">
              Was möchtest du wissen?
            </h1>
            <div className="w-full max-w-2xl">
              <ChatInput onSend={handleSend} disabled={isPending} />
            </div>
          </div>
        ) : (
          <>
            <ChatMessages
              messages={activeConversation?.messages ?? []}
              isPending={isPending}
              error={error}
              pendingQuestion={pendingQuestion}
              onRetry={handleRetry}
            />
            <ChatInput onSend={handleSend} disabled={isPending} />
          </>
        )}
      </div>
    </SidebarProvider>
  );
}
