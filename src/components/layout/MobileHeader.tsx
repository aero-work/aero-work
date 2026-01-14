import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useMobileNavStore, type MobileView } from "@/stores/mobileNavStore";
import { useAgentStore, type ConnectionStatus } from "@/stores/agentStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useFileStore } from "@/stores/fileStore";
import { agentAPI } from "@/services/api";
import * as fileService from "@/services/fileService";
import { Menu, ArrowLeft, Plug, PlugZap, Loader2, AlertCircle, Save, Download } from "lucide-react";

const VIEW_TITLES: Record<MobileView, string> = {
  chat: "Aero Code",
  files: "Files",
  terminal: "Terminal",
  settings: "Settings",
  "file-viewer": "File",
};

const statusConfig: Record<
  ConnectionStatus,
  { icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  disconnected: { icon: Plug, className: "text-muted-foreground" },
  connecting: { icon: Loader2, className: "text-blue-500 animate-spin" },
  connected: { icon: PlugZap, className: "text-green-500" },
  error: { icon: AlertCircle, className: "text-destructive" },
};

export function MobileHeader() {
  const currentView = useMobileNavStore((state) => state.currentView);
  const goBack = useMobileNavStore((state) => state.goBack);
  const openSidebar = useMobileNavStore((state) => state.openSidebar);
  const viewingFilePath = useMobileNavStore((state) => state.viewingFilePath);
  const connectionStatus = useAgentStore((state) => state.connectionStatus);
  const closeSettings = useSettingsStore((state) => state.closeSettings);

  const openFiles = useFileStore((state) => state.openFiles);
  const markFileSaved = useFileStore((state) => state.markFileSaved);

  const { icon: StatusIcon, className: statusClassName } = statusConfig[connectionStatus];
  const isConnected = connectionStatus === "connected";
  const showBackButton = currentView === "settings" || currentView === "file-viewer";

  // Get current file being viewed
  const currentFile = openFiles.find((f) => f.path === viewingFilePath);

  const handleGoBack = () => {
    if (currentView === "settings") {
      closeSettings();
    }
    goBack();
  };

  // Get title - for file-viewer, show filename
  const getTitle = () => {
    if (currentView === "file-viewer" && viewingFilePath) {
      return viewingFilePath.split("/").pop() || "File";
    }
    return VIEW_TITLES[currentView];
  };

  const handleConnect = async () => {
    if (connectionStatus === "connecting") return;

    if (isConnected) {
      await agentAPI.disconnect();
    } else {
      try {
        await agentAPI.connect();
      } catch (error) {
        console.error("Failed to connect:", error);
      }
    }
  };

  // Save file to backend
  const handleSave = useCallback(async () => {
    if (!currentFile || !currentFile.isDirty) return;
    try {
      await fileService.writeFile(currentFile.path, currentFile.content);
      markFileSaved(currentFile.path);
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  }, [currentFile, markFileSaved]);

  // Download file to local machine
  const handleDownload = useCallback(() => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentFile]);

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-2 flex-shrink-0">
      <div className="flex items-center gap-1">
        {showBackButton ? (
          <Button variant="ghost" size="icon" onClick={handleGoBack} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={openSidebar} className="h-9 w-9">
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <h1
          className="font-semibold text-base truncate max-w-[140px]"
          style={currentView === "chat" ? { fontFamily: "Quantico, sans-serif", fontStyle: "italic" } : undefined}
        >
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        {/* File action buttons - only show in file-viewer */}
        {currentView === "file-viewer" && currentFile && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              disabled={!currentFile.isDirty}
              className="h-9 w-9"
              title="Save"
            >
              <Save className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-9 w-9"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Connection status button - hide in file-viewer */}
        {currentView !== "file-viewer" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleConnect}
            disabled={connectionStatus === "connecting"}
            className="h-9 w-9"
          >
            <StatusIcon className={statusClassName} />
          </Button>
        )}
      </div>
    </header>
  );
}
