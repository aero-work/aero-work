# Aero Code

A cross-platform GUI for AI coding agents.

![Screenshot](aerowork.png)

## Features

- Chat with AI coding agents (Claude Code, etc.)
- File browser with syntax highlighting
- Tool call visualization with permission control
- Session management (create, resume, fork)
- Multiple model providers with easy switching
- MCP server configuration
- Permission rules management
- Light/Dark theme
- Desktop + Web + PWA
- i18n support (English, Chinese)

## Quick Start

**Prerequisites:** [Bun](https://bun.sh/), [Rust](https://rustup.rs/), Claude Code (`npm i -g @anthropic-ai/claude-code`)

```bash
# Install
bun install

# Desktop app
bun run tauri dev

# Web app (run both commands)
cargo run --bin aero-server --manifest-path src-tauri/Cargo.toml
bun run dev
# Open http://localhost:5173
```

## Build

```bash
bun run tauri build   # Desktop
bun run build         # Web
```

## Model Providers

Configure in **Settings > Models**. Environment variables are passed to the agent process at startup.

| Provider | Configuration |
|----------|---------------|
| Default | Uses system environment variables |
| Anthropic | API Key / Auth Token, Base URL, Model selection |
| Amazon Bedrock | Bearer Token, Region, Model selection |
| BigModel / Zhipu | Auth Token |
| MiniMax | Auth Token, Model selection |
| Moonshot AI / Kimi | Auth Token, Model selection |
| Custom | Base URL + API Key / Auth Token |

Config stored in: `~/.config/aerowork/models.json`

## Configuration

All config files are stored in `~/.config/aerowork/`:

| File | Purpose |
|------|---------|
| `config.json` | General settings |
| `models.json` | Model provider configuration |
| `mcp.json` | MCP server configuration |

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand
- **Backend:** Tauri 2.0, Rust, Axum
- **Protocol:** Agent Client Protocol (ACP)

## License

MIT
