import { useSettingsStore, type SettingsPanel } from "@/stores/settingsStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Settings2, Bot, Wrench, Shield, Puzzle, Sparkles } from "lucide-react";
import { MCPSettings } from "./MCPSettings";
import { ModelSettings } from "./ModelSettings";
import { PermissionSettings } from "./PermissionSettings";
import { GeneralSettings } from "./GeneralSettings";
import { AgentSettings } from "./AgentSettings";
import { PluginsSettings } from "./PluginsSettings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const PANEL_CONFIG: { id: SettingsPanel; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "models", label: "Models", icon: Sparkles },
  { id: "mcp", label: "MCP Servers", icon: Wrench },
  { id: "plugins", label: "Plugins", icon: Puzzle },
  { id: "permissions", label: "Permissions", icon: Shield },
];

export function SettingsPage() {
  const activePanel = useSettingsStore((state) => state.activePanel);
  const setActivePanel = useSettingsStore((state) => state.setActivePanel);
  const closeSettings = useSettingsStore((state) => state.closeSettings);
  const isMobile = useIsMobile();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - only show on desktop */}
      {!isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeSettings}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activePanel || "general"}
        onValueChange={(value) => setActivePanel(value as SettingsPanel)}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="border-b px-2 sm:px-4">
          <TabsList className={cn(
            "w-full justify-start bg-transparent p-0",
            isMobile ? "h-14 gap-0" : "h-10 gap-1"
          )}>
            {PANEL_CONFIG.map((panel) => {
              const Icon = panel.icon;
              return (
                <TabsTrigger
                  key={panel.id}
                  value={panel.id!}
                  className={cn(
                    "relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                    isMobile ? "h-14 px-2 flex-1" : "h-10 px-3"
                  )}
                >
                  <div className={cn(
                    "flex items-center",
                    isMobile ? "flex-col gap-1" : "flex-row gap-2"
                  )}>
                    <Icon className={cn(isMobile ? "w-6 h-6" : "w-4 h-4")} />
                    <span className={cn(
                      isMobile ? "text-[10px] leading-none" : "hidden sm:inline text-sm"
                    )}>
                      {isMobile ? panel.label.split(" ")[0] : panel.label}
                    </span>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6 max-w-2xl mx-auto">
            <TabsContent value="general" className="m-0 mt-0">
              <GeneralSettings />
            </TabsContent>

            <TabsContent value="agents" className="m-0 mt-0">
              <AgentSettings />
            </TabsContent>

            <TabsContent value="models" className="m-0 mt-0">
              <ModelSettings />
            </TabsContent>

            <TabsContent value="mcp" className="m-0 mt-0">
              <MCPSettings />
            </TabsContent>

            <TabsContent value="plugins" className="m-0 mt-0">
              <PluginsSettings />
            </TabsContent>

            <TabsContent value="permissions" className="m-0 mt-0">
              <PermissionSettings />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
