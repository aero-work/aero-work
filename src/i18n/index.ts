import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

// All supported languages with their display names
export const languages: Record<string, string> = {
  en: "English",
  zh: "中文",
};

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

export const supportedLanguages = Object.keys(resources);

/**
 * Detect browser language and return a supported language code
 */
export function detectLanguage(): string {
  // Try to get the primary language code (e.g., "en" from "en-US")
  const browserLang = navigator.language.split("-")[0];

  if (supportedLanguages.includes(browserLang)) {
    return browserLang;
  }

  // Check if any of the user's preferred languages are supported
  for (const lang of navigator.languages) {
    const primary = lang.split("-")[0];
    if (supportedLanguages.includes(primary)) {
      return primary;
    }
  }

  // Default to English
  return "en";
}

/**
 * Get the initial language from localStorage or detect from browser
 */
function getInitialLanguage(): string {
  try {
    const stored = localStorage.getItem("aero-code-settings");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.state?.language && supportedLanguages.includes(settings.state.language)) {
        return settings.state.language;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return detectLanguage();
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Return key if translation is missing (helps identify untranslated strings)
    returnNull: false,
    returnEmptyString: false,
  });

export default i18n;
