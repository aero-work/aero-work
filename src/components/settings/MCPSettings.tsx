import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Server,
  Terminal,
  Globe,
  AlertCircle,
  Loader2,
  RefreshCw,
  Pencil,
  Check,
  X,
} from "lucide-react";
import * as fileService from "@/services/fileService";
import { useAgentStore } from "@/stores/agentStore";

// MCP Server types
type MCPServerType = "stdio" | "http" | "sse";

interface StdioServerConfig {
  type: "stdio";
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface HttpServerConfig {
  type: "http" | "sse";
  url: string;
}

type MCPServerConfig = StdioServerConfig | HttpServerConfig;

// Aerowork config with enabled state
interface AeroworkMCPServer {
  enabled: boolean;
  config: MCPServerConfig;
}

interface AeroworkMCPConfig {
  mcpServers: {
    [name: string]: AeroworkMCPServer;
  };
}

// Claude config format (only enabled servers, no enabled field)
interface ClaudeMCPServers {
  [name: string]: MCPServerConfig;
}

interface ClaudeConfig {
  mcpServers?: ClaudeMCPServers;
  [key: string]: unknown;
}

// Config paths
const AEROWORK_CONFIG_PATH = "~/.config/aerowork/mcp.json";
const CLAUDE_CONFIG_PATH = "~/.claude.json";

export function MCPSettings() {
  const [aeroworkConfig, setAeroworkConfig] = useState<AeroworkMCPConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const connectionStatus = useAgentStore((state) => state.connectionStatus);
  const isConnected = connectionStatus === "connected";

  // Load aerowork config file, or bootstrap from claude.json if it doesn't exist
  const loadConfig = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fileService.readFile(AEROWORK_CONFIG_PATH);
      const parsed = JSON.parse(result.content) as AeroworkMCPConfig;
      setAeroworkConfig(parsed);
    } catch (err) {
      // File doesn't exist, try to bootstrap from claude.json
      if (String(err).includes("No such file") || String(err).includes("not found") || String(err).includes("does not exist")) {
        try {
          // Try to read existing claude.json and import servers
          const claudeResult = await fileService.readFile(CLAUDE_CONFIG_PATH);
          const claudeConfig = JSON.parse(claudeResult.content) as ClaudeConfig;

          // Convert claude config servers to aerowork format (all enabled)
          const aeroworkServers: { [name: string]: AeroworkMCPServer } = {};
          if (claudeConfig.mcpServers) {
            for (const [name, config] of Object.entries(claudeConfig.mcpServers)) {
              aeroworkServers[name] = {
                enabled: true,
                config: config,
              };
            }
          }

          const newConfig: AeroworkMCPConfig = { mcpServers: aeroworkServers };

          // Save the new aerowork config
          const content = JSON.stringify(newConfig, null, 2);
          await fileService.writeFile(AEROWORK_CONFIG_PATH, content);

          setAeroworkConfig(newConfig);
          console.log("Bootstrapped aerowork config from claude.json");
        } catch (claudeErr) {
          // Claude config also doesn't exist or failed, start with empty config
          const emptyConfig: AeroworkMCPConfig = { mcpServers: {} };
          const content = JSON.stringify(emptyConfig, null, 2);
          await fileService.writeFile(AEROWORK_CONFIG_PATH, content);
          setAeroworkConfig(emptyConfig);
          console.log("Created empty aerowork config");
        }
      } else {
        setError(`Failed to load config: ${err}`);
        console.error("Failed to load aerowork config:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Sync enabled servers to ~/.claude.json
  const syncToClaudeConfig = async (servers: { [name: string]: AeroworkMCPServer }) => {
    try {
      // Read existing claude config
      let claudeConfig: ClaudeConfig = {};
      try {
        const result = await fileService.readFile(CLAUDE_CONFIG_PATH);
        claudeConfig = JSON.parse(result.content) as ClaudeConfig;
      } catch {
        // File doesn't exist, start fresh
      }

      // Build enabled servers only
      const enabledServers: ClaudeMCPServers = {};
      for (const [name, server] of Object.entries(servers)) {
        if (server.enabled) {
          enabledServers[name] = server.config;
        }
      }

      // Update mcpServers field, preserve other fields
      claudeConfig.mcpServers = enabledServers;

      // Write back
      const content = JSON.stringify(claudeConfig, null, 2);
      await fileService.writeFile(CLAUDE_CONFIG_PATH, content);
    } catch (err) {
      console.error("Failed to sync to claude config:", err);
      throw err;
    }
  };

  // Save aerowork config and sync to claude config
  const saveConfig = async (newConfig: AeroworkMCPConfig) => {
    setSaving(true);
    setError(null);

    try {
      // Save aerowork config
      const content = JSON.stringify(newConfig, null, 2);
      await fileService.writeFile(AEROWORK_CONFIG_PATH, content);

      // Sync enabled servers to claude config
      await syncToClaudeConfig(newConfig.mcpServers);

      setAeroworkConfig(newConfig);
    } catch (err) {
      setError(`Failed to save config: ${err}`);
      console.error("Failed to save config:", err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle server enabled state
  const handleToggleServer = (name: string) => {
    if (!aeroworkConfig) return;

    const server = aeroworkConfig.mcpServers[name];
    if (!server) return;

    const newConfig: AeroworkMCPConfig = {
      ...aeroworkConfig,
      mcpServers: {
        ...aeroworkConfig.mcpServers,
        [name]: {
          ...server,
          enabled: !server.enabled,
        },
      },
    };

    saveConfig(newConfig);
  };

  // Add new server
  const handleAddServer = (name: string, serverConfig: MCPServerConfig) => {
    if (!aeroworkConfig) return;

    const newConfig: AeroworkMCPConfig = {
      ...aeroworkConfig,
      mcpServers: {
        ...aeroworkConfig.mcpServers,
        [name]: {
          enabled: true,
          config: serverConfig,
        },
      },
    };

    saveConfig(newConfig);
    setIsAdding(false);
  };

  // Update existing server
  const handleUpdateServer = (name: string, serverConfig: MCPServerConfig) => {
    if (!aeroworkConfig) return;

    const existingServer = aeroworkConfig.mcpServers[name];
    const newConfig: AeroworkMCPConfig = {
      ...aeroworkConfig,
      mcpServers: {
        ...aeroworkConfig.mcpServers,
        [name]: {
          enabled: existingServer?.enabled ?? true,
          config: serverConfig,
        },
      },
    };

    saveConfig(newConfig);
    setEditingServer(null);
  };

  // Delete server
  const handleDeleteServer = (name: string) => {
    if (!aeroworkConfig) return;

    // Confirm before deleting
    if (!confirm(`Delete MCP server "${name}"?`)) return;

    const { [name]: _, ...rest } = aeroworkConfig.mcpServers;
    const newConfig: AeroworkMCPConfig = {
      ...aeroworkConfig,
      mcpServers: rest,
    };

    saveConfig(newConfig);
  };

  const mcpServers = aeroworkConfig?.mcpServers || {};
  const serverNames = Object.keys(mcpServers);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">MCP Servers</h3>
          <p className="text-sm text-muted-foreground">
            Configure Model Context Protocol servers in ~/.claude.json
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Server className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Connect to the agent to manage MCP servers
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">MCP Servers</h3>
          <p className="text-sm text-muted-foreground">
            Configure Model Context Protocol servers in ~/.claude.json
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-medium">MCP Servers</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configure MCP servers
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={loadConfig}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {serverNames.length === 0 && !isAdding ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Server className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h4 className="font-medium mb-2">No MCP Servers Configured</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Add MCP servers to extend the agent with custom tools and resources.
          </p>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add MCP Server
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {serverNames.map((name) => {
              const server = mcpServers[name];
              const isEditing = editingServer === name;

              if (isEditing) {
                return (
                  <ServerEditor
                    key={name}
                    name={name}
                    server={server.config}
                    onSave={(_name, newConfig) => handleUpdateServer(name, newConfig)}
                    onCancel={() => setEditingServer(null)}
                    isNew={false}
                  />
                );
              }

              return (
                <ServerCard
                  key={name}
                  name={name}
                  server={server}
                  onToggle={() => handleToggleServer(name)}
                  onEdit={() => setEditingServer(name)}
                  onDelete={() => handleDeleteServer(name)}
                  saving={saving}
                />
              );
            })}
          </div>

          {isAdding ? (
            <ServerEditor
              name=""
              server={{ type: "stdio", command: "", args: [] }}
              onSave={(name, config) => handleAddServer(name, config)}
              onCancel={() => setIsAdding(false)}
              isNew={true}
            />
          ) : (
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Server
            </Button>
          )}
        </>
      )}

      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2.5 sm:p-4">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs min-w-0 overflow-hidden">
            <p className="font-medium text-blue-500 mb-1">Config Files</p>
            <p className="text-muted-foreground">
              Stored in <span className="font-mono">~/.config/aerowork/</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Server Card Component
interface ServerCardProps {
  name: string;
  server: AeroworkMCPServer;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  saving: boolean;
}

function ServerCard({ name, server, onToggle, onEdit, onDelete, saving }: ServerCardProps) {
  const config = server.config;
  const isStdio = config.type === "stdio";
  const Icon = isStdio ? Terminal : Globe;

  return (
    <div className={cn(
      "rounded-lg border p-2 sm:p-3 transition-opacity overflow-hidden",
      !server.enabled && "opacity-60"
    )}>
      <div className="flex items-center gap-1.5">
        {/* Icon */}
        <Icon className={cn(
          "w-4 h-4 flex-shrink-0",
          server.enabled ? "text-primary" : "text-muted-foreground"
        )} />

        {/* Name - takes remaining space */}
        <span className="font-medium text-sm truncate flex-1 min-w-0">{name}</span>

        {/* Type badge */}
        <span className="px-1 py-0.5 bg-muted rounded text-[10px] uppercase flex-shrink-0">
          {config.type}
        </span>

        {/* Actions */}
        <Switch
          checked={server.enabled}
          onCheckedChange={onToggle}
          disabled={saving}
          className="flex-shrink-0"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={onEdit}
          disabled={saving}
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          disabled={saving}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Command/URL details */}
      <p className="mt-1 pl-5 text-[11px] text-muted-foreground break-all">
        {isStdio
          ? `${(config as StdioServerConfig).command} ${(config as StdioServerConfig).args.join(" ")}`
          : (config as HttpServerConfig).url
        }
      </p>
    </div>
  );
}

// Server Editor Component
interface ServerEditorProps {
  name: string;
  server: MCPServerConfig;
  onSave: (name: string, config: MCPServerConfig) => void;
  onCancel: () => void;
  isNew: boolean;
}

function ServerEditor({ name: initialName, server: initialServer, onSave, onCancel, isNew }: ServerEditorProps) {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<MCPServerType>(initialServer.type);

  // Stdio fields
  const [command, setCommand] = useState(
    initialServer.type === "stdio" ? initialServer.command : ""
  );
  const [argsInput, setArgsInput] = useState(
    initialServer.type === "stdio" ? initialServer.args.join(" ") : ""
  );
  const [envInput, setEnvInput] = useState(() => {
    if (initialServer.type === "stdio" && initialServer.env) {
      return Object.entries(initialServer.env)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");
    }
    return "";
  });

  // HTTP/SSE fields
  const [url, setUrl] = useState(
    initialServer.type !== "stdio" ? initialServer.url : ""
  );

  const handleSave = () => {
    if (!name.trim()) return;

    let config: MCPServerConfig;

    if (type === "stdio") {
      if (!command.trim()) return;
      config = {
        type: "stdio",
        command: command.trim(),
        args: argsInput.split(/\s+/).filter(Boolean),
      };
      // Parse env
      if (envInput.trim()) {
        const env: Record<string, string> = {};
        envInput.split("\n").forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && trimmed.includes("=")) {
            const [key, ...valueParts] = trimmed.split("=");
            if (key) {
              env[key.trim()] = valueParts.join("=").trim();
            }
          }
        });
        if (Object.keys(env).length > 0) {
          config.env = env;
        }
      }
    } else {
      if (!url.trim()) return;
      config = {
        type,
        url: url.trim(),
      };
    }

    onSave(name.trim(), config);
  };

  const isValid =
    name.trim() &&
    (type === "stdio" ? command.trim() : url.trim());

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Server className="w-5 h-5 text-muted-foreground" />
        <span className="font-medium">
          {isNew ? "New MCP Server" : `Edit: ${initialName}`}
        </span>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="server-name">Server Name</Label>
          <Input
            id="server-name"
            placeholder="e.g., web-search"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isNew}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="server-type">Type</Label>
          <Select value={type} onValueChange={(v: string) => setType(v as MCPServerType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stdio">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span>stdio</span>
                </div>
              </SelectItem>
              <SelectItem value="http">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>http</span>
                </div>
              </SelectItem>
              <SelectItem value="sse">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>sse</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type === "stdio" ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="server-command">Command</Label>
              <Input
                id="server-command"
                placeholder="e.g., npx"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="server-args">Arguments (space-separated)</Label>
              <Input
                id="server-args"
                placeholder="e.g., -y @modelcontextprotocol/server-filesystem /path"
                value={argsInput}
                onChange={(e) => setArgsInput(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="server-env">Environment Variables (optional)</Label>
              <Textarea
                id="server-env"
                placeholder={"KEY=VALUE (one per line)\ne.g.,\nAPI_KEY=sk-...\nDEBUG=true"}
                value={envInput}
                onChange={(e) => setEnvInput(e.target.value)}
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          </>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="server-url">URL</Label>
            <Input
              id="server-url"
              placeholder="e.g., https://mcp.example.com/mcp/"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!isValid}>
          <Check className="w-4 h-4 mr-2" />
          {isNew ? "Add" : "Save"}
        </Button>
      </div>
    </div>
  );
}
