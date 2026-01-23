# Known Issues

## Desktop App: Chinese IME Enter Key Issue

**Status**: Open
**Platform**: Tauri Desktop (macOS)
**Component**: `src/components/chat/ChatInput.tsx`

### Description

When using Chinese input method (IME) in the chat input box, pressing Enter to confirm the IME selection also triggers message send. This issue only occurs in the Tauri desktop app, not in web browser mode.

### Expected Behavior

Pressing Enter while IME is composing should only confirm the character selection, not send the message.

### Current Implementation

```typescript
const handleKeyDown = useCallback(
  (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Check both e.isComposing (native) and isComposingRef (manual tracking for webkit)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !isComposingRef.current) {
      e.preventDefault();
      handleSend();
    }
  },
  [handleSend]
);

const handleCompositionStart = useCallback(() => {
  isComposingRef.current = true;
}, []);

const handleCompositionEnd = useCallback(() => {
  // Delay reset to ensure keydown event has been processed
  setTimeout(() => {
    isComposingRef.current = false;
  }, 0);
}, []);
```

### Attempted Fixes

1. Using `compositionstart`/`compositionend` events with ref tracking - works in web, not in desktop
2. Added `e.nativeEvent.isComposing` check - still not working in desktop
3. Added `setTimeout` delay in `compositionEnd` - still not working in desktop

### Possible Causes

- Tauri WebView (WebKit on macOS) may have different event ordering than Chrome
- The `keydown` event might fire before `compositionend` in WebKit
- `isComposing` property might not be set correctly in WebKit WebView

### Potential Solutions to Try

1. Use `keyCode === 229` check (229 is the keyCode for IME processing)
2. Check `e.key === "Process"` which some browsers use for IME
3. Investigate Tauri-specific WebView event handling
4. Consider using `keyup` instead of `keydown` for Enter detection

---

## Android PWA: HTTP Standalone Mode Limitation

**Status**: Known Limitation (Browser Security Policy)
**Platform**: Android Chrome
**Component**: `src/components/common/InstallPrompt.tsx`

### Description

When accessing the web app via HTTP (not HTTPS) on Android Chrome, the PWA cannot be installed in true standalone mode. Adding to home screen creates a browser shortcut that opens with the navigation bar visible, not as a fullscreen app.

### Root Cause

Chrome requires HTTPS for full PWA functionality due to security policies. The `beforeinstallprompt` event only fires on secure origins (HTTPS or localhost).

### Current Behavior

- **HTTPS**: Native install prompt, opens as standalone app (no browser UI)
- **HTTP**: Manual "Add to Home screen" instructions shown, opens in browser with address bar

### Workaround

Users can enable Chrome flags to treat specific HTTP origins as secure:

1. Open Chrome on Android, navigate to:
   ```
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```

2. Add the server address (e.g., `http://192.168.1.100:1420`)

3. Set to `Enabled` and relaunch Chrome

4. Reinstall the PWA - it will now work in standalone mode

### Alternative Solutions

1. **Self-signed HTTPS certificate**: Configure the server with HTTPS using mkcert or similar
2. **Use localhost**: Access via `localhost` which is treated as secure
3. **Reverse proxy with HTTPS**: Use nginx/caddy with Let's Encrypt for public access

---

## Android WebView: Keyboard Not Pushing Input Up (RESOLVED)

**Status**: Resolved
**Platform**: Android Tauri WebView
**Component**: `MainActivity.kt`, `MobileLayout.tsx`

### Description

On Android Tauri app with `enableEdgeToEdge()` enabled, the virtual keyboard does not push the input field up. Standard `windowSoftInputMode="adjustResize"` does not work in edge-to-edge (fullscreen) mode.

### Root Cause

Android WebView Bug #36911528 - `adjustResize` behavior is broken when the app uses edge-to-edge rendering. The `visualViewport` API also doesn't fire resize events in this mode.

### Solution

Implemented native keyboard detection using Android WindowInsets API:

1. **MainActivity.kt** - Listen for keyboard height via `WindowInsetsCompat.Type.ime()`:
   ```kotlin
   ViewCompat.setOnApplyWindowInsetsListener(rootView) { view, insets ->
     val imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime())
     val navBarInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars())
     // IME includes nav bar, subtract to get pure keyboard height
     val pureKeyboardHeight = imeInsets.bottom - navBarInsets.bottom
     notifyKeyboardHeight(pureKeyboardHeight)
     insets
   }
   ```

