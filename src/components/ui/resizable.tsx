import * as React from "react"
import { GripVertical } from "lucide-react"
import { Group, Panel, Separator } from "react-resizable-panels"

import { cn } from "@/lib/utils"

interface ResizablePanelGroupProps extends Omit<React.ComponentProps<typeof Group>, 'direction'> {
  direction?: "horizontal" | "vertical"
}

function ResizablePanelGroup({
  className,
  direction = "horizontal",
  ...props
}: ResizablePanelGroupProps) {
  return (
    <Group
      orientation={direction}
      className={cn(
        "flex h-full w-full data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof Panel>) {
  return <Panel {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean
}) {
  return (
    <Separator
      className={cn(
        // Base styles
        "bg-border relative flex items-center justify-center",
        // Horizontal separator (between left/right panels)
        "w-[3px] cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors",
        // Wider hit area
        "after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:-translate-x-1/2",
        // Vertical separator (between top/bottom panels)
        "data-[orientation=vertical]:h-[3px] data-[orientation=vertical]:w-full data-[orientation=vertical]:cursor-row-resize",
        "data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-3 data-[orientation=vertical]:after:w-full",
        "data-[orientation=vertical]:after:translate-x-0 data-[orientation=vertical]:after:-translate-y-1/2",
        // Handle icon rotation for vertical
        "[&[data-orientation=vertical]>div]:rotate-90",
        // Focus styles
        "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-muted hover:bg-accent z-10 flex h-6 w-4 items-center justify-center rounded-sm border shadow-sm transition-colors">
          <GripVertical className="size-3 text-muted-foreground" />
        </div>
      )}
    </Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
