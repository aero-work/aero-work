import { useState } from "react";
import { useSettingsStore, type PermissionRule } from "@/stores/settingsStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Shield, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

const ACTION_CONFIG = {
  allow: { icon: ShieldCheck, label: "Allow", className: "text-green-500" },
  deny: { icon: ShieldAlert, label: "Deny", className: "text-red-500" },
  ask: { icon: ShieldQuestion, label: "Ask", className: "text-yellow-500" },
};

export function PermissionSettings() {
  const permissionRules = useSettingsStore((state) => state.permissionRules);
  const addPermissionRule = useSettingsStore((state) => state.addPermissionRule);
  const removePermissionRule = useSettingsStore((state) => state.removePermissionRule);
  const togglePermissionRule = useSettingsStore((state) => state.togglePermissionRule);

  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PermissionRule>>({
    name: "",
    toolPattern: "",
    pathPattern: "",
    action: "ask",
    enabled: true,
  });

  const handleAddRule = () => {
    if (newRule.name && newRule.toolPattern) {
      addPermissionRule({
        name: newRule.name,
        toolPattern: newRule.toolPattern,
        pathPattern: newRule.pathPattern || undefined,
        action: newRule.action as "allow" | "deny" | "ask",
        enabled: true,
      });
      setNewRule({ name: "", toolPattern: "", pathPattern: "", action: "ask", enabled: true });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Permission Rules</h3>
        <p className="text-sm text-muted-foreground">
          Configure automatic permission rules for tool calls.
        </p>
      </div>

      <div className="space-y-3">
        {permissionRules.map((rule) => {
          const ActionIcon = ACTION_CONFIG[rule.action].icon;
          return (
            <div
              key={rule.id}
              className={`rounded-lg border p-3 sm:p-4 ${
                !rule.enabled ? "opacity-50" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
                <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                  <ActionIcon
                    className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${ACTION_CONFIG[rule.action].className}`}
                  />
                  <div className="space-y-1 min-w-0 overflow-hidden">
                    <div className="font-medium text-sm sm:text-base truncate">{rule.name}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      <div className="truncate">
                        Tool: <code className="bg-muted px-1 rounded text-xs">{rule.toolPattern}</code>
                      </div>
                      {rule.pathPattern && (
                        <div className="truncate mt-0.5">
                          Path: <code className="bg-muted px-1 rounded text-xs">{rule.pathPattern}</code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 self-end sm:self-auto">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => togglePermissionRule(rule.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removePermissionRule(rule.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isAdding ? (
        <div className="rounded-lg border p-3 sm:p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <span className="font-medium text-sm sm:text-base">New Permission Rule</span>
          </div>

          <div className="grid gap-3 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rule-name" className="text-xs sm:text-sm">Rule Name</Label>
              <Input
                id="rule-name"
                placeholder="e.g., Allow file reads"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tool-pattern" className="text-xs sm:text-sm">Tool Pattern (regex)</Label>
              <Input
                id="tool-pattern"
                placeholder="e.g., Read|Glob"
                value={newRule.toolPattern}
                onChange={(e) => setNewRule({ ...newRule, toolPattern: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="path-pattern" className="text-xs sm:text-sm">Path Pattern (optional)</Label>
              <Input
                id="path-pattern"
                placeholder="e.g., /home/user/.*"
                value={newRule.pathPattern}
                onChange={(e) => setNewRule({ ...newRule, pathPattern: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs sm:text-sm">Action</Label>
              <div className="flex gap-1 sm:gap-2">
                {(["allow", "deny", "ask"] as const).map((action) => {
                  const ActionIcon = ACTION_CONFIG[action].icon;
                  return (
                    <button
                      key={action}
                      onClick={() => setNewRule({ ...newRule, action })}
                      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                        newRule.action === action
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <ActionIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{ACTION_CONFIG[action].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddRule} disabled={!newRule.name || !newRule.toolPattern}>
              Add
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full text-sm" onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Permission Rule
        </Button>
      )}

      <div className="rounded-lg bg-muted/50 p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          <strong>Note:</strong> Rules are evaluated in order. First match wins. Use regex patterns.
        </p>
      </div>
    </div>
  );
}
