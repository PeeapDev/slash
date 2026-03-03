"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Trash2, Repeat } from "lucide-react"
import { RepeatGroupMeta } from "./odk-form-designer"
import { cn } from "@/lib/utils"

interface OdkRepeatGroupWrapperProps {
  group: RepeatGroupMeta
  onUpdateGroup: (updates: Partial<RepeatGroupMeta>) => void
  onRemoveGroup: () => void
  children: ReactNode
}

export default function OdkRepeatGroupWrapper({
  group,
  onUpdateGroup,
  onRemoveGroup,
  children,
}: OdkRepeatGroupWrapperProps) {
  return (
    <Collapsible open={!group.collapsed} onOpenChange={(open) => onUpdateGroup({ collapsed: !open })}>
      <div className={cn(
        "border-l-4 border-l-violet-500/60 rounded-lg bg-violet-50/30 dark:bg-violet-950/10",
        "border border-violet-200/50 dark:border-violet-800/30"
      )}>
        {/* Header */}
        <div className="flex items-center gap-2 p-2.5">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                group.collapsed && "-rotate-90"
              )} />
            </Button>
          </CollapsibleTrigger>
          <Repeat className="w-4 h-4 text-violet-600 shrink-0" />
          <Input
            value={group.label}
            onChange={(e) => onUpdateGroup({ label: e.target.value })}
            placeholder="Repeat group name"
            className="h-7 text-sm font-medium border-none shadow-none bg-transparent focus-visible:ring-1 px-1"
          />
          <Badge variant="outline" className="text-[10px] h-4 shrink-0 text-violet-600 border-violet-300">
            {group.repeatMin !== undefined || group.repeatMax !== undefined
              ? `${group.repeatMin ?? 1}–${group.repeatMax ?? "∞"} repeats`
              : "Repeatable"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0"
            onClick={onRemoveGroup}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Content */}
        <CollapsibleContent>
          <div className="px-2.5 pb-2.5">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
