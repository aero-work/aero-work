import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAgentStore } from "@/stores/agentStore";
import { agentAPI } from "@/services/api";
import type { PermissionOptionKind } from "@/types/acp";
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";

const kindConfig: Record<
  PermissionOptionKind,
  {
    icon: React.ComponentType<{ className?: string }>;
    variant: "default" | "destructive" | "outline" | "secondary";
  }
> = {
  allow_once: { icon: ShieldCheck, variant: "default" },
  allow_always: { icon: Shield, variant: "secondary" },
  reject_once: { icon: ShieldX, variant: "outline" },
  reject_always: { icon: ShieldAlert, variant: "destructive" },
};

export function PermissionDialog() {
  const pendingPermission = useAgentStore((state) => state.pendingPermission);

  console.log("PermissionDialog render, pendingPermission:", pendingPermission);

  const handleOption = useCallback(
    (optionId: string) => {
      agentAPI.resolvePermission({ outcome: "selected", optionId });
    },
    []
  );

  const handleCancel = useCallback(() => {
    agentAPI.resolvePermission({ outcome: "cancelled" });
  }, []);

  if (!pendingPermission) return null;

  const { toolCall, options } = pendingPermission;

  return (
    <Dialog open={!!pendingPermission} onOpenChange={() => handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-500" />
            Permission Required
          </DialogTitle>
          <DialogDescription>
            The agent wants to perform the following action:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="font-medium text-sm">{String(toolCall.title ?? "Unknown action")}</p>
            {toolCall.rawInput != null && (
              <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32">
                {String(JSON.stringify(toolCall.rawInput, null, 2))}
              </pre>
            )}
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:gap-2">
          {options.map((option) => {
            const { icon: Icon, variant } = kindConfig[option.kind];
            return (
              <Button
                key={option.optionId}
                variant={variant}
                onClick={() => handleOption(option.optionId)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {option.name}
              </Button>
            );
          })}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
