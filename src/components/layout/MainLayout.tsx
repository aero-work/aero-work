import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { ChatView } from "@/components/chat";
import { PermissionDialog } from "@/components/common/PermissionDialog";
import { ResizableLayout } from "@/components/ui/resizable";

export function MainLayout() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-hidden">
        <ResizableLayout
          sidebar={<Sidebar />}
          main={<ChatView />}
          sidebarDefaultSize={240}
          sidebarMinSize={180}
          sidebarMaxSize={400}
        />
      </main>
      <StatusBar />
      <PermissionDialog />
    </div>
  );
}
