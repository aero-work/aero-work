import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { enableMapSet } from "immer";
import App from "./App";
import "./i18n"; // Initialize i18n
import "./index.css";

// Enable Immer support for Set and Map (used in fileStore for expandedPaths)
enableMapSet();

// Clear persisted session ID on first launch to show welcome screen
// Must happen before React renders to avoid showing stale session
const SETTINGS_STORAGE_KEY = "aero-work-settings";
const SESSION_STORAGE_KEY = "aero-work-session";
try {
  const settingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
  const settings = settingsJson ? JSON.parse(settingsJson) : null;
  if (!settings?.state?.hasLaunchedBefore) {
    // First launch: clear any persisted session ID
    const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionJson) {
      const sessionState = JSON.parse(sessionJson);
      if (sessionState?.state?.activeSessionId) {
        sessionState.state.activeSessionId = null;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionState));
        console.log("First launch: cleared persisted session ID");
      }
    }
  }
} catch (e) {
  console.warn("Failed to check first launch state:", e);
}

// Register service worker for PWA (handled by vite-plugin-pwa)
registerSW({
  onRegistered(registration) {
    console.log("[PWA] Service Worker registered:", registration?.scope);
  },
  onRegisterError(error) {
    console.log("[PWA] Service Worker registration failed:", error);
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
