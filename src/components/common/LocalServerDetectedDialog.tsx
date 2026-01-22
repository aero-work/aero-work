import { useTranslation } from "react-i18next";
import { useAgentStore } from "@/stores/agentStore";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Server } from "lucide-react";

/**
 * Dialog shown when connection fails but a local server is detected on default port.
 * Only appears in desktop app mode.
 */
export function LocalServerDetectedDialog() {
  const { t } = useTranslation();
  const detectedLocalServer = useAgentStore((state) => state.detectedLocalServer);
  const setDetectedLocalServer = useAgentStore((state) => state.setDetectedLocalServer);
  const setWsUrl = useSettingsStore((state) => state.setWsUrl);

  const handleConnect = () => {
    if (detectedLocalServer) {
      // Clear custom URL to use auto-detected default
      setWsUrl(null);
      setDetectedLocalServer(null);
      // Reload to reconnect with new URL
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setDetectedLocalServer(null);
  };

  if (!detectedLocalServer) {
    return null;
  }

  return (
    <Dialog open={!!detectedLocalServer} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            {t("connection.localServerDetected")}
          </DialogTitle>
          <DialogDescription>
            {t("connection.localServerDetectedDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <code className="block px-3 py-2 bg-muted rounded-md text-sm font-mono">
            {detectedLocalServer}
          </code>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDismiss}>
            {t("common.dismiss")}
          </Button>
          <Button onClick={handleConnect}>
            {t("connection.connectToLocal")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
