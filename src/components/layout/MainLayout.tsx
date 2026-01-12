import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { ChatView } from "@/components/chat";
import { EditorPanel } from "@/components/editor";
import { TerminalPanel } from "@/components/terminal";
import { PermissionDialog } from "@/components/common/PermissionDialog";
import { useFileStore } from "@/stores/fileStore";
import { useTerminalStore } from "@/stores/terminalStore";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export function MainLayout() {
  const hasOpenFiles = useFileStore((state) => state.openFiles.length > 0);
  const isTerminalPanelOpen = useTerminalStore((state) => state.isTerminalPanelOpen);

  // Main horizontal content (sidebar + chat + optional editor)
  const renderHorizontalContent = () => {
    if (hasOpenFiles) {
      // Three-panel layout: sidebar | chat | editor
      return (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar */}
          <ResizablePanel defaultSize={15} minSize={10} maxSize={30}>
            <div className="h-full border-r overflow-hidden">
              <Sidebar />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Center (chat) */}
          <ResizablePanel defaultSize={45} minSize={20}>
            <div className="h-full border-r overflow-hidden">
              <ChatView />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Right panel (editor) */}
          <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
            <div className="h-full overflow-hidden">
              <EditorPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    }

    // Two-panel layout: sidebar | chat
    return (
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={20} minSize={12} maxSize={35}>
          <div className="h-full border-r overflow-hidden">
            <Sidebar />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={80} minSize={50}>
          <div className="h-full overflow-hidden">
            <ChatView />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 min-h-0 overflow-hidden">
        {isTerminalPanelOpen ? (
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={65} minSize={20}>
              {renderHorizontalContent()}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={10} maxSize={80}>
              <TerminalPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          renderHorizontalContent()
        )}
      </main>
      <StatusBar />
      <PermissionDialog />
    </div>
  );
}
