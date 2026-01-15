import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone;
    if (isStandalone) return;

    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);

    if (isIOSDevice && isSafari) {
      setIsIOS(true);
      setShowPrompt(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-card border border-border rounded-lg p-4 shadow-lg animate-in slide-in-from-bottom-4">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="pr-6">
        <h3 className="font-semibold text-foreground mb-1">
          Install Aero Code
        </h3>

        {isIOS ? (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Add to home screen for the best experience:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li className="flex items-center gap-1">
                Tap the share button <Share className="h-4 w-4 inline" />
              </li>
              <li className="flex items-center gap-1">
                Select "Add to Home Screen" <PlusSquare className="h-4 w-4 inline" />
              </li>
            </ol>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Install this app for quick access and offline support.
            </p>
            <Button onClick={handleInstall} size="sm">
              Install
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