2. **Send to WebView** via `evaluateJavascript`:
   ```kotlin
   webView?.evaluateJavascript(
     "window.dispatchEvent(new CustomEvent('androidKeyboardHeight', { detail: { height: $height } }));",
     null
   )
   ```

3. **MobileLayout.tsx** - Listen for event and adjust container height:
   ```typescript
   const [keyboardHeight, setKeyboardHeight] = useState(0);
   useEffect(() => {
     const handler = (e: CustomEvent<{ height: number }>) => {
       // Convert physical pixels to CSS pixels
       const cssPx = Math.round(e.detail.height / window.devicePixelRatio);
       setKeyboardHeight(cssPx);
     };
     window.addEventListener("androidKeyboardHeight", handler);
     return () => window.removeEventListener("androidKeyboardHeight", handler);
   }, []);
   ```

4. **TabBar handling** - Subtract TabBar height from offset so it gets pushed behind keyboard:
   ```typescript
   const TAB_BAR_HEIGHT = 56;
   const keyboardOffset = isTabBarVisible ? keyboardHeight - TAB_BAR_HEIGHT : keyboardHeight;
   ```

### Key Learnings

- Android returns physical pixels, must divide by `devicePixelRatio` for CSS pixels
- IME insets include navigation bar height, must subtract `navigationBars().bottom`
- `src-tauri/gen/android/` files are generated but can be manually edited and preserved

---

## Android WebView: Back Gesture Exits App Instead of Navigating (RESOLVED)

**Status**: Resolved
**Platform**: Android Tauri WebView
**Component**: `MainActivity.kt`, `MobileLayout.tsx`

### Description

On Android, swiping back (gesture navigation) or pressing the back button exits the app instead of navigating to the previous screen within the app.

### Root Cause

Android's back gesture/button is handled by the system and passed to the Activity. In a WebView app, the default behavior is to finish the Activity (exit app) rather than navigate within the WebView.

### Solution

Intercept back events in `MainActivity.kt` and delegate navigation decisions to the frontend:

1. **MainActivity.kt** - Intercept back events:
   ```kotlin
   // Modern gesture back handling
   onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
     override fun handleOnBackPressed() {
       handleBackPress()
     }
   })

   // Handle back key when WebView has focus
   override fun dispatchKeyEvent(event: KeyEvent): Boolean {
     if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_DOWN) {
       handleBackPress()
       return true
     }
     return super.dispatchKeyEvent(event)
   }

   private fun handleBackPress() {
     wv?.evaluateJavascript("""
       (function() {
         if (typeof window.androidBackCallback === 'function') {
           return window.androidBackCallback();
         }
         return true;
       })()
     """.trimIndent()) { result ->
       if (result == "true") finish()
     }
   }
   ```

2. **MobileLayout.tsx** - Register callback:
   ```typescript
   useEffect(() => {
     window.androidBackCallback = () => {
       if (showBackButton()) {
         goBack();
         return false; // Prevent app exit
       }
       return true; // Allow app exit
     };
     return () => { delete window.androidBackCallback; };
   }, [goBack, showBackButton]);
   ```

### Maintenance

The custom `MainActivity.kt` is managed by `scripts/android-post-init.sh`. After running `tauri android init`, run the script to restore customizations:

```bash
./scripts/android-post-init.sh
```

---

## Message Sync & State Management Risks

**Status**: Under Review
**Platform**: All
**Component**: `src-tauri/src/server/websocket.rs`, `src/hooks/useSessionData.ts`, `src/services/api.ts`

### Overview

This section documents potential risks and edge cases in the message sending, receiving, and state synchronization system.

---

### 1. Dual Notification Channel (`session/update` vs `session/state_update`)

**Risk Level**: Medium

**Description**: Backend has two notification types:
- `session/update`: Raw ACP agent notifications (tool calls, message chunks)
- `session/state_update`: State manager updates (user message added, full state sync)

**Problem**: Frontend needs to handle both, but they may contain overlapping data.

**Current Mitigation**: Frontend `applyStateUpdate` has dedup logic for `tool_call_added`.

**Location**:
- `src/hooks/useSessionData.ts:278-300` (applyStateUpdate dedup)
- `src-tauri/src/server/websocket.rs:162-174` (session/update broadcast)

**Risk**: If backend starts sending `tool_call_added` via `session/state_update`, duplicates may occur.

---

### 2. Race Condition in `stop_session`

