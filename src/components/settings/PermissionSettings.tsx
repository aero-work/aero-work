import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  RefreshCw,
  AlertCircle,
  Loader2,
  Pencil,
  Check,
  X,
  Info,
} from "lucide-react";
import * as fileService from "@/services/fileService";
import { useAgentStore } from "@/stores/agentStore";

// Permission rule types
type PermissionAction = "allow" | "deny" | "ask";

interface PermissionRule {
  toolPattern: string;
  pathPattern?: string;
  action: PermissionAction;
  enabled: boolean;
  description?: string;
}

interface PermissionConfig {
  rules: PermissionRule[];
}

// Config path
const PERMISSION_CONFIG_PATH = "~/.config/aerowork/permissions.json";

// Default rules including AskUserQuestion auto-allow
const DEFAULT_RULES: PermissionRule[] = [
  {
    toolPattern: "AskUserQuestion",
    action: "allow",
    enabled: true,
    description: "Auto-allow AskUserQuestion for interactive prompts",
  },
  {
    toolPattern: "Read|Glob|Grep",
    action: "allow",
    enabled: true,
    description: "Allow file reading operations",
  },
  {
    toolPattern: "Edit|Write",
    action: "ask",
    enabled: true,
    description: "Ask before modifying files",
  },
  {
    toolPattern: "Bash",
    action: "ask",
    enabled: true,
    description: "Ask before executing shell commands",
  },
];

const ACTION_CONFIG = {
  allow: { icon: ShieldCheck, labelKey: "permissionSettings.allow", className: "text-green-500" },
  deny: { icon: ShieldAlert, labelKey: "permissionSettings.deny", className: "text-red-500" },
  ask: { icon: ShieldQuestion, labelKey: "permissionSettings.ask", className: "text-yellow-500" },
};

