"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Trash2, FolderOpen } from "lucide-react"
import { FormGroupMeta } from "./odk-form-designer"
import { cn } from "@/lib/utils"

interface OdkGroupWrapperProps {
  group: FormGroupMeta
  onUpdateGroup: (updates: Partial<FormGroupMeta>) => void
  onRemoveGroup: () => void
  children: ReactNode
}

export default function OdkGroupWrapper({
  group,
  onUpdateGroup,
  onRemoveGroup,
  children,
}: OdkGroupWrapperProps) {
  return (
    <Collapsible open={!group.collapsed} onOpenChange={(open) => onUpdateGroup({ collapsed: !open })}>
      <div className={cn(
        "border-l-4 border-l-amber-500/60 rounded-lg bg-amber-50/30 dark:bg-amber-950/10",
        "border border-amber-200/50 dark:border-amber-800/30"
      )}>
        {/* Group Header */}
        <div className="flex items-center gap-2 p-2.5">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                group.collapsed && "-rotate-90"
              )} />
            </Button>
          </CollapsibleTrigger>
          <FolderOpen className="w-4 h-4 text-amber-600 shrink-0" />
          <Input
            value={group.label}
            onChange={(e) => onUpdateGroup({ label: e.target.value })}
            placeholder="Section name"
            className="h-7 text-sm font-medium border-none shadow-none bg-transparent focus-visible:ring-1 px-1"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0"
            onClick={onRemoveGroup}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Group Content */}
        <CollapsibleContent>
          <div className="px-2.5 pb-2.5">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
