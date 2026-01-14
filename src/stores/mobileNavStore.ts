import { create } from "zustand";

export type MobileView = "chat" | "files" | "terminal" | "settings" | "file-viewer";

interface MobileNavState {
  currentView: MobileView;
  previousView: MobileView | null;
  isSidebarOpen: boolean;
  viewingFilePath: string | null;

  setView: (view: MobileView) => void;
  goBack: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  openFileViewer: (filePath: string) => void;
}

export const useMobileNavStore = create<MobileNavState>((set) => ({
  currentView: "chat",
  previousView: null,
  isSidebarOpen: false,
  viewingFilePath: null,

  setView: (view) =>
    set((state) => ({
      previousView: state.currentView,
      currentView: view,
      isSidebarOpen: false,
    })),

  goBack: () =>
    set((state) => ({
      currentView: state.previousView || "chat",
      previousView: null,
      viewingFilePath: state.currentView === "file-viewer" ? null : state.viewingFilePath,
    })),

  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  openFileViewer: (filePath) =>
    set((state) => ({
      previousView: state.currentView,
      currentView: "file-viewer",
      viewingFilePath: filePath,
    })),
}));
