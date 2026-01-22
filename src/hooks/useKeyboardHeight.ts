import { useState, useEffect } from "react";

// Extend Window interface for Android keyboard height
declare global {
  interface WindowEventMap {
    androidKeyboardHeight: CustomEvent<{ height: number }>;
  }
  interface Window {
    __ANDROID_KEYBOARD_HEIGHT__?: number;
  }
}

/**
 * Hook to detect virtual keyboard height on mobile devices.
 *
 * On Android Tauri WebView with edge-to-edge mode, the standard visualViewport
 * API doesn't work. This hook listens for native Android keyboard height events
 * dispatched from MainActivity.kt via evaluateJavascript.
 *
 * Falls back to visualViewport API for other platforms (iOS, PWA, etc.)
 *
 * @returns keyboardHeight - The current keyboard height in pixels (0 when hidden)
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Check for initial Android keyboard height (in case event fired before mount)
    if (typeof window.__ANDROID_KEYBOARD_HEIGHT__ === "number") {
      setKeyboardHeight(window.__ANDROID_KEYBOARD_HEIGHT__);
    }

    // Listen for Android native keyboard height events
    const handleAndroidKeyboard = (e: CustomEvent<{ height: number }>) => {
      const height = e.detail?.height || 0;
      setKeyboardHeight(height);
    };

    window.addEventListener("androidKeyboardHeight", handleAndroidKeyboard);

    // Fallback: visualViewport API for non-Android platforms
    const viewport = window.visualViewport;
    if (viewport) {
      let initialHeight = viewport.height;

      const handleResize = () => {
        const currentHeight = viewport.height;
        if (currentHeight > initialHeight) {
          initialHeight = currentHeight;
        }

        const heightDiff = Math.max(0, initialHeight - currentHeight);
        const height = Math.max(heightDiff, viewport.offsetTop);

        // Only update if significant change and no Android height is set
        if (height > 50 && !window.__ANDROID_KEYBOARD_HEIGHT__) {
          setKeyboardHeight(height);
        } else if (height <= 50 && !window.__ANDROID_KEYBOARD_HEIGHT__) {
          setKeyboardHeight(0);
        }
      };

      viewport.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("androidKeyboardHeight", handleAndroidKeyboard);
        viewport.removeEventListener("resize", handleResize);
      };
    }

    return () => {
      window.removeEventListener("androidKeyboardHeight", handleAndroidKeyboard);
    };
  }, []);

  return keyboardHeight;
}
