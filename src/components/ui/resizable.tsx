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
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-1 data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:translate-x-0 data-[orientation=vertical]:after:-translate-y-1/2 [&[data-orientation=vertical]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVertical className="size-2.5" />
        </div>
      )}
    </Separator>
  )
}

// Three-panel layout: sidebar | center | right panel
interface ThreePanelLayoutProps {
  sidebar: React.ReactNode
  center: React.ReactNode
  right: React.ReactNode
  sidebarDefaultSize?: number
  sidebarMinSize?: number
  sidebarMaxSize?: number
  rightDefaultSize?: number
  rightMinSize?: number
  rightMaxSize?: number
}

function ThreePanelLayout({
  sidebar,
  center,
  right,
  sidebarDefaultSize = 15,
  sidebarMinSize = 10,
  sidebarMaxSize = 25,
  rightDefaultSize = 35,
  rightMinSize = 20,
  rightMaxSize = 50,
}: ThreePanelLayoutProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Sidebar */}
      <ResizablePanel
        defaultSize={sidebarDefaultSize}
        minSize={sidebarMinSize}
        maxSize={sidebarMaxSize}
      >
        <div className="h-full border-r">{sidebar}</div>
      </ResizablePanel>
      <ResizableHandle />

      {/* Center (chat) */}
      <ResizablePanel defaultSize={100 - sidebarDefaultSize - rightDefaultSize} minSize={25}>
        <div className="h-full border-r">{center}</div>
      </ResizablePanel>
      <ResizableHandle />

      {/* Right panel (editor) */}
      <ResizablePanel
        defaultSize={rightDefaultSize}
        minSize={rightMinSize}
        maxSize={rightMaxSize}
      >
        {right}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle, ThreePanelLayout }
