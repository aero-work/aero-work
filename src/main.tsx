import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { enableMapSet } from "immer";
import App from "./App";
import "./index.css";

// Enable Immer support for Set and Map (used in fileStore for expandedPaths)
enableMapSet();

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
