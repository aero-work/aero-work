import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TodoItem } from "@/types/acp";
import {
  CheckCircle2,
  Circle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ListTodo,
} from "lucide-react";

interface TodoPanelProps {
  todos: TodoItem[];
}

export function TodoPanel({ todos }: TodoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (todos.length === 0) return null;

  // Find current in_progress item
  const inProgressItem = todos.find((t) => t.status === "in_progress");
  const completedCount = todos.filter((t) => t.status === "completed").length;
  const totalCount = todos.length;

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm">
      {/* Header - always visible */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ListTodo className="w-4 h-4 text-primary flex-shrink-0" />

        {/* Current task or summary */}
        <div className="flex-1 min-w-0">
          {inProgressItem ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
              <span className="text-sm truncate">{inProgressItem.activeForm}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {completedCount === totalCount ? "All tasks completed" : "Tasks paused"}
            </span>
          )}
        </div>

        {/* Progress badge */}
        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground flex-shrink-0">
          {completedCount}/{totalCount}
        </span>

        {/* Expand toggle */}
        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Expanded todo list */}
      {isExpanded && (
        <div className="px-3 pb-2 space-y-1 max-h-48 overflow-y-auto">
          {todos.map((todo, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
                todo.status === "in_progress" && "bg-blue-500/10",
                todo.status === "completed" && "opacity-60"
              )}
            >
              {/* Status icon */}
              {todo.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : todo.status === "in_progress" ? (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}

              {/* Task text */}
              <span
                className={cn(
                  "flex-1 truncate",
                  todo.status === "completed" && "line-through text-muted-foreground"
                )}
              >
                {todo.activeForm}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
