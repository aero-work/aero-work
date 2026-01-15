# Mobile UI Redesign - WeChat/WhatsApp Style

## Overview

Redesign the mobile UI to adopt a WeChat/WhatsApp-style chat interface with:
- Bottom tab navigation (4 tabs: Chat, Files, Terminal, Settings)
- Session list view as the main Chat tab content
- Slide-in conversation detail view
- Keyboard-aware input area that compresses the view

## Design Goals

1. **Familiar UX**: Mimic WeChat/WhatsApp navigation patterns
2. **Efficient Navigation**: Quick access to sessions, files, terminal, settings
3. **Smooth Transitions**: Slide animations between views
4. **Keyboard Handling**: Proper input area behavior when keyboard opens

---

## UI Layout

### Main Layout Structure

```
┌────────────────────────────────────┐
│           Header Area              │  <- Context-dependent header
├────────────────────────────────────┤
│                                    │
│                                    │
│         Content Area               │  <- Tab content or conversation
│                                    │
│                                    │
├────────────────────────────────────┤
│  [Chat] [Files] [Terminal] [⚙️]   │  <- Bottom tab bar (hidden in conversation)
└────────────────────────────────────┘
```

### View States

#### State 1: Chat Tab - Session List (Main)

```
┌────────────────────────────────────┐
│  Aero Work            [Connect] ⚡  │  <- Header with status
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │  [+] New Conversation        │  │  <- Prominent new chat button
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 📁 ~/project                 │  │  <- Session card
│  │ Last message preview...       │  │
│  │                    10:30 AM   │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 📁 ~/another-project         │  │
│  │ Implementing feature X...     │  │
│  │                    Yesterday  │  │
│  └──────────────────────────────┘  │
│                                    │
│  ...more sessions...               │
│                                    │
├────────────────────────────────────┤
│  [💬*] [📁]  [>_]  [⚙️]           │  <- Tab bar, Chat tab active
└────────────────────────────────────┘
```

#### State 2: Conversation View (Slide-in from right)

```
┌────────────────────────────────────┐
│  [←]  ~/project        [···]       │  <- Back button + project name + menu
├────────────────────────────────────┤
│                                    │
│  ┌────────────────────────────┐    │
│  │ User message               │    │  <- Messages
│  └────────────────────────────┘    │
│                                    │
│       ┌────────────────────────┐   │
│       │ Agent response         │   │
│       │ with tool calls...     │   │
│       └────────────────────────┘   │
│                                    │
│                                    │
├────────────────────────────────────┤
│  [📎]  Type a message...    [>]   │  <- Input area (always visible)
└────────────────────────────────────┘
   ↑ NO TAB BAR in conversation view
```

#### State 3: Files Tab

```
┌────────────────────────────────────┐
│  Files               [Select] 📂   │  <- Header with project selector
├────────────────────────────────────┤
│  📁 src/                           │
│    📄 index.ts                     │
│    📄 App.tsx                      │
│  📁 components/                    │
│    📁 chat/                        │
│    📁 ui/                          │
│  📄 package.json                   │
│  📄 README.md                      │
│                                    │
│                        [⬆️ Upload] │  <- Floating upload button
├────────────────────────────────────┤
│  [💬]  [📁*] [>_]  [⚙️]           │  <- Tab bar
└────────────────────────────────────┘
```

#### State 4: Terminal Tab

```
┌────────────────────────────────────┐
│  Terminal            [Tab1] [+]    │  <- Terminal tabs
├────────────────────────────────────┤
│  $ npm run dev                     │
│  > vite                            │
│                                    │
│  VITE v5.0.0  ready in 292 ms      │
│                                    │
│    ➜  Local:   http://localhost:   │
│                                    │
│  $                                 │
│                                    │
├────────────────────────────────────┤
│  [💬]  [📁]  [>_*] [⚙️]           │  <- Tab bar
└────────────────────────────────────┘
```

#### State 5: Settings Tab

