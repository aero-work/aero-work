import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  Transport,
  InitializeResponse,
} from "./types";
import type {
  SessionId,
  NewSessionResponse,
  PromptResponse,
  SessionUpdate,
  PermissionRequest,
  PermissionOutcome,
} from "@/types/acp";

export class TauriTransport implements Transport {
  private connected = false;
  private eventUnlisteners: UnlistenFn[] = [];

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      await invoke("connect_agent");
      this.connected = true;
    } catch (error) {
      console.error("Failed to connect to agent:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    for (const unlisten of this.eventUnlisteners) {
      unlisten();
    }
    this.eventUnlisteners = [];

    try {
      await invoke("disconnect_agent");
    } finally {
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async initialize(): Promise<InitializeResponse> {
    const response = await invoke<InitializeResponse>("initialize_agent");
    return response;
  }

  async createSession(cwd: string): Promise<NewSessionResponse> {
    const response = await invoke<NewSessionResponse>("create_session", {
      cwd,
    });
    return response;
  }

  async prompt(
    sessionId: SessionId,
    content: string,
    onUpdate: (update: SessionUpdate) => void,
    onPermissionRequest: (
      request: PermissionRequest
    ) => Promise<PermissionOutcome>
  ): Promise<PromptResponse> {
    const updateUnlisten = await listen<{ sessionId: string; update: SessionUpdate }>(
      `session-update-${sessionId}`,
      (event) => {
        onUpdate(event.payload.update);
      }
    );
    this.eventUnlisteners.push(updateUnlisten);

    console.log(`Setting up permission listener for permission-request-${sessionId}`);
    const permissionUnlisten = await listen<PermissionRequest>(
      `permission-request-${sessionId}`,
      async (event) => {
        console.log("Received permission request event:", event);
        console.log("Permission payload:", event.payload);
        const outcome = await onPermissionRequest(event.payload);
        console.log("Permission resolved with outcome:", outcome);
        await invoke("respond_permission", {
          requestId: event.payload.requestId,
          outcome,
        });
      }
    );
    this.eventUnlisteners.push(permissionUnlisten);

    try {
      const response = await invoke<PromptResponse>("send_prompt", {
        sessionId,
        content,
      });
      return response;
    } finally {
      updateUnlisten();
      permissionUnlisten();
      this.eventUnlisteners = this.eventUnlisteners.filter(
        (u) => u !== updateUnlisten && u !== permissionUnlisten
      );
    }
  }

  async cancelSession(sessionId: SessionId): Promise<void> {
    await invoke("cancel_session", { sessionId });
  }

  async setSessionMode(sessionId: SessionId, modeId: string): Promise<void> {
    await invoke("set_session_mode", { sessionId, modeId });
  }
}
