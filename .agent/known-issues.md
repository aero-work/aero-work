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
