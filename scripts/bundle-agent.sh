#!/bin/bash
# Bundle claude-code-acp and claude-code CLI with shared Bun runtime
# This reduces total size by sharing a single Bun runtime (~50MB savings)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RESOURCES_DIR="$PROJECT_DIR/src-tauri/resources"
TEMP_DIR="$PROJECT_DIR/temp/agent-bundle"

echo "🚀 Bundling Claude Code agent (shared runtime)..."

# Clean up
rm -rf "$TEMP_DIR"
rm -f "$RESOURCES_DIR/bun-runtime" "$RESOURCES_DIR/claude-code-agent" "$RESOURCES_DIR/claude-code-cli" 2>/dev/null || true
rm -f "$RESOURCES_DIR/claude-code-agent.js" "$RESOURCES_DIR/claude-code-cli.js" 2>/dev/null || true
mkdir -p "$TEMP_DIR"
mkdir -p "$RESOURCES_DIR"

# ============================================
# Step 1: Copy Bun runtime
# ============================================
echo ""
echo "📦 Step 1: Copying Bun runtime..."

# Find bun executable
BUN_PATH=$(which bun)
if [ -z "$BUN_PATH" ]; then
    echo "❌ Bun not found. Please install Bun first."
    exit 1
fi

# Copy bun binary (use cat to avoid extended attribute copy issues on macOS)
cat "$BUN_PATH" > "$RESOURCES_DIR/bun-runtime"
chmod +x "$RESOURCES_DIR/bun-runtime"

# On macOS: Remove original code signature and re-sign with adhoc signature
# This is necessary because macOS doesn't allow signed binaries inside adhoc-signed app bundles
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   Re-signing bun runtime with adhoc signature..."
    codesign --remove-signature "$RESOURCES_DIR/bun-runtime" 2>/dev/null || true
    codesign -s - "$RESOURCES_DIR/bun-runtime"
fi

echo "✅ Bun runtime copied: $(du -h "$RESOURCES_DIR/bun-runtime" | cut -f1)"

# ============================================
# Step 2: Bundle Claude Code CLI as JS
# ============================================
echo ""
echo "📦 Step 2: Bundling Claude Code CLI (JS bundle)..."
cd "$TEMP_DIR"
mkdir -p cli
cd cli

cat > package.json << 'EOF'
{
  "name": "claude-code-cli-bundle",
  "type": "module",
  "dependencies": {
    "@anthropic-ai/claude-code": "latest"
  }
}
EOF

bun install

# Create entry point for Claude Code CLI
cat > entry.ts << 'EOF'
#!/usr/bin/env bun
// Entry point for bundled Claude Code CLI
import "@anthropic-ai/claude-code/cli.js";
EOF

echo "🔨 Building Claude Code CLI JS bundle..."
bun build ./entry.ts --outfile "$RESOURCES_DIR/claude-code-cli.js" --target=bun --minify

echo "✅ Claude Code CLI bundled: $(du -h "$RESOURCES_DIR/claude-code-cli.js" | cut -f1)"

# ============================================
# Step 3: Bundle ACP Adapter as JS
# ============================================
echo ""
echo "📦 Step 3: Bundling ACP Adapter (JS bundle)..."
cd "$TEMP_DIR"
mkdir -p acp
cd acp

cat > package.json << 'EOF'
{
  "name": "claude-code-acp-bundle",
  "type": "module",
  "dependencies": {
    "@zed-industries/claude-code-acp": "latest"
  }
}
EOF

bun install

# Create entry point that properly runs claude-code-acp CLI
cat > entry.ts << 'EOF'
#!/usr/bin/env bun
import { loadManagedSettings, applyEnvironmentSettings } from "@zed-industries/claude-code-acp/dist/utils.js";
import { runAcp } from "@zed-industries/claude-code-acp/dist/acp-agent.js";

// Load managed settings and apply environment variables
const managedSettings = loadManagedSettings();
if (managedSettings) {
    applyEnvironmentSettings(managedSettings);
}

// stdout is used to send messages to the client
// redirect everything else to stderr to make sure it doesn't interfere with ACP
console.log = console.error;
console.info = console.error;
console.warn = console.error;
console.debug = console.error;

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

runAcp();

// Keep process alive
process.stdin.resume();
EOF

echo "🔨 Building ACP Adapter JS bundle..."
bun build ./entry.ts --outfile "$RESOURCES_DIR/claude-code-agent.js" --target=bun --minify

echo "✅ ACP Adapter bundled: $(du -h "$RESOURCES_DIR/claude-code-agent.js" | cut -f1)"

# ============================================
# Step 4: Create wrapper script for Claude CLI
# ============================================
echo ""
echo "📦 Step 4: Creating Claude CLI wrapper script..."

# Create a wrapper script that the SDK can execute as a single file
cat > "$RESOURCES_DIR/claude-code-cli" << 'EOF'
#!/bin/bash
# Wrapper script for bundled Claude Code CLI
# This allows CLAUDE_CODE_EXECUTABLE to point to a single executable file
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/bun-runtime" "$SCRIPT_DIR/claude-code-cli.js" "$@"
EOF

chmod +x "$RESOURCES_DIR/claude-code-cli"
echo "✅ Claude CLI wrapper created"

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "✅ All components bundled successfully!"
echo "   bun-runtime:          $(du -h "$RESOURCES_DIR/bun-runtime" | cut -f1)"
echo "   claude-code-cli.js:   $(du -h "$RESOURCES_DIR/claude-code-cli.js" | cut -f1)"
echo "   claude-code-agent.js: $(du -h "$RESOURCES_DIR/claude-code-agent.js" | cut -f1)"
echo "   Total:                $(du -ch "$RESOURCES_DIR/bun-runtime" "$RESOURCES_DIR/claude-code-cli.js" "$RESOURCES_DIR/claude-code-agent.js" | tail -1 | cut -f1)"