**Risk Level**: Low

**Description**: In `stop_session_handler`, session cwd is retrieved before unregister, then broadcast happens after unregister.

**Problem**: If session is deleted between these operations, broadcast may have stale data.

**Location**: `src-tauri/src/server/websocket.rs:1548-1569`

**Suggested Fix**: Capture all needed data before any mutations.

---

### 3. Missing `sessions/updated` Broadcast for `resume_session` and `fork_session`

**Risk Level**: Medium (PARTIALLY FIXED)

**Description**: These operations register new sessions but don't broadcast `sessions/updated`.

**Problem**: Other clients won't see newly resumed/forked sessions until they manually refresh.

**Location**:
- `resume_session_handler` (line ~1616)
- `fork_session_handler` (line ~1651)

**Status**: Need to add `broadcast_sessions_update()` calls to these handlers.

---

### 4. `cancel_session` Doesn't Update Status

**Risk Level**: Medium

**Description**: Cancelling a session doesn't update its status in the registry.

**Problem**: Session list may show incorrect status (still "running" after cancel).

**Location**: `src-tauri/src/server/websocket.rs:1555-1559`

**Suggested Fix**: Add `update_status` and broadcast after cancel.

---

### 5. Auto-Resume in `send_prompt` Doesn't Broadcast

**Risk Level**: Medium

**Description**: When a session doesn't exist in ACP agent, it auto-resumes, but doesn't broadcast the new session.

**Problem**: Auto-resumed session won't appear in other clients' lists.

**Location**: `src-tauri/src/server/websocket.rs:1448-1513`

**Suggested Fix**: Add `broadcast_sessions_update()` after auto-resume.

---

### 6. Optimistic Update Without Rollback

**Risk Level**: Medium

**Description**: Frontend optimistically adds user message before backend confirms.

**Problem**: If backend fails, message shows locally but wasn't actually sent. No rollback mechanism.

**Location**:
- `src/services/api.ts:275-285` (optimistic add)
- `src/hooks/useSessionData.ts:166-168` (local state update)

**Suggested Fix**: Implement error handling that removes optimistic messages on failure.

---

### 7. WebSocket Reconnect State Loss

**Risk Level**: Medium

**Description**: After WebSocket reconnect, client re-subscribes to session and gets full state.

**Problem**: If updates happened during disconnect, the timing of full state sync vs incremental updates may cause ordering issues.

**Location**: `src/hooks/useSessionData.ts` - subscription logic

**Potential Issue**: Messages received during reconnect might be processed out of order.

---

### 8. Message ID Deduplication Dependency

**Risk Level**: Low

**Description**: Frontend sends `messageId` for user messages. If not provided, backend generates new ID.

**Problem**: Network retry without messageId could create duplicate messages with different IDs.

**Location**: `session_state.rs:138-141`

**Current Mitigation**: Frontend always generates and sends messageId.

---

### 9. CWD Filtering in `sessions/updated` Broadcast

**Risk Level**: Low

**Description**: `broadcast_sessions_update()` filters by cwd when broadcasting.

**Problem**: Clients with different cwd open won't receive updates for other directories.

**Location**: `src-tauri/src/server/websocket.rs:286-300`

**Trade-off**: Filtering reduces noise but may cause sync issues for multi-project views.

**Suggested Alternative**: Broadcast without filter, let frontend filter.

---

### 10. `session_activated` Multiple Sends

**Risk Level**: Low

**Description**: `set_current_session` sends `session/activated` notification, called from multiple places.

**Problem**: May send redundant activation events.

**Location**: `src-tauri/src/core/app_state.rs` - `set_current_session`

**Mitigation**: Frontend should handle idempotently (ignore if already active).

---

### Summary Table

| Issue | Risk | Status | Fix Priority |
|-------|------|--------|--------------|
| 1. Dual notification channel | Medium | Mitigated | Low |
| 2. stop_session race | Low | Open | Low |
| 3. resume/fork no broadcast | Medium | **Needs Fix** | High |
| 4. cancel no status update | Medium | **Needs Fix** | High |
| 5. auto-resume no broadcast | Medium | **Needs Fix** | Medium |
| 6. Optimistic without rollback | Medium | Open | Medium |
| 7. Reconnect state loss | Medium | Open | Medium |
| 8. Message ID dedup | Low | Mitigated | Low |
| 9. CWD filtering | Low | Design Choice | Low |
| 10. Redundant activated | Low | Acceptable | Low |
