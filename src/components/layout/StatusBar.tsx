import { useAgentStore } from "@/stores/agentStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useFileStore } from "@/stores/fileStore";
import { cn } from "@/lib/utils";
import { Circle, FolderOpen, MessageSquare } from "lucide-react";

export function StatusBar() {
  const connectionStatus = useAgentStore((state) => state.connectionStatus);
  const agentInfo = useAgentStore((state) => state.agentInfo);
  const sessions = useSessionStore((state) => state.sessions);
  const currentWorkingDir = useFileStore((state) => state.currentWorkingDir);
  const isLoading = useSessionStore((state) => state.isLoading);

  const sessionCount = Object.keys(sessions).length;
  const isConnected = connectionStatus === "connected";

  return (
    <footer className="h-6 border-t bg-muted/50 flex items-center justify-between px-3 text-xs">
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-1.5">
          <Circle
            className={cn(
              "w-2 h-2 fill-current",
              isConnected ? "text-green-500" : "text-muted-foreground"
            )}
          />
          <span className="text-muted-foreground">
            {isConnected
              ? agentInfo?.title || agentInfo?.name || "Connected"
              : "Disconnected"}
          </span>
        </div>

        {/* Working Directory */}
        {currentWorkingDir && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FolderOpen className="w-3 h-3" />
            <span className="max-w-48 truncate">{currentWorkingDir}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Loading indicator */}
        {isLoading && (
          <span className="text-muted-foreground animate-pulse">
            Processing...
          </span>
        )}

        {/* Session Count */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MessageSquare className="w-3 h-3" />
          <span>
            {sessionCount} session{sessionCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </footer>
  );
}
