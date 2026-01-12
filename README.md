# Aero Code

A cross-platform AI code agent application built with Tauri + React that provides a visual interface for interacting with AI coding agents via the Agent Client Protocol (ACP).

## Features

- **ACP Integration** - Connect to Claude Code and other ACP-compatible agents
- **Chat Interface** - Real-time streaming responses with markdown support
- **Tool Visualization** - See what tools the agent is using (read, edit, search, execute)
- **Permission Control** - Approve or reject sensitive operations
- **Session Management** - Create and switch between multiple sessions
- **Cross-Platform** - Runs on macOS, Windows, and Linux

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **Backend**: Tauri 2.0, Rust
- **Protocol**: Agent Client Protocol (ACP) over JSON-RPC

## Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Bun](https://bun.sh/) (or npm/pnpm/yarn)
- [Node.js](https://nodejs.org/) 18+ (for npx)

## Getting Started

### Install Dependencies

```bash
bun install
```

### Development

```bash
bun run tauri dev
```

### Build for Production

```bash
bun run tauri build
```

## Project Structure

```
aero-code/
├── src/                    # React frontend
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── chat/          # Chat interface components
│   │   ├── layout/        # Layout components
│   │   └── common/        # Shared components
│   ├── stores/            # Zustand state management
│   ├── services/          # API and transport layer
│   ├── types/             # TypeScript type definitions
│   └── lib/               # Utility functions
├── src-tauri/             # Rust backend
│   └── src/
│       ├── acp/           # ACP protocol implementation
│       ├── core/          # Core business logic
│       └── commands/      # Tauri IPC commands
├── .agent/                # Project documentation
└── reference/             # Reference implementations (read-only)
```

## Usage

1. Click **Connect** to start the Claude Code ACP agent
2. Click **New Session** to create a chat session
3. Type your coding request in the input field
4. The agent will respond with streaming text and tool calls
5. Approve or reject permission requests as needed

## Configuration

The app connects to Claude Code via:
```
npx @anthropic-ai/claude-code-acp
```

Make sure you have a valid Anthropic API key configured for Claude Code.

## Development Roadmap

- [x] Phase 1: Core Infrastructure (MVP)
- [ ] Phase 2: File & Terminal Integration
- [ ] Phase 3: Session Management
- [ ] Phase 4: Web Server Mode
- [ ] Phase 5: Multi-Agent Support
- [ ] Phase 6: Advanced Features

## License

MIT
