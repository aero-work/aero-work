import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { ChatView } from "@/components/chat";
import { EditorPanel } from "@/components/editor";
import { TerminalPanel } from "@/components/terminal";
import { PermissionDialog } from "@/components/common/PermissionDialog";
import { ThreePanelLayout } from "@/components/ui/resizable";
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

  const renderMainContent = () => {
    if (hasOpenFiles) {
      return (
        <ThreePanelLayout
          sidebar={<Sidebar />}
          center={<ChatView />}
          right={<EditorPanel />}
        />
      );
    }

    return (
      <div className="flex h-full">
        {/* Two-panel layout when no files open */}
        <div className="w-60 border-r flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 min-w-0">
          <ChatView />
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-hidden">
        {isTerminalPanelOpen ? (
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} minSize={30}>
              {renderMainContent()}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={15} maxSize={60}>
              <TerminalPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          renderMainContent()
        )}
      </main>
      <StatusBar />
      <PermissionDialog />
    </div>
  );
}
