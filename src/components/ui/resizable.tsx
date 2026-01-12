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
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn(
        // Base styles
        "bg-border relative shrink-0 select-none touch-none transition-colors",
        "hover:bg-primary/40 active:bg-primary/60",
        // Horizontal (default): vertical line between left/right panels
        "w-1 cursor-col-resize",
        // Vertical: horizontal line between top/bottom panels
        "data-[orientation=vertical]:h-1 data-[orientation=vertical]:w-full data-[orientation=vertical]:cursor-row-resize",
        className
      )}
      {...props}
    />
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
