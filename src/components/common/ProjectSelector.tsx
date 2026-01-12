import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFileStore, type RecentProject } from "@/stores/fileStore";
import {
  FolderOpen,
  FolderRoot,
  Clock,
  Trash2,
  ChevronRight,
} from "lucide-react";

interface ProjectSelectorProps {
  onSelect: (path: string) => void;
  trigger?: React.ReactNode;
}

export function ProjectSelector({ onSelect, trigger }: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [customPath, setCustomPath] = useState("");

  const {
    currentWorkingDir,
    recentProjects,
    addRecentProject,
    removeRecentProject,
  } = useFileStore();

  const handleSelectProject = useCallback(
    (path: string) => {
      addRecentProject(path);
      onSelect(path);
      setOpen(false);
    },
    [addRecentProject, onSelect]
  );

  const handleCustomPath = useCallback(() => {
    if (customPath.trim()) {
      handleSelectProject(customPath.trim());
      setCustomPath("");
    }
  }, [customPath, handleSelectProject]);

  const handleRemoveRecent = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.stopPropagation();
      removeRecentProject(path);
    },
    [removeRecentProject]
  );

  const formatPath = (path: string) => {
    // Shorten home directory
    const home = "/Users/";
    if (path.startsWith(home)) {
      const parts = path.slice(home.length).split("/");
      if (parts.length > 0) {
        return `~/${parts.slice(1).join("/")}`;
      }
    }
    return path;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            {currentWorkingDir ? (
              <span className="max-w-32 truncate">
                {currentWorkingDir.split("/").pop()}
              </span>
            ) : (
              "Open Project"
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderRoot className="w-5 h-5" />
            Open Project
          </DialogTitle>
          <DialogDescription>
            Select a project directory to work with
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter directory path..."
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCustomPath();
                }
              }}
            />
            <Button onClick={handleCustomPath} disabled={!customPath.trim()}>
              Open
            </Button>
          </div>

          {recentProjects.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Recent Projects
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {recentProjects.map((project: RecentProject) => (
                    <div
                      key={project.path}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer group"
                      onClick={() => handleSelectProject(project.path)}
                    >
                      <FolderOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {project.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatPath(project.path)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={(e: React.MouseEvent) => handleRemoveRecent(e, project.path)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {recentProjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No recent projects</p>
              <p className="text-sm">Enter a path above to get started</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
