import { cn } from "@/lib/utils";
import type { SessionInfo } from "@/types/acp";
import { MessageSquare, Clock, Trash2, GitFork, Play } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface SessionCardProps {
  session: SessionInfo;
  isActive?: boolean;
  onClick: () => void;
  onResume?: () => void;
  onFork?: () => void;
  onDelete?: () => void;
}

function formatRelativeTime(timestamp: string | number): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}


export function SessionCard({
  session,
  isActive,
  onClick,
  onResume,
  onFork,
  onDelete,
}: SessionCardProps) {
  // Session title: use first user message, summary, or fallback
  const sessionTitle = session.lastUserMessage || session.summary || "New Conversation";
  // Use lastActivity timestamp
  const timeStr = session.lastActivity
    ? formatRelativeTime(session.lastActivity)
    : "";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => e.key === "Enter" && onClick()}
          className={cn(
            "w-full text-left p-4 border-b border-border transition-colors cursor-pointer",
            "hover:bg-accent/50 active:bg-accent",
            isActive && "bg-accent/30 border-l-2 border-l-primary"
          )}
        >
          <div className="flex items-start gap-3">
            {/* Session icon */}
            <div className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
              isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <MessageSquare className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header row: session title */}
              <div className="font-medium text-foreground mb-1">
                {truncateText(sessionTitle, 20)}
              </div>

              {/* Time + status row */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeStr}
                </span>
                {session.messageCount > 0 && (
                  <span className="bg-muted px-1.5 py-0.5 rounded-full">
                    {session.messageCount} msgs
                  </span>
                )}
                {session.active && (
                  <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {onResume && !session.active && (
          <ContextMenuItem onClick={onResume}>
            <Play className="w-4 h-4 mr-2" />
            Resume Session
          </ContextMenuItem>
        )}
        {onFork && (
          <ContextMenuItem onClick={onFork}>
            <GitFork className="w-4 h-4 mr-2" />
            Fork Session
          </ContextMenuItem>
        )}
        {onDelete && (
          <ContextMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Session
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
