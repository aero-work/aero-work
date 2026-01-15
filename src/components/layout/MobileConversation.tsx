import { useCallback, useState } from "react";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useSessionStore } from "@/stores/sessionStore";
import { useAgentStore } from "@/stores/agentStore";
import { useSessionData } from "@/hooks/useSessionData";
import { agentAPI } from "@/services/api";
import { Loader2, MessageSquare } from "lucide-react";

/**
 * MobileConversation
 *
 * The conversation view for mobile devices. Displays messages and input area.
 * This component is shown when navigating into a specific conversation from the session list.
 * The header with back button is handled by MobileHeader.
 */
export function MobileConversation() {
  // UI state from stores
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const isPromptLoading = useSessionStore((state) => state.isLoading);
  const connectionStatus = useAgentStore((state) => state.connectionStatus);

  // Session data from server (single source of truth)
  const {
    state: sessionState,
    isLoading: isSessionLoading,
    error: sessionError,
    addOptimisticMessage,
  } = useSessionData(activeSessionId);

  const isConnected = connectionStatus === "connected";
  const hasSession = !!activeSessionId;

  const handleSend = useCallback(
    async (content: string) => {
      if (!activeSessionId) return;

      // Add optimistic message for immediate feedback and get its ID
      const messageId = addOptimisticMessage(content);

      try {
        // Pass messageId to backend so it uses the same ID (for deduplication)
        await agentAPI.sendPrompt(activeSessionId, content, messageId);
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [activeSessionId, addOptimisticMessage]
  );

  const handleCancel = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      await agentAPI.cancelSession(activeSessionId);
    } catch (error) {
      console.error("Failed to cancel session:", error);
    }
  }, [activeSessionId]);

  // Handle AskUserQuestion submission
  const [askUserQuestionSubmitting, setAskUserQuestionSubmitting] = useState<string | null>(null);

  const handleAskUserQuestionSubmit = useCallback(
    async (toolCallId: string, answers: Record<string, string | string[]>) => {
      if (!activeSessionId) return;

      setAskUserQuestionSubmitting(toolCallId);

      try {
        // Format answers into a user-friendly message
        const answerLines = Object.entries(answers).map(([header, answer]) => {
          if (Array.isArray(answer)) {
            return `**${header}**: ${answer.join(", ")}`;
          }
          return `**${header}**: ${answer}`;
        });

        const responseContent = answerLines.join("\n");

        // Add optimistic message
        const messageId = addOptimisticMessage(responseContent);

        // Send as a regular prompt
        await agentAPI.sendPrompt(activeSessionId, responseContent, messageId);
      } catch (error) {
        console.error("Failed to submit AskUserQuestion answer:", error);
      } finally {
        setAskUserQuestionSubmitting(null);
      }
    },
    [activeSessionId, addOptimisticMessage]
  );

  // No session selected (shouldn't happen in normal flow)
  if (!hasSession) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground px-6">
        <MessageSquare className="w-12 h-12 opacity-20 mb-4" />
        <p className="text-sm text-center">No conversation selected</p>
      </div>
    );
  }

  // Loading session data
  if (isSessionLoading && !sessionState) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin opacity-50" />
        <p className="mt-2 text-sm">Loading conversation...</p>
      </div>
    );
  }

  // Error loading session
  if (sessionError && !sessionState) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground px-6">
        <p className="text-sm text-destructive text-center">Error: {sessionError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages area - takes remaining space, must have explicit height for scrolling */}
      <div className="flex-1 min-h-0">
        <MessageList
          chatItems={sessionState?.chatItems || []}
          isLoading={isPromptLoading}
          onAskUserQuestionSubmit={handleAskUserQuestionSubmit}
          askUserQuestionSubmitting={askUserQuestionSubmitting}
        />
      </div>

      {/* Input area - fixed at bottom */}
      <div className="flex-shrink-0 border-t border-border bg-background">
        <ChatInput
          onSend={handleSend}
          onCancel={handleCancel}
          isLoading={isPromptLoading}
          disabled={!isConnected || !hasSession}
        />
      </div>
    </div>
  );
}
