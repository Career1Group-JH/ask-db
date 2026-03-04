import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/organisms/AppSidebar";
import { ChatMessages } from "@/components/organisms/ChatMessages";
import { ChatInput } from "@/components/molecules/ChatInput";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
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
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-sm">
          <SidebarTrigger />
          <span className="text-sm font-semibold tracking-tight">AskDB</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <ChatMessages
          messages={activeConversation?.messages ?? []}
          isPending={isPending}
          error={error}
        />

        <ChatInput onSend={handleSend} disabled={isPending} />
      </div>
    </SidebarProvider>
  );
}
