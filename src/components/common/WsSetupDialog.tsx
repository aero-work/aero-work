import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/stores/settingsStore";
import { isDesktopApp, isMobileTauriApp } from "@/services/transport";
import { Wifi, QrCode } from "lucide-react";

interface WsSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => void;
}

export function WsSetupDialog({ open, onOpenChange, onConnect }: WsSetupDialogProps) {
  const { t } = useTranslation();
  const wsUrl = useSettingsStore((state) => state.wsUrl);
  const setWsUrl = useSettingsStore((state) => state.setWsUrl);

  const [inputUrl, setInputUrl] = useState(wsUrl || "");

  useEffect(() => {
    setInputUrl(wsUrl || "");
  }, [wsUrl, open]);

  const handleConnect = () => {
    if (inputUrl.trim()) {
      setWsUrl(inputUrl.trim());
    }
    onOpenChange(false);
    // Reload to apply new URL
    window.location.reload();
  };

  const handleSkip = () => {
    onOpenChange(false);
    onConnect();
  };

  // Don't show for desktop Tauri apps (they auto-connect to localhost)
  // But DO show for mobile Tauri apps (they need to configure server URL)
  if (isDesktopApp() && !isMobileTauriApp()) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            {t("settings.serverConnection.title")}
          </DialogTitle>
          <DialogDescription>
            {t("settings.serverConnection.wsUrlDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ws-url">{t("settings.serverConnection.wsUrl")}</Label>
            <Input
              id="ws-url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder={t("settings.serverConnection.wsUrlPlaceholder")}
              className="font-mono"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <QrCode className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              {t("settings.serverConnection.scanToConnect")}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleSkip} className="sm:flex-1">
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConnect} className="sm:flex-1">
            {t("connection.connect")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