export function PermissionSettings() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<PermissionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const connectionStatus = useAgentStore((state) => state.connectionStatus);
  const isConnected = connectionStatus === "connected";

  // Load config file
  const loadConfig = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fileService.readFile(PERMISSION_CONFIG_PATH);
      const parsed = JSON.parse(result.content) as PermissionConfig;
      setConfig(parsed);
    } catch (err) {
      // File doesn't exist, create with defaults
      if (
        String(err).includes("No such file") ||
        String(err).includes("not found") ||
        String(err).includes("does not exist")
      ) {
        try {
          const defaultConfig: PermissionConfig = { rules: DEFAULT_RULES };
          const content = JSON.stringify(defaultConfig, null, 2);
          await fileService.writeFile(PERMISSION_CONFIG_PATH, content);
          setConfig(defaultConfig);
          console.log("Created default permission config");
        } catch (writeErr) {
          setError(`Failed to create config: ${writeErr}`);
        }
      } else {
        setError(`Failed to load config: ${err}`);
      }
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Save config file
  const saveConfig = async (newConfig: PermissionConfig) => {
    setSaving(true);
    setError(null);

    try {
      const content = JSON.stringify(newConfig, null, 2);
      await fileService.writeFile(PERMISSION_CONFIG_PATH, content);
      setConfig(newConfig);
    } catch (err) {
      setError(`Failed to save config: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  // Toggle rule enabled state
  const handleToggleRule = (index: number) => {
    if (!config) return;

    const newRules = [...config.rules];
    newRules[index] = { ...newRules[index], enabled: !newRules[index].enabled };
    saveConfig({ rules: newRules });
  };

  // Add new rule
  const handleAddRule = (rule: PermissionRule) => {
    if (!config) return;

    const newConfig: PermissionConfig = {
      rules: [...config.rules, rule],
    };
    saveConfig(newConfig);
    setIsAdding(false);
  };

  // Update existing rule
  const handleUpdateRule = (index: number, rule: PermissionRule) => {
    if (!config) return;

    const newRules = [...config.rules];
    newRules[index] = rule;
    saveConfig({ rules: newRules });
    setEditingIndex(null);
  };

  // Delete rule
  const handleDeleteRule = (index: number) => {
    if (!config) return;
    if (!confirm("Delete this permission rule?")) return;

    const newRules = config.rules.filter((_, i) => i !== index);
    saveConfig({ rules: newRules });
  };

  // Move rule up/down for priority
  const handleMoveRule = (index: number, direction: "up" | "down") => {
    if (!config) return;

    const newRules = [...config.rules];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newRules.length) return;

    [newRules[index], newRules[newIndex]] = [newRules[newIndex], newRules[index]];
    saveConfig({ rules: newRules });
  };

  const rules = config?.rules || [];

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">{t("permissionSettings.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("permissionSettings.description")}
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {t("permissionSettings.connectToManage")}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">{t("permissionSettings.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("permissionSettings.description")}
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
          <h3 className="text-base sm:text-lg font-medium">{t("permissionSettings.title")}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("permissionSettings.shortDescription")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={loadConfig}
          disabled={loading}
          title={t("common.refresh")}
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

      {rules.length === 0 && !isAdding ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h4 className="font-medium mb-2">{t("permissionSettings.noRules")}</h4>
          <p className="text-sm text-muted-foreground mb-4">
            {t("permissionSettings.noRulesDescription")}
          </p>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("permissionSettings.addRule")}
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {rules.map((rule, index) => {
              const isEditing = editingIndex === index;

              if (isEditing) {
                return (
                  <RuleEditor
                    key={index}
                    rule={rule}
                    onSave={(newRule) => handleUpdateRule(index, newRule)}
                    onCancel={() => setEditingIndex(null)}
                    isNew={false}
                  />
                );
              }

              return (
                <RuleCard
                  key={index}
                  rule={rule}
                  index={index}
                  totalCount={rules.length}
                  onToggle={() => handleToggleRule(index)}
                  onEdit={() => setEditingIndex(index)}
                  onDelete={() => handleDeleteRule(index)}
                  onMoveUp={() => handleMoveRule(index, "up")}
                  onMoveDown={() => handleMoveRule(index, "down")}
                  saving={saving}
                />
              );
            })}
          </div>

          {isAdding ? (
            <RuleEditor
              rule={{ toolPattern: "", action: "ask", enabled: true }}
              onSave={handleAddRule}
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
              {t("permissionSettings.addRule")}
            </Button>
          )}
        </>
      )}

      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2.5 sm:p-4">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs min-w-0 overflow-hidden">
            <p className="font-medium text-blue-500 mb-1">{t("permissionSettings.rulePriority")}</p>
            <p className="text-muted-foreground">
              {t("permissionSettings.rulePriorityDescription")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rule Card Component
interface RuleCardProps {
  rule: PermissionRule;
  index: number;
  totalCount: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  saving: boolean;
}

function RuleCard({
  rule,
  index,
  onToggle,
  onEdit,
  onDelete,
  saving,
}: RuleCardProps) {
  const { t } = useTranslation();
  const ActionIcon = ACTION_CONFIG[rule.action].icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-2 sm:p-3 transition-opacity overflow-hidden",
        !rule.enabled && "opacity-60"
      )}
    >
      <div className="flex items-center gap-1.5">
        {/* Priority number */}
        <span className="text-xs text-muted-foreground w-4 text-center flex-shrink-0">
          {index + 1}
        </span>

        {/* Action icon */}
        <ActionIcon
          className={cn(
            "w-4 h-4 flex-shrink-0",
            ACTION_CONFIG[rule.action].className
          )}
        />

        {/* Tool pattern */}
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate flex-1 min-w-0">
          {rule.toolPattern}
        </code>

        {/* Action badge */}
        <span
          className={cn(
            "px-1.5 py-0.5 rounded text-[10px] uppercase font-medium flex-shrink-0",
            rule.action === "allow" && "bg-green-500/20 text-green-600",
            rule.action === "deny" && "bg-red-500/20 text-red-600",
            rule.action === "ask" && "bg-yellow-500/20 text-yellow-600"
          )}
        >
          {t(ACTION_CONFIG[rule.action].labelKey)}
        </span>

        {/* Actions */}
        <Switch
          checked={rule.enabled}
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

      {/* Description or path pattern */}
      {(rule.description || rule.pathPattern) && (
        <p className="mt-1 pl-9 text-[11px] text-muted-foreground break-words">
          {rule.description || `Path: ${rule.pathPattern}`}
        </p>
      )}
    </div>
  );
}

// Rule Editor Component
interface RuleEditorProps {
  rule: PermissionRule;
  onSave: (rule: PermissionRule) => void;
  onCancel: () => void;
  isNew: boolean;
}

function RuleEditor({ rule: initialRule, onSave, onCancel, isNew }: RuleEditorProps) {
  const { t } = useTranslation();
  const [toolPattern, setToolPattern] = useState(initialRule.toolPattern);
  const [pathPattern, setPathPattern] = useState(initialRule.pathPattern || "");
  const [action, setAction] = useState<PermissionAction>(initialRule.action);
  const [description, setDescription] = useState(initialRule.description || "");

  const handleSave = () => {
    if (!toolPattern.trim()) return;

    const newRule: PermissionRule = {
      toolPattern: toolPattern.trim(),
      action,
      enabled: initialRule.enabled,
    };

    if (pathPattern.trim()) {
      newRule.pathPattern = pathPattern.trim();
    }
    if (description.trim()) {
      newRule.description = description.trim();
    }

    onSave(newRule);
  };

  const isValid = toolPattern.trim().length > 0;

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-muted-foreground" />
        <span className="font-medium">
          {isNew ? t("permissionSettings.newRule") : t("permissionSettings.editRule")}
        </span>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tool-pattern">{t("permissionSettings.toolPattern")}</Label>
          <Input
            id="tool-pattern"
            placeholder="e.g., AskUserQuestion|Read|Glob"
            value={toolPattern}
            onChange={(e) => setToolPattern(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {t("permissionSettings.toolPatternHelp")}
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="path-pattern">{t("permissionSettings.pathPattern")}</Label>
          <Input
            id="path-pattern"
            placeholder="e.g., /home/user/.* or ./src/**"
            value={pathPattern}
            onChange={(e) => setPathPattern(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label>{t("permissionSettings.action")}</Label>
          <div className="flex gap-2">
            {(["allow", "deny", "ask"] as const).map((a) => {
              const ActionIcon = ACTION_CONFIG[a].icon;
              return (
                <button
                  key={a}
                  onClick={() => setAction(a)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    action === a
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <ActionIcon className="w-4 h-4" />
                  {t(ACTION_CONFIG[a].labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">{t("permissionSettings.descriptionLabel")}</Label>
          <Input
            id="description"
            placeholder="e.g., Auto-allow read operations"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          {t("common.cancel")}
        </Button>
        <Button onClick={handleSave} disabled={!isValid}>
          <Check className="w-4 h-4 mr-2" />
          {isNew ? t("common.add") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
