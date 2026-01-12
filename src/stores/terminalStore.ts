import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export interface TerminalInfo {
  id: string;
  working_dir: string;
}

export interface TerminalOutput {
  terminal_id: string;
  data: string;
}

interface TerminalState {
  terminals: TerminalInfo[];
  activeTerminalId: string | null;
  isTerminalPanelOpen: boolean;
}

interface TerminalActions {
  createTerminal: (workingDir: string, cols: number, rows: number) => Promise<string>;
  writeTerminal: (terminalId: string, data: string) => Promise<void>;
  resizeTerminal: (terminalId: string, cols: number, rows: number) => Promise<void>;
  killTerminal: (terminalId: string) => Promise<void>;
  listTerminals: () => Promise<void>;
  setActiveTerminal: (terminalId: string | null) => void;
  setTerminalPanelOpen: (open: boolean) => void;
  toggleTerminalPanel: () => void;
  addTerminal: (terminal: TerminalInfo) => void;
  removeTerminal: (terminalId: string) => void;
}

type TerminalStore = TerminalState & TerminalActions;

export const useTerminalStore = create<TerminalStore>()(
  immer((set, _get) => ({
    terminals: [],
    activeTerminalId: null,
    isTerminalPanelOpen: false,

    createTerminal: async (workingDir: string, cols: number, rows: number) => {
      const terminalId = await invoke<string>("create_terminal", {
        workingDir,
        cols,
        rows,
      });

      const terminal: TerminalInfo = {
        id: terminalId,
        working_dir: workingDir,
      };

      set((state) => {
        state.terminals.push(terminal);
        state.activeTerminalId = terminalId;
        state.isTerminalPanelOpen = true;
      });

      return terminalId;
    },

    writeTerminal: async (terminalId: string, data: string) => {
      await invoke("write_terminal", { terminalId, data });
    },

    resizeTerminal: async (terminalId: string, cols: number, rows: number) => {
      await invoke("resize_terminal", { terminalId, cols, rows });
    },

    killTerminal: async (terminalId: string) => {
      await invoke("kill_terminal", { terminalId });
      set((state) => {
        state.terminals = state.terminals.filter((t) => t.id !== terminalId);
        if (state.activeTerminalId === terminalId) {
          state.activeTerminalId = state.terminals[0]?.id ?? null;
        }
        if (state.terminals.length === 0) {
          state.isTerminalPanelOpen = false;
        }
      });
    },

    listTerminals: async () => {
      const terminals = await invoke<TerminalInfo[]>("list_terminals");
      set((state) => {
        state.terminals = terminals;
      });
    },

    setActiveTerminal: (terminalId: string | null) => {
      set((state) => {
        state.activeTerminalId = terminalId;
      });
    },

    setTerminalPanelOpen: (open: boolean) => {
      set((state) => {
        state.isTerminalPanelOpen = open;
      });
    },

    toggleTerminalPanel: () => {
      set((state) => {
        state.isTerminalPanelOpen = !state.isTerminalPanelOpen;
      });
    },

    addTerminal: (terminal: TerminalInfo) => {
      set((state) => {
        state.terminals.push(terminal);
        if (!state.activeTerminalId) {
          state.activeTerminalId = terminal.id;
        }
      });
    },

    removeTerminal: (terminalId: string) => {
      set((state) => {
        state.terminals = state.terminals.filter((t) => t.id !== terminalId);
        if (state.activeTerminalId === terminalId) {
          state.activeTerminalId = state.terminals[0]?.id ?? null;
        }
      });
    },
  }))
);

// Terminal output event listener setup
let unlistenFn: UnlistenFn | null = null;
const outputCallbacks = new Map<string, (data: string) => void>();

export async function setupTerminalOutputListener() {
  if (unlistenFn) return;

  unlistenFn = await listen<TerminalOutput>("terminal:output", (event) => {
    const callback = outputCallbacks.get(event.payload.terminal_id);
    if (callback) {
      callback(event.payload.data);
    }
  });
}

export function registerTerminalOutputCallback(
  terminalId: string,
  callback: (data: string) => void
) {
  outputCallbacks.set(terminalId, callback);
  return () => {
    outputCallbacks.delete(terminalId);
  };
}

export function cleanupTerminalOutputListener() {
  if (unlistenFn) {
    unlistenFn();
    unlistenFn = null;
  }
  outputCallbacks.clear();
}
