import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettingsStore, type SettingsPanel } from "@/stores/settingsStore";
import { Server, Bot, Shield, Settings2 } from "lucide-react";
import { MCPSettings } from "./MCPSettings";
import { ModelSettings } from "./ModelSettings";
import { PermissionSettings } from "./PermissionSettings";
import { GeneralSettings } from "./GeneralSettings";

const PANEL_CONFIG: { id: SettingsPanel; labelKey: string; icon: React.ReactNode }[] = [
  { id: "general", labelKey: "settings.general", icon: <Settings2 className="w-4 h-4" /> },
  { id: "models", labelKey: "settings.models", icon: <Bot className="w-4 h-4" /> },
  { id: "mcp", labelKey: "settings.mcpServers", icon: <Server className="w-4 h-4" /> },
  { id: "permissions", labelKey: "settings.permissions", icon: <Shield className="w-4 h-4" /> },
];

export function SettingsDialog() {
  const { t } = useTranslation();
  const isOpen = useSettingsStore((state) => state.isOpen);
  const activePanel = useSettingsStore((state) => state.activePanel);
  const closeSettings = useSettingsStore((state) => state.closeSettings);
  const setActivePanel = useSettingsStore((state) => state.setActivePanel);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activePanel || "general"}
          onValueChange={(value) => setActivePanel(value as SettingsPanel)}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-4">
            {PANEL_CONFIG.map((panel) => (
              <TabsTrigger
                key={panel.id}
                value={panel.id!}
                className="flex items-center gap-2"
              >
                {panel.icon}
                <span className="hidden sm:inline">{t(panel.labelKey)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto mt-4">
            <TabsContent value="general" className="h-full m-0">
              <GeneralSettings />
            </TabsContent>

            <TabsContent value="models" className="h-full m-0">
              <ModelSettings />
            </TabsContent>

            <TabsContent value="mcp" className="h-full m-0">
              <MCPSettings />
            </TabsContent>

            <TabsContent value="permissions" className="h-full m-0">
              <PermissionSettings />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
