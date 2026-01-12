import { getTransport } from "./transport";
import { useSessionStore } from "@/stores/sessionStore";
import { useAgentStore } from "@/stores/agentStore";
import type {
  SessionId,
  PermissionRequest,
  PermissionOutcome,
  SessionUpdate,
} from "@/types/acp";

class AgentAPI {
  private permissionResolver: ((outcome: PermissionOutcome) => void) | null =
    null;

  async connect(): Promise<void> {
    const transport = getTransport();
    const agentStore = useAgentStore.getState();

    agentStore.setConnectionStatus("connecting");

    try {
      await transport.connect();
      const initResponse = await transport.initialize();

      if (initResponse.agentInfo) {
        agentStore.setAgentInfo(initResponse.agentInfo);
      }
      if (initResponse.agentCapabilities) {
        agentStore.setAgentCapabilities(initResponse.agentCapabilities);
      }
      if (initResponse.authMethods) {
        agentStore.setAuthMethods(initResponse.authMethods);
      }

      agentStore.setConnectionStatus("connected");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect";
      agentStore.setError(message);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    const transport = getTransport();
    const agentStore = useAgentStore.getState();

    try {
      await transport.disconnect();
    } finally {
      agentStore.reset();
    }
  }

  async createSession(cwd?: string): Promise<SessionId> {
    const transport = getTransport();
    const sessionStore = useSessionStore.getState();

    const workingDir = cwd || "/";
    const response = await transport.createSession(workingDir);

    sessionStore.createSession(response.sessionId);
    sessionStore.setActiveSession(response.sessionId);

    if (response.modes) {
      sessionStore.setModes(response.sessionId, response.modes);
    }
    if (response.models) {
      sessionStore.setModels(response.sessionId, response.models);
    }

    return response.sessionId;
  }

  async sendMessage(sessionId: SessionId, content: string): Promise<void> {
    const transport = getTransport();
    const sessionStore = useSessionStore.getState();
    const agentStore = useAgentStore.getState();

    sessionStore.addMessage(sessionId, {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    });

    sessionStore.setLoading(true);

    try {
      const handleUpdate = (update: SessionUpdate) => {
        sessionStore.handleSessionUpdate(sessionId, update);
      };

      const handlePermissionRequest = async (
        request: PermissionRequest
      ): Promise<PermissionOutcome> => {
        console.log("handlePermissionRequest called with:", request);
        agentStore.setPendingPermission(request);
        console.log("Set pending permission in store, waiting for resolution...");

        return new Promise((resolve) => {
          this.permissionResolver = resolve;
        });
      };

      await transport.prompt(
        sessionId,
        content,
        handleUpdate,
        handlePermissionRequest
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message";
      sessionStore.setError(message);
      throw error;
    } finally {
      sessionStore.setLoading(false);
    }
  }

  resolvePermission(outcome: PermissionOutcome): void {
    const agentStore = useAgentStore.getState();

    if (this.permissionResolver) {
      this.permissionResolver(outcome);
      this.permissionResolver = null;
    }

    agentStore.setPendingPermission(null);
  }

  async cancelSession(sessionId: SessionId): Promise<void> {
    const transport = getTransport();
    await transport.cancelSession(sessionId);
  }

  async setSessionMode(sessionId: SessionId, modeId: string): Promise<void> {
    const transport = getTransport();
    const sessionStore = useSessionStore.getState();

    await transport.setSessionMode(sessionId, modeId);

    const session = sessionStore.sessions[sessionId];
    if (session?.modes) {
      sessionStore.setModes(sessionId, {
        ...session.modes,
        currentModeId: modeId,
      });
    }
  }
}

export const agentAPI = new AgentAPI();