```
┌────────────────────────────────────┐
│  Settings                          │
├────────────────────────────────────┤
│  General                      >    │
│  ──────────────────────────────    │
│  Agents                       >    │
│  ──────────────────────────────    │
│  Models                       >    │
│  ──────────────────────────────    │
│  MCP Servers                  >    │
│  ──────────────────────────────    │
│  Plugins                      >    │
│  ──────────────────────────────    │
│  Permissions                  >    │
│                                    │
├────────────────────────────────────┤
│  [💬]  [📁]  [>_]  [⚙️*]          │  <- Tab bar
└────────────────────────────────────┘
```

---

## Navigation Flow

```
                    ┌─────────────────┐
                    │   Tab Bar       │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Session List │    │    Files      │    │   Terminal    │
│  (Chat Tab)   │    │    Tab        │    │     Tab       │
└───────┬───────┘    └───────┬───────┘    └───────────────┘
        │                    │
        │ Tap session        │ Tap file
        ▼                    ▼
┌───────────────┐    ┌───────────────┐
│ Conversation  │    │  File Viewer  │
│ View (slide)  │    │  (slide)      │
│               │    │               │
│ ← Back button │    │ ← Back button │
│ No tab bar    │    │ No tab bar    │
└───────────────┘    └───────────────┘
```

---

## Interaction Details

### Session List Interactions

1. **Tap session card** → Slide to conversation view
2. **Tap [+] New Conversation** → Create session, slide to conversation
3. **Long press session** → Show context menu (Resume, Fork, Delete)
4. **Swipe left on session** → Quick delete option

### Conversation View Interactions

1. **Tap [←] back button** → Slide back to session list
2. **Swipe from left edge** → Gesture to go back (iOS-style)
3. **Tap [···] menu** → Show options (Fork, Change Mode, etc.)
4. **Keyboard opens** → Input area stays at bottom, messages scroll up
5. **Keyboard closes** → Layout returns to normal

### Keyboard Handling

When keyboard opens:
```
┌────────────────────────────────────┐
│  [←]  ~/project        [···]       │  <- Header (compressed)
├────────────────────────────────────┤
│  Messages scroll up                │
│  to make room for keyboard         │
│                                    │
├────────────────────────────────────┤
│  [📎]  Type a message...    [>]   │  <- Input stays above keyboard
├────────────────────────────────────┤
│                                    │
│         Software Keyboard          │  <- Keyboard pushes content up
│                                    │
└────────────────────────────────────┘
```

CSS approach:
```css
/* Use viewport units that account for keyboard */
.mobile-layout {
  height: 100dvh; /* Dynamic viewport height */
}

/* Or use visualViewport API for precise control */
```

---

## State Management Changes

### Updated MobileNavStore

```typescript
export type MobileView =
  | "session-list"      // Chat tab - session list
  | "conversation"      // Inside a conversation
  | "files"             // Files tab
  | "file-viewer"       // Viewing a file
  | "terminal"          // Terminal tab
  | "settings";         // Settings tab

interface MobileNavState {
  currentView: MobileView;
  previousView: MobileView | null;

  // For conversation view
  isInConversation: boolean;

  // For file viewer
  viewingFilePath: string | null;

  // Sidebar (project selector)
  isSidebarOpen: boolean;

  // Tab bar visibility
  showTabBar: boolean;

  // Navigation actions
  setView: (view: MobileView) => void;
  enterConversation: () => void;
  exitConversation: () => void;
  goBack: () => void;
  openFileViewer: (filePath: string) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}
```

### Navigation Rules

| Current View | Tab Bar | Back Button | Header |
|--------------|---------|-------------|--------|
| session-list | ✅ Show | ❌ Hidden | App title + Connect |
| conversation | ❌ Hidden | ✅ Show | Project name + Menu |
| files | ✅ Show | ❌ Hidden | "Files" + Project selector |
| file-viewer | ❌ Hidden | ✅ Show | File name |
| terminal | ✅ Show | ❌ Hidden | "Terminal" + Tabs |
| settings | ✅ Show | ❌ Hidden | "Settings" |

---

## Component Structure

### New Components

