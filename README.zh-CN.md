# Aero Code

AI 编程助手的跨平台图形界面。

![截图](aerowork.png)

## 功能

- 与 AI 编程助手对话 (Claude Code 等)
- 文件浏览器 + 语法高亮
- 工具调用可视化 + 权限控制
- 会话管理 (创建、恢复、分支)
- 多模型提供商，一键切换
- MCP 服务器配置
- 权限规则管理
- 亮色/暗色主题
- 桌面端 + 网页端 + PWA
- 多语言支持 (中文、英文)

## 快速开始

**前置条件:** [Bun](https://bun.sh/), [Rust](https://rustup.rs/), Claude Code (`npm i -g @anthropic-ai/claude-code`)

```bash
# 安装依赖
bun install

# 运行桌面端
bun run tauri dev

# 运行网页端 (需要同时运行两个命令)
cargo run --bin aero-server --manifest-path src-tauri/Cargo.toml
bun run dev
# 打开 http://localhost:5173
```

## 构建

```bash
bun run tauri build   # 桌面端
bun run build         # 网页端
```

## 模型提供商

在 **设置 > 模型** 中配置。环境变量会在 Agent 启动时传递给子进程。

| 提供商 | 配置项 |
|--------|--------|
| Default | 使用系统环境变量 |
| Anthropic | API Key / Auth Token, Base URL, 模型选择 |
| Amazon Bedrock | Bearer Token, 区域, 模型选择 |
| BigModel / 智谱 | Auth Token |
| MiniMax | Auth Token, 模型选择 |
| Moonshot AI / Kimi | Auth Token, 模型选择 |
| 自定义 | Base URL + API Key / Auth Token |

配置文件位置: `~/.config/aerowork/models.json`

## 配置文件

所有配置存储在 `~/.config/aerowork/`:

| 文件 | 用途 |
|------|------|
| `config.json` | 通用设置 |
| `models.json` | 模型提供商配置 |
| `mcp.json` | MCP 服务器配置 |

## 技术栈

- **前端:** React 18, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand
- **后端:** Tauri 2.0, Rust, Axum
- **协议:** Agent Client Protocol (ACP)

## 许可证

MIT
