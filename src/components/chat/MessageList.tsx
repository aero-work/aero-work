import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message, ChatItem } from "@/types/acp";
import { ToolCallCard } from "./ToolCallCard";
import { Bot, User, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useSettingsStore } from "@/stores/settingsStore";

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

function useIsDarkMode(): boolean {
  const theme = useSettingsStore((state) => state.theme);
  const [isDark, setIsDark] = useState(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return theme === "dark";
  });

  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      setIsDark(theme === "dark");
    }
  }, [theme]);

  return isDark;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isDark = useIsDarkMode();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [message.content]);

  return (
    <div
      className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-blue-500 dark:bg-blue-600/80 text-white" : "bg-primary/10"
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
          "relative flex-1 max-w-[80%] rounded-xl p-4 group shadow-sm",
          isUser
            ? "bg-blue-500 dark:bg-blue-600/80 text-white"
            : "bg-card text-card-foreground border border-border"
        )}
      >
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-md transition-all z-10",
            isHovered ? "opacity-100" : "opacity-0",
            isUser
              ? "hover:bg-white/20 text-white"
              : "hover:bg-foreground/10 text-muted-foreground hover:text-foreground"
          )}
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {/* Message content with markdown */}
        {isUser ? (
          // User messages: plain text (no markdown)
          <p className="whitespace-pre-wrap text-sm pr-6">{message.content}</p>
        ) : (
          // Assistant messages: markdown rendered with custom prose styling
          <div className="prose-custom text-sm pr-6 max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match && !className;

                  if (isInline) {
                    return (
                      <code {...props}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <SyntaxHighlighter
                      style={isDark ? oneDark : oneLight}
                      language={match?.[1] || "text"}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        background: isDark
                          ? "hsl(220, 13%, 12%)"
                          : "hsl(220, 13%, 18%)",
                      }}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                },
                // Links use CSS variables
                a({ children, href, ...props }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
                // Tables use CSS variables
                table({ children, ...props }) {
                  return (
                    <div className="overflow-x-auto">
                      <table {...props}>
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children, ...props }) {
                  return (
                    <th {...props}>
                      {children}
                    </th>
                  );
                },
                td({ children, ...props }) {
                  return (
                    <td {...props}>
                      {children}
                    </td>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
