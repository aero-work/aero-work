import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import type {
  Session,
  SessionId,
  Message,
  ToolCall,
  ToolCallUpdate,
  Plan,
  SessionModeState,
  SessionModelState,
  AvailableCommand,
  SessionUpdate,
} from "@/types/acp";

enableMapSet();

interface SessionState {
  sessions: Record<SessionId, Session>;
  activeSessionId: SessionId | null;
  isLoading: boolean;
  error: string | null;
}

interface SessionActions {
  createSession: (sessionId: SessionId, name?: string) => void;
  setActiveSession: (sessionId: SessionId | null) => void;
  addMessage: (sessionId: SessionId, message: Message) => void;
  appendToLastMessage: (sessionId: SessionId, content: string) => void;
  addToolCall: (sessionId: SessionId, toolCall: ToolCall) => void;
  updateToolCall: (sessionId: SessionId, update: ToolCallUpdate) => void;
  setPlan: (sessionId: SessionId, plan: Plan) => void;
  setModes: (sessionId: SessionId, modes: SessionModeState) => void;
  setModels: (sessionId: SessionId, models: SessionModelState) => void;
  setAvailableCommands: (
    sessionId: SessionId,
    commands: AvailableCommand[]
  ) => void;
  handleSessionUpdate: (sessionId: SessionId, update: SessionUpdate) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  deleteSession: (sessionId: SessionId) => void;
  clearSessions: () => void;
}

export const useSessionStore = create<SessionState & SessionActions>()(
  immer((set, get) => ({
    sessions: {},
    activeSessionId: null,
    isLoading: false,
    error: null,

    createSession: (sessionId, name) => {
      set((state) => {
        const sessionCount = Object.keys(state.sessions).length;
        const session: Session = {
          id: sessionId,
          name: name || `Session ${sessionCount + 1}`,
          chatItems: [],
          toolCallsMap: new Map(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        state.sessions[sessionId] = session;
        state.activeSessionId = sessionId;
      });
    },

    setActiveSession: (sessionId) => {
      set((state) => {
        state.activeSessionId = sessionId;
      });
    },

    addMessage: (sessionId, message) => {
      set((state) => {
        const session = state.sessions[sessionId];
        if (session) {
          session.chatItems.push({ type: "message", message });
          session.updatedAt = Date.now();
        }
      });
    },

    appendToLastMessage: (sessionId, content) => {
      set((state) => {
        const session = state.sessions[sessionId];
        if (session && session.chatItems.length > 0) {
          // Find the last message item
          for (let i = session.chatItems.length - 1; i >= 0; i--) {
            const item = session.chatItems[i];
            if (item.type === "message" && item.message.role === "assistant") {
              item.message.content += content;
              session.updatedAt = Date.now();
              break;
            }
          }
        }
      });
    },

    addToolCall: (sessionId, toolCall) => {
      set((state) => {
        const session = state.sessions[sessionId];
        if (session) {
          // Add to ordered list
          session.chatItems.push({ type: "tool_call", toolCall });
          // Also add to map for quick updates
          session.toolCallsMap.set(toolCall.toolCallId, toolCall);
          session.updatedAt = Date.now();
        }
      });
    },

    updateToolCall: (sessionId, update) => {
      set((state) => {
        const session = state.sessions[sessionId];
        if (session) {
          const existing = session.toolCallsMap.get(update.toolCallId);
          if (existing) {
            const updated = {
              ...existing,
              ...update,
              content: update.content ?? existing.content,
              locations: update.locations ?? existing.locations,
            };
            // Update in map
            session.toolCallsMap.set(update.toolCallId, updated);
            // Update in chatItems list
            const itemIndex = session.chatItems.findIndex(
              (item) =>
                item.type === "tool_call" &&
                item.toolCall.toolCallId === update.toolCallId
            );
            if (itemIndex !== -1) {
              session.chatItems[itemIndex] = { type: "tool_call", toolCall: updated };
            }
            session.updatedAt = Date.now();
          }
        }
      });
    },

    setPlan: (sessionId, plan) => {
      set((state) => {
        const session = state.sessions[sessionId];
        if (session) {
          session.plan = plan;
          session.updatedAt = Date.now();
        }
      });
    },

    setModes: (sessionId, modes) => {
      set((state) => {
        const session = state.sessions[sessionId];
        if (session) {
          session.modes = modes;
          session.updatedAt = Date.now();
        }
      });
    },

    setModels: (sessionId, models) => {
      set((state) => {
        const session = state.sessions[sessionId];
        if (session) {
          session.models = models;
          session.updatedAt = Date.now();
        }
      });
    },

    setAvailableCommands: (sessionId, commands) => {
      set((state) => {
        const session = state.sessions[sessionId];
        if (session) {
          session.availableCommands = commands;
          session.updatedAt = Date.now();
        }
      });
    },

    handleSessionUpdate: (sessionId, update) => {
      const actions = get();

      switch (update.sessionUpdate) {
        case "agent_message_chunk":
          if (update.content.type === "text") {
            const session = get().sessions[sessionId];
            if (session) {
              // Find the last message item
              let lastMessage: Message | null = null;
              for (let i = session.chatItems.length - 1; i >= 0; i--) {
                const item = session.chatItems[i];
                if (item.type === "message") {
                  lastMessage = item.message;
                  break;
                }
              }
              if (lastMessage?.role === "assistant") {
                actions.appendToLastMessage(sessionId, update.content.text);
              } else {
                actions.addMessage(sessionId, {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: update.content.text,
                  timestamp: Date.now(),
                });
              }
            }
          }
          break;

        case "tool_call":
          actions.addToolCall(sessionId, {
            toolCallId: update.toolCallId,
            title: update.title,
            kind: update.kind,
            status: update.status,
            rawInput: update.rawInput,
            content: update.content,
            locations: update.locations,
          });
          break;

        case "tool_call_update":
          actions.updateToolCall(sessionId, update);
          break;

        case "plan":
          actions.setPlan(sessionId, { entries: update.entries });
          break;

        case "available_commands_update":
          actions.setAvailableCommands(sessionId, update.availableCommands);
          break;

        case "current_mode_update": {
          const session = get().sessions[sessionId];
          if (session?.modes) {
            actions.setModes(sessionId, {
              ...session.modes,
              currentModeId: update.currentModeId,
            });
          }
          break;
        }
      }
    },

    setLoading: (loading) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    setError: (error) => {
      set((state) => {
        state.error = error;
      });
    },

    deleteSession: (sessionId) => {
      set((state) => {
        delete state.sessions[sessionId];
        if (state.activeSessionId === sessionId) {
          const remaining = Object.keys(state.sessions);
          state.activeSessionId = remaining.length > 0 ? remaining[0] : null;
        }
      });
    },

    clearSessions: () => {
      set((state) => {
        state.sessions = {};
        state.activeSessionId = null;
      });
    },
  }))
);

export const useActiveSession = () => {
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const sessions = useSessionStore((state) => state.sessions);
  return activeSessionId ? sessions[activeSessionId] : undefined;
};
