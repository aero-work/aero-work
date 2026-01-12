import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message, ChatItem } from "@/types/acp";
import { ToolCallCard } from "./ToolCallCard";
import { Bot, User } from "lucide-react";

interface MessageListProps {
  chatItems: ChatItem[];
  isLoading: boolean;
}

export function MessageList({ chatItems, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatItems]);

  // Check if the last item is an assistant message (for loading indicator)
  const lastItem = chatItems[chatItems.length - 1];
  const lastIsAssistantMessage =
    lastItem?.type === "message" && lastItem.message.role === "assistant";

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="space-y-4 max-w-4xl mx-auto">
        {chatItems.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Bot className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg">Start a conversation</p>
            <p className="text-sm">Type a message below to begin</p>
          </div>
        )}

        {chatItems.map((item) => {
          if (item.type === "message") {
            return <MessageBubble key={item.message.id} message={item.message} />;
          } else {
            return (
              <ToolCallCard key={item.toolCall.toolCallId} toolCall={item.toolCall} />
            );
          }
        })}

        {isLoading && !lastIsAssistantMessage && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 bg-muted rounded-lg p-3">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground" : "bg-primary/10"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>
      <div
        className={cn(
          "flex-1 max-w-[80%] rounded-lg p-3",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
      </div>
    </div>
  );
}
