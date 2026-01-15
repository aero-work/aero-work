import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMobileNavStore } from "@/stores/mobileNavStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useAgentStore } from "@/stores/agentStore";
import { useFileStore } from "@/stores/fileStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { agentAPI } from "@/services/api";
import { ProjectSelector } from "@/components/common/ProjectSelector";
import {
  MessageSquare,
  Settings,
  Plus,
  History,
  RefreshCw,
  GitFork,
  Loader2,
  FolderOpen,
  X,
} from "lucide-react";
import { useState } from "react";
import type { SessionInfo } from "@/types/acp";

export function MobileSidebar() {
  const isSidebarOpen = useMobileNavStore((state) => state.isSidebarOpen);
  const closeSidebar = useMobileNavStore((state) => state.closeSidebar);
  const setView = useMobileNavStore((state) => state.setView);

  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const setActiveSession = useSessionStore((state) => state.setActiveSession);
  const availableSessions = useSessionStore((state) => state.availableSessions);
  const availableSessionsLoading = useSessionStore((state) => state.availableSessionsLoading);

  const connectionStatus = useAgentStore((state) => state.connectionStatus);
  const currentWorkingDir = useFileStore((state) => state.currentWorkingDir);
  const addRecentProject = useFileStore((state) => state.addRecentProject);
  const closeSettings = useSettingsStore((state) => state.closeSettings);

  const [resumingSessionId, setResumingSessionId] = useState<string | null>(null);

  const isConnected = connectionStatus === "connected";
  const activeSessions = availableSessions.filter((s) => s.active);
  const historicalSessions = availableSessions.filter((s) => !s.active);

  useEffect(() => {
    if (isConnected) {
      agentAPI.listSessions(currentWorkingDir || undefined, 20, 0).catch(console.error);
    }
  }, [isConnected, currentWorkingDir]);

  const handleNewSession = async () => {
    if (!currentWorkingDir) return;
    try {
      await agentAPI.createSession(currentWorkingDir);
      closeSidebar();
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSession(sessionId);
    closeSettings();
    closeSidebar();
    setView("session-list");
  };

  const handleResumeSession = async (sessionInfo: SessionInfo) => {
    if (!currentWorkingDir) return;
    closeSettings();
    setResumingSessionId(sessionInfo.id);
    try {
      await agentAPI.resumeSession(sessionInfo.id, sessionInfo.cwd || currentWorkingDir);
      await agentAPI.listSessions(currentWorkingDir, 20, 0);
      closeSidebar();
      setView("session-list");
    } catch (error) {
      console.error("Failed to resume session:", error);
    } finally {
      setResumingSessionId(null);
    }
  };

  const handleForkSession = async (e: React.MouseEvent, sessionInfo: SessionInfo) => {
    e.stopPropagation();
    if (!currentWorkingDir) return;
    setResumingSessionId(sessionInfo.id);
    try {
      await agentAPI.forkSession(sessionInfo.id, sessionInfo.cwd || currentWorkingDir);
      await agentAPI.listSessions(currentWorkingDir, 20, 0);
      closeSidebar();
      setView("session-list");
    } catch (error) {
      console.error("Failed to fork session:", error);
    } finally {
      setResumingSessionId(null);
    }
  };

  const handleRefreshSessions = async () => {
    if (!isConnected) return;
    await agentAPI.listSessions(currentWorkingDir || undefined, 20, 0);
  };

  const handleOpenSettings = () => {
    closeSidebar();
    setView("settings");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-200",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeSidebar}
      />

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-[80%] max-w-[320px] bg-sidebar z-50 flex flex-col",
          "transition-transform duration-200 ease-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
          <h2 className="font-semibold text-lg">Menu</h2>
          <Button variant="ghost" size="icon" onClick={closeSidebar} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Project Selector */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <ProjectSelector
            onSelect={addRecentProject}
            trigger={
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <FolderOpen className="w-4 h-4" />
                {currentWorkingDir ? (
                  <span className="truncate">{currentWorkingDir.split("/").pop()}</span>
                ) : (
                  "Open Project"
                )}
              </Button>
            }
          />
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Sessions</span>
            <div className="flex items-center gap-1">
              {isConnected && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleRefreshSessions}
                    disabled={availableSessionsLoading}
                  >
                    {availableSessionsLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  {currentWorkingDir && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleNewSession}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="px-2 space-y-1">
            {activeSessions.length === 0 && historicalSessions.length === 0 ? (
              <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                {isConnected
                  ? currentWorkingDir
                    ? "No sessions yet"
                    : "Select a project first"
                  : "Connect to start"}
              </div>
            ) : (
              <>
                {/* Active Sessions */}
                {activeSessions.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Active
                    </div>
                    {activeSessions.map((session) => (
                      <button
                        key={session.id}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-left",
                          activeSessionId === session.id
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        )}
                        onClick={() => handleSelectSession(session.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MessageSquare className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">{session.summary || "Session"}</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      </button>
                    ))}
                  </>
                )}

                {/* Historical Sessions */}
                {historicalSessions.length > 0 && (
                  <>
                    <div className="px-2 py-1 mt-2 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <History className="w-3 h-3" />
                      History
                    </div>
                    {historicalSessions.map((sessionInfo) => (
                      <div
                        key={sessionInfo.id}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-left hover:bg-accent/50 cursor-pointer",
                          resumingSessionId === sessionInfo.id && "opacity-50"
                        )}
                        onClick={() => handleResumeSession(sessionInfo)}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <History className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                            <span className="text-sm truncate">
                              {sessionInfo.summary || "Session"}
                            </span>
                          </div>
                          {sessionInfo.lastUserMessage && (
                            <span className="text-xs text-muted-foreground truncate pl-5">
                              {sessionInfo.lastUserMessage}
                            </span>
                          )}
                        </div>
                        {resumingSessionId === sessionInfo.id ? (
                          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={(e) => handleForkSession(e, sessionInfo)}
                          >
                            <GitFork className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Settings Button */}
        <div className="border-t border-sidebar-border">
          <button
            onClick={handleOpenSettings}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </>
  );
}
