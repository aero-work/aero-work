import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/stores/settingsStore";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { languages, supportedLanguages } from "@/i18n";

export function GeneralSettings() {
  const { t } = useTranslation();
  const autoConnect = useSettingsStore((state) => state.autoConnect);
  const showHiddenFiles = useSettingsStore((state) => state.showHiddenFiles);
  const theme = useSettingsStore((state) => state.theme);
  const autoCleanEmptySessions = useSettingsStore((state) => state.autoCleanEmptySessions);
  const language = useSettingsStore((state) => state.language);
  const setAutoConnect = useSettingsStore((state) => state.setAutoConnect);
  const setShowHiddenFiles = useSettingsStore((state) => state.setShowHiddenFiles);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setAutoCleanEmptySessions = useSettingsStore((state) => state.setAutoCleanEmptySessions);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("settings.general")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("settings.language.description")}
        </p>
      </div>

      <div className="space-y-4">
        {/* Language */}
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4">
          <div className="space-y-0.5 min-w-0">
            <Label className="text-sm sm:text-base">{t("settings.language.title")}</Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("settings.language.description")}
            </p>
          </div>
          <Select value={language || "auto"} onValueChange={(value) => setLanguage(value === "auto" ? "" : value)}>
            <SelectTrigger className="w-[140px] sm:w-[180px] flex-shrink-0">
              <SelectValue>
                {language === "" ? t("settings.language.auto") : (languages[language] || language)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{t("settings.language.auto")}</SelectItem>
              {supportedLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {languages[lang] || lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Theme */}
        <div className="rounded-lg border p-3 sm:p-4">
          <div className="space-y-0.5 mb-3">
            <Label className="text-sm sm:text-base">{t("settings.theme.title")}</Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("settings.theme.description")}
            </p>
          </div>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`flex-1 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  theme === themeOption
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {t(`settings.theme.${themeOption}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Connect */}
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4">
          <div className="space-y-0.5 min-w-0">
            <Label htmlFor="auto-connect" className="text-sm sm:text-base">
              {t("settings.autoConnect.title")}
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("settings.autoConnect.description")}
            </p>
          </div>
          <Switch
            id="auto-connect"
            checked={autoConnect}
            onCheckedChange={setAutoConnect}
            className="flex-shrink-0"
          />
        </div>

        {/* Auto Clean Empty Sessions */}
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4">
          <div className="space-y-0.5 min-w-0">
            <Label htmlFor="auto-clean-sessions" className="text-sm sm:text-base">
              {t("settings.autoCleanEmptySessions.title")}
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("settings.autoCleanEmptySessions.description")}
            </p>
          </div>
          <Switch
            id="auto-clean-sessions"
            checked={autoCleanEmptySessions}
            onCheckedChange={setAutoCleanEmptySessions}
            className="flex-shrink-0"
          />
        </div>

        {/* Show Hidden Files (inverted logic: UI shows "Hide Hidden Files") */}
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4">
          <div className="space-y-0.5 min-w-0">
            <Label htmlFor="hidden-files" className="text-sm sm:text-base">
              {t("settings.hideHiddenFiles.title")}
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("settings.hideHiddenFiles.description")}
            </p>
          </div>
          <Switch
            id="hidden-files"
            checked={!showHiddenFiles}
            onCheckedChange={(checked) => setShowHiddenFiles(!checked)}
            className="flex-shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
