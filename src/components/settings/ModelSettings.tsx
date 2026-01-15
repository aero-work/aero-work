import { useState, useCallback } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import { useAgentStore } from "@/stores/agentStore";
import { useSessionData } from "@/hooks/useSessionData";
import { getTransport } from "@/services/transport";
import type { WebSocketTransport } from "@/services/transport/websocket";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, Star, Cpu, AlertCircle, Loader2, Info } from "lucide-react";

export function ModelSettings() {
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const connectionStatus = useAgentStore((state) => state.connectionStatus);
  const isConnected = connectionStatus === "connected";

  const { state: sessionState } = useSessionData(activeSessionId);
  const models = sessionState?.models;

  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSwitchModel = useCallback(async (modelId: string) => {
    if (!activeSessionId || !models) return;

    setSwitchingTo(modelId);
    setError(null);

    try {
      const transport = getTransport() as WebSocketTransport;
      await transport.send("set_session_model", {
        sessionId: activeSessionId,
        modelId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch model");
    } finally {
      setSwitchingTo(null);
    }
  }, [activeSessionId, models]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Model Configuration</h3>
        <p className="text-sm text-muted-foreground">
          View and switch AI models for the current session.
        </p>
      </div>

      {!isConnected ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Cpu className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h4 className="font-medium mb-2">Not Connected</h4>
          <p className="text-sm text-muted-foreground">
            Connect to the agent to view available models.
          </p>
        </div>
      ) : !activeSessionId ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Cpu className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h4 className="font-medium mb-2">No Active Session</h4>
          <p className="text-sm text-muted-foreground">
            Create or select a session to view available models.
          </p>
        </div>
      ) : !models ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Loader2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4 animate-spin" />
          <h4 className="font-medium mb-2">Loading Models</h4>
          <p className="text-sm text-muted-foreground">
            Fetching available models from the agent...
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm text-destructive">{error}</div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {models.availableModels.map((model) => {
              const isCurrent = model.modelId === models.currentModelId;
              const isSwitching = switchingTo === model.modelId;

              return (
                <div
                  key={model.modelId}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between rounded-lg border p-3 sm:p-4 ${
                    isCurrent ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                    {isCurrent && (
                      <Star className="w-4 h-4 text-primary fill-primary flex-shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <Label className="text-sm sm:text-base font-medium">{model.name}</Label>
                      {model.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {model.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {model.modelId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                    {isCurrent ? (
                      <span className="text-xs sm:text-sm text-primary font-medium">Current</span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitchModel(model.modelId)}
                        disabled={isSwitching || switchingTo !== null}
                        className="text-xs sm:text-sm"
                      >
                        {isSwitching ? (
                          <>
                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                            <span className="hidden sm:inline">Switching...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Use This Model</span>
                            <span className="sm:hidden">Use</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-medium text-blue-500 mb-1">About Model Selection</p>
            <p className="text-muted-foreground">
              Available models depend on your agent config and API keys.
              Switching only affects the current session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
