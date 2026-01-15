import { useSettingsStore } from "@/stores/settingsStore";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function GeneralSettings() {
  const autoConnect = useSettingsStore((state) => state.autoConnect);
  const showHiddenFiles = useSettingsStore((state) => state.showHiddenFiles);
  const theme = useSettingsStore((state) => state.theme);
  const autoCleanEmptySessions = useSettingsStore((state) => state.autoCleanEmptySessions);
  const setAutoConnect = useSettingsStore((state) => state.setAutoConnect);
  const setShowHiddenFiles = useSettingsStore((state) => state.setShowHiddenFiles);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setAutoCleanEmptySessions = useSettingsStore((state) => state.setAutoCleanEmptySessions);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure general application behavior.
        </p>
      </div>

      <div className="space-y-4">
        {/* Auto Connect */}
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4">
          <div className="space-y-0.5 min-w-0">
            <Label htmlFor="auto-connect" className="text-sm sm:text-base">
              Auto Connect
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Auto connect on startup
            </p>
          </div>
          <Switch
            id="auto-connect"
            checked={autoConnect}
            onCheckedChange={setAutoConnect}
            className="flex-shrink-0"
          />
        </div>

        {/* Show Hidden Files */}
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4">
          <div className="space-y-0.5 min-w-0">
            <Label htmlFor="hidden-files" className="text-sm sm:text-base">
              Show Hidden Files
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Display hidden files in file tree
            </p>
          </div>
          <Switch
            id="hidden-files"
            checked={showHiddenFiles}
            onCheckedChange={setShowHiddenFiles}
            className="flex-shrink-0"
          />
        </div>

        {/* Auto Clean Empty Sessions */}
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4">
          <div className="space-y-0.5 min-w-0">
            <Label htmlFor="auto-clean-sessions" className="text-sm sm:text-base">
              Auto Clean Sessions
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Remove empty sessions on load
            </p>
          </div>
          <Switch
            id="auto-clean-sessions"
            checked={autoCleanEmptySessions}
            onCheckedChange={setAutoCleanEmptySessions}
            className="flex-shrink-0"
          />
        </div>

        {/* Theme */}
        <div className="rounded-lg border p-3 sm:p-4">
          <div className="space-y-0.5 mb-3">
            <Label className="text-sm sm:text-base">Theme</Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Choose your preferred color theme
            </p>
          </div>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  theme === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
