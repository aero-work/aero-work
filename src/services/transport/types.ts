import type {
  SessionId,
  NewSessionResponse,
  PromptResponse,
  SessionUpdate,
  PermissionRequest,
  PermissionOutcome,
  Implementation,
  AgentCapabilities,
  AuthMethod,
} from "@/types/acp";

export interface InitializeResponse {
  protocolVersion: number;
  agentInfo?: Implementation;
  agentCapabilities?: AgentCapabilities;
  authMethods?: AuthMethod[];
}

export interface Transport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  initialize(): Promise<InitializeResponse>;

  createSession(cwd: string): Promise<NewSessionResponse>;

  prompt(
    sessionId: SessionId,
    content: string,
    onUpdate: (update: SessionUpdate) => void,
    onPermissionRequest: (
      request: PermissionRequest
    ) => Promise<PermissionOutcome>
  ): Promise<PromptResponse>;

  cancelSession(sessionId: SessionId): Promise<void>;

  setSessionMode(sessionId: SessionId, modeId: string): Promise<void>;
}

export type TransportType = "tauri" | "websocket";

export interface TransportConfig {
  type: TransportType;
  websocketUrl?: string;
}
