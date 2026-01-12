import * as React from "react"
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
  className,
  ...props
}: Omit<React.ComponentProps<typeof Separator>, 'withHandle'>) {
  return (
    <Separator
      className={cn(
        // Base styles - thin line that expands on hover
        "bg-border relative flex items-center justify-center transition-colors",
        // Horizontal separator (between left/right panels)
        "w-px hover:w-1 hover:bg-primary/40 active:bg-primary/60 cursor-col-resize",
        // Wider invisible hit area for easier grabbing
        "after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2",
        // Vertical separator (between top/bottom panels)
        "data-[orientation=vertical]:w-full data-[orientation=vertical]:h-px",
        "data-[orientation=vertical]:hover:h-1 data-[orientation=vertical]:cursor-row-resize",
        "data-[orientation=vertical]:after:inset-x-0 data-[orientation=vertical]:after:top-1/2 data-[orientation=vertical]:after:h-4 data-[orientation=vertical]:after:w-full",
        "data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:-translate-y-1/2 data-[orientation=vertical]:after:translate-x-0",
        className
      )}
      {...props}
    />
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
