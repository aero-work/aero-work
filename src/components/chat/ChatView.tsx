import { useCallback } from "react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useSessionStore, useActiveSession } from "@/stores/sessionStore";
import { useAgentStore } from "@/stores/agentStore";
import { useFileStore } from "@/stores/fileStore";
import { agentAPI } from "@/services/api";
import { Bot, FolderOpen, MessageSquare } from "lucide-react";

export function ChatView() {
  const session = useActiveSession();
  const isLoading = useSessionStore((state) => state.isLoading);
  const connectionStatus = useAgentStore((state) => state.connectionStatus);
  const currentWorkingDir = useFileStore((state) => state.currentWorkingDir);

  const isConnected = connectionStatus === "connected";
  const hasSession = !!session;

  const handleSend = useCallback(
    async (content: string) => {
      if (!session) return;
      try {
        await agentAPI.sendMessage(session.id, content);
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [session]
  );

  const handleCancel = useCallback(async () => {
    if (!session) return;
    try {
      await agentAPI.cancelSession(session.id);
    } catch (error) {
      console.error("Failed to cancel session:", error);
    }
  }, [session]);

  // Empty state when no session
  if (!hasSession) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
          {!isConnected ? (
            <>
              <Bot className="w-16 h-16 opacity-20" />
              <div>
                <h2 className="text-lg font-medium text-foreground mb-2">
                  Welcome to Aero Code
                </h2>
                <p className="text-sm">
                  Click <strong>Connect</strong> to start the AI agent.
                </p>
              </div>
            </>
          ) : !currentWorkingDir ? (
            <>
              <FolderOpen className="w-16 h-16 opacity-20" />
              <div>
                <h2 className="text-lg font-medium text-foreground mb-2">
                  Select a Project
                </h2>
                <p className="text-sm">
                  Open a project folder from the <strong>Files</strong> section in the sidebar.
                </p>
              </div>
            </>
          ) : (
            <>
              <MessageSquare className="w-16 h-16 opacity-20" />
              <div>
                <h2 className="text-lg font-medium text-foreground mb-2">
                  Start a Session
                </h2>
                <p className="text-sm">
                  Click the <strong>+</strong> button in the <strong>Sessions</strong> section to create a new conversation.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList
        chatItems={session?.chatItems || []}
        isLoading={isLoading}
      />
      <ChatInput
        onSend={handleSend}
        onCancel={handleCancel}
        isLoading={isLoading}
        disabled={!isConnected || !hasSession}
      />
    </div>
  );
}