```
src/components/layout/
├── MobileLayout.tsx          # Main container (updated)
├── MobileTabBar.tsx          # Bottom tab bar (rename from MobileNavBar)
├── MobileSessionList.tsx     # NEW: Session list view
├── MobileConversation.tsx    # NEW: Conversation wrapper with animations
├── MobileHeader.tsx          # Updated: Context-aware header
└── MobileSidebar.tsx         # Keep: Project selector sidebar

src/components/chat/
├── SessionCard.tsx           # NEW: Session preview card
└── ... (existing)
```

### Component Hierarchy

```
MobileLayout
├── MobileHeader (dynamic based on view)
├── Content Area (animated transitions)
│   ├── MobileSessionList (when view = session-list)
│   │   └── SessionCard (multiple)
│   ├── MobileConversation (when view = conversation)
│   │   ├── MessageList
│   │   └── ChatInput
│   ├── MobileFilesView (when view = files)
│   ├── MobileFileViewer (when view = file-viewer)
│   ├── MobileTerminalView (when view = terminal)
│   └── SettingsPage (when view = settings)
├── MobileTabBar (hidden in conversation/file-viewer)
├── MobileSidebar (overlay)
└── PermissionDialog (overlay)
```

---

## Animation Details

### Slide Transition (Conversation Entry)

```css
/* Session list slides out to left */
.session-list-exit {
  animation: slideOutLeft 0.3s ease-out;
}

/* Conversation slides in from right */
.conversation-enter {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideOutLeft {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-30%); opacity: 0.5; }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

### Gesture-based Back Navigation

```typescript
// Use touch events to detect edge swipe
const handleTouchStart = (e: TouchEvent) => {
  if (e.touches[0].clientX < 20) {
    // Start tracking swipe from left edge
    startSwipeBack();
  }
};
```

---

## Implementation Steps

### Phase 1: State Management
1. Update `mobileNavStore.ts` with new view states
2. Add `isInConversation` and `showTabBar` computed state
3. Add `enterConversation()` and `exitConversation()` actions

### Phase 2: Session List View
1. Create `MobileSessionList.tsx` component
2. Create `SessionCard.tsx` for session preview
3. Add "New Conversation" button at top
4. Implement tap to enter conversation

### Phase 3: Tab Bar Updates
1. Rename to `MobileTabBar.tsx`
2. Update tab items: Chat (session list), Files, Terminal, Settings
3. Add conditional visibility based on `showTabBar`

### Phase 4: Conversation View
1. Create `MobileConversation.tsx` wrapper
2. Move existing ChatView content inside
3. Add back button header
4. Remove input from session list, keep only in conversation

### Phase 5: Header Updates
1. Update `MobileHeader.tsx` for context awareness
2. Different headers for each view state
3. Add back button for conversation/file-viewer

### Phase 6: Animations & Gestures
1. Add slide transitions between views
2. Implement swipe-back gesture
3. Add smooth keyboard handling

### Phase 7: Keyboard Handling
1. Use `100dvh` for viewport height
2. Implement visualViewport API if needed
3. Test on various mobile devices

---

## Testing Checklist

- [ ] Session list displays all sessions correctly
- [ ] Tapping session enters conversation with slide animation
- [ ] Back button/swipe returns to session list
- [ ] Tab bar hidden in conversation view
- [ ] Tab bar shown in all other views
- [ ] Keyboard opens without layout issues
- [ ] Messages scroll when keyboard opens
- [ ] New conversation button works
- [ ] Files tab navigation works
- [ ] Terminal tab works
- [ ] Settings tab accessible
- [ ] Project selector works from header

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/stores/mobileNavStore.ts` | New view states, navigation actions |
| `src/components/layout/MobileLayout.tsx` | New structure, animations |
| `src/components/layout/MobileNavBar.tsx` | Rename, update tabs, conditional visibility |
| `src/components/layout/MobileHeader.tsx` | Context-aware header |
| `src/components/chat/ChatView.tsx` | Extract conversation logic |
| `.agent/product.md` | Update mobile layout section |
| `.agent/structure.md` | Update component structure |

## New Files to Create

| File | Purpose |
|------|---------|
| `src/components/layout/MobileSessionList.tsx` | Session list view |
| `src/components/layout/MobileConversation.tsx` | Conversation wrapper |
| `src/components/chat/SessionCard.tsx` | Session preview card |
