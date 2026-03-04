import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/organisms/AppSidebar";
import { ChatMessages } from "@/components/organisms/ChatMessages";
import { ChatInput } from "@/components/molecules/ChatInput";
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

  const { mutate, isPending, error } = useQueryMutation({
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

  const isEmpty = (activeConversation?.messages.length ?? 0) === 0 && !isPending;

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
            />
            <ChatInput onSend={handleSend} disabled={isPending} />
          </>
        )}
      </div>
    </SidebarProvider>
  );
}
