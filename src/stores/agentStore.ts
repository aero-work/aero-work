import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  AgentCapabilities,
  AuthMethod,
  Implementation,
  PermissionRequest,
} from "@/types/acp";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

interface AgentState {
  connectionStatus: ConnectionStatus;
  agentInfo: Implementation | null;
  agentCapabilities: AgentCapabilities | null;
  authMethods: AuthMethod[];
  isAuthenticated: boolean;
  pendingPermission: PermissionRequest | null;
  error: string | null;
  // Detected local server URL when connection fails (desktop app only)
  detectedLocalServer: string | null;
}

interface AgentActions {
  setConnectionStatus: (status: ConnectionStatus) => void;
  setAgentInfo: (info: Implementation) => void;
  setAgentCapabilities: (capabilities: AgentCapabilities) => void;
  setAuthMethods: (methods: AuthMethod[]) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setPendingPermission: (request: PermissionRequest | null) => void;
  setError: (error: string | null) => void;
  setDetectedLocalServer: (url: string | null) => void;
  reset: () => void;
}

const initialState: AgentState = {
  connectionStatus: "disconnected",
  agentInfo: null,
  agentCapabilities: null,
  authMethods: [],
  isAuthenticated: false,
  pendingPermission: null,
  error: null,
  detectedLocalServer: null,
};

export const useAgentStore = create<AgentState & AgentActions>()(
  immer((set) => ({
    ...initialState,

    setConnectionStatus: (status) => {
      set((state) => {
        state.connectionStatus = status;
        if (status === "disconnected" || status === "error") {
          state.agentInfo = null;
          state.agentCapabilities = null;
          state.isAuthenticated = false;
        }
      });
    },

    setAgentInfo: (info) => {
      set((state) => {
        state.agentInfo = info;
      });
    },

    setAgentCapabilities: (capabilities) => {
      set((state) => {
        state.agentCapabilities = capabilities;
      });
    },

    setAuthMethods: (methods) => {
      set((state) => {
        state.authMethods = methods;
      });
    },

    setAuthenticated: (authenticated) => {
      set((state) => {
        state.isAuthenticated = authenticated;
      });
    },

    setPendingPermission: (request) => {
      set((state) => {
        state.pendingPermission = request;
      });
    },

    setError: (error) => {
      set((state) => {
        state.error = error;
        if (error) {
          state.connectionStatus = "error";
        }
      });
    },

    setDetectedLocalServer: (url) => {
      set((state) => {
        state.detectedLocalServer = url;
      });
    },

    reset: () => {
      set(() => initialState);
    },
  }))
);
