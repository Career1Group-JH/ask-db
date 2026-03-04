import { SquarePen, Trash2, MessageSquare } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import type { Conversation } from "@/types";

interface AppSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function AppSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-8 items-center gap-2 overflow-hidden rounded-md px-2 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center">
              <MessageSquare className="h-4 w-4 shrink-0 group-data-[collapsible=icon]:hidden" />
              <span className="flex-1 truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">AskDB</span>
              <SidebarTrigger />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onNew} tooltip="Neuer Chat">
              <SquarePen className="h-4 w-4 shrink-0" />
              <span>Neuer Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:hidden">
        {conversations.length > 0 && (
          <SidebarMenu className="px-2">
            {conversations.map((conv) => (
              <SidebarMenuItem key={conv.id}>
                <SidebarMenuButton
                  isActive={conv.id === activeId}
                  onClick={() => onSelect(conv.id)}
                  className="group/item"
                >
                  <span className="truncate text-sm">{conv.title}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        onDelete(conv.id);
                      }
                    }}
                    className="ml-auto opacity-0 transition-opacity group-hover/item:opacity-100"
                    aria-label="Chat löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}

        <div className="mt-auto p-3">
          <ThemeToggle />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
