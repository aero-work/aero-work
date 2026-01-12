import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: number;
}

interface FileState {
  currentWorkingDir: string | null;
  recentProjects: RecentProject[];
}

interface FileActions {
  setWorkingDir: (path: string) => void;
  addRecentProject: (path: string, name?: string) => void;
  removeRecentProject: (path: string) => void;
  clearRecentProjects: () => void;
}

const MAX_RECENT_PROJECTS = 10;

export const useFileStore = create<FileState & FileActions>()(
  persist(
    immer((set) => ({
      currentWorkingDir: null,
      recentProjects: [],

      setWorkingDir: (path) => {
        set((state) => {
          state.currentWorkingDir = path;
        });
      },

      addRecentProject: (path, name) => {
        set((state) => {
          // Remove if already exists
          state.recentProjects = state.recentProjects.filter(
            (p) => p.path !== path
          );

          // Add to front
          const projectName = name || path.split("/").pop() || path;
          state.recentProjects.unshift({
            path,
            name: projectName,
            lastOpened: Date.now(),
          });

          // Keep only max recent
          if (state.recentProjects.length > MAX_RECENT_PROJECTS) {
            state.recentProjects = state.recentProjects.slice(
              0,
              MAX_RECENT_PROJECTS
            );
          }

          state.currentWorkingDir = path;
        });
      },

      removeRecentProject: (path) => {
        set((state) => {
          state.recentProjects = state.recentProjects.filter(
            (p) => p.path !== path
          );
        });
      },

      clearRecentProjects: () => {
        set((state) => {
          state.recentProjects = [];
        });
      },
    })),
    {
      name: "aero-code-files",
      partialize: (state) => ({
        recentProjects: state.recentProjects,
        currentWorkingDir: state.currentWorkingDir,
      }),
    }
  )
);
