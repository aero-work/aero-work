# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aero Code** is a cross-platform AI code agent application built with Tauri (Rust backend) + React (TypeScript frontend). It provides a visual interface for interacting with AI coding agents like Claude Code via the Agent Client Protocol (ACP).

### Current Status (Phase 1 MVP - Completed)

- ✅ Project setup (Tauri 2.0 + Vite + React + TypeScript + Tailwind + shadcn/ui)
- ✅ ACP client implementation in Rust (JSON-RPC over stdio)
- ✅ Basic Tauri IPC commands (connect, initialize, session, prompt, permission)
- ✅ Transport abstraction layer (TauriTransport implemented)
- ✅ VSCode-like UI with resizable sidebar
- ✅ Chat interface with streaming messages
- ✅ Tool Call Cards with expand/collapse
- ✅ Permission dialog for tool authorization
- ✅ Project/directory management with persistence
- ✅ Session management (create, switch, delete)

### Key Architecture Decisions

- **Unified Rust Backend**: Single Tauri backend serves both desktop (IPC) and web (WebSocket) modes
- **Dual Transport Layer**: Frontend abstracts transport - `TauriTransport` for desktop, `WebSocketTransport` for web browsers (planned)
- **ACP Protocol**: Uses Agent Client Protocol for standardized agent communication (JSON-RPC over stdio)
- **Agent**: Uses `npx @zed-industries/claude-code-acp` to spawn Claude Code agent

## Project Structure

```
aero-code/
├── .agent/              # Project documentation - READ THESE FIRST
├── reference/           # Reference implementations (read-only)
│   ├── agent-client-protocol/  # ACP specification and Rust SDK
│   └── claude-code-acp/        # Claude Code ACP adapter
├── src-tauri/           # Rust backend (Tauri)
│   └── src/
│       ├── lib.rs       # Tauri app setup and command registration
│       ├── acp/         # ACP protocol implementation
│       │   ├── client.rs   # JSON-RPC client over stdio
│       │   └── types.rs    # Protocol types
│       ├── core/        # Business logic
│       │   ├── agent.rs    # AgentManager
│       │   └── state.rs    # AppState
│       └── commands/    # Tauri IPC commands
│           ├── agent.rs    # connect, disconnect, initialize, respond_permission
│           └── session.rs  # create_session, send_prompt, cancel, set_mode
└── src/                 # React frontend
    ├── components/
    │   ├── layout/      # MainLayout, Header, Sidebar, StatusBar
    │   ├── chat/        # ChatView, MessageList, ChatInput, ToolCallCard
    │   ├── common/      # PermissionDialog, ProjectSelector
    │   └── ui/          # shadcn/ui components
    ├── stores/          # Zustand state management
    │   ├── sessionStore.ts  # Sessions, messages, tool calls
    │   ├── agentStore.ts    # Connection status, agent info
    │   └── fileStore.ts     # Working directory, recent projects
    ├── services/        # Backend communication
    │   ├── transport/   # TauriTransport
    │   └── api.ts       # AgentAPI class
    └── types/
        └── acp.ts       # TypeScript ACP types
```

## Running the App

```bash
# Install dependencies
bun install

# Development mode
bun run tauri dev

# Production build
bun run tauri build
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `src-tauri/src/acp/client.rs` | ACP JSON-RPC client, message parsing, permission response |
| `src-tauri/src/acp/types.rs` | All Rust ACP types (must match TypeScript types) |
| `src/types/acp.ts` | TypeScript ACP types (must match Rust types) |
| `src/services/api.ts` | Frontend API for agent communication |
| `src/stores/sessionStore.ts` | Session and message state management |
| `src/components/layout/Sidebar.tsx` | Main navigation sidebar |

## Reference Materials

The `reference/` directory contains external implementations for understanding ACP:

- `reference/agent-client-protocol/` - ACP specification, schema, Rust SDK
- `reference/claude-code-acp/` - Working TypeScript implementation

These are reference-only. Do not modify files in `reference/`.

## Important Context

Before making changes, read the documentation in `.agent/`:
- `.agent/product.md` - Product requirements, UI/UX design, development phases
- `.agent/structure.md` - Directory structure, naming conventions, code patterns
- `.agent/tech.md` - Technology stack, architecture diagrams
