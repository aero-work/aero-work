import { cn } from "@/lib/utils";
import { useMobileNavStore, type MobileView } from "@/stores/mobileNavStore";
import { MessageSquare, FolderTree, Terminal } from "lucide-react";

interface NavItem {
  id: MobileView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "files", label: "Files", icon: FolderTree },
  { id: "terminal", label: "Terminal", icon: Terminal },
];

export function MobileNavBar() {
  const currentView = useMobileNavStore((state) => state.currentView);
  const setView = useMobileNavStore((state) => state.setView);

  // Hide nav bar in settings view
  if (currentView === "settings") {
    return null;
  }

  return (
    <nav className="h-14 border-t border-border bg-card flex items-center justify-around flex-shrink-0 safe-area-bottom">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
