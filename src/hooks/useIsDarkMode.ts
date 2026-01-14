import { useState, useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

export function useIsDarkMode(): boolean {
  const theme = useSettingsStore((state) => state.theme);
  const [isDark, setIsDark] = useState(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return theme === "dark";
  });

  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      setIsDark(theme === "dark");
    }
  }, [theme]);

  return isDark;
}
