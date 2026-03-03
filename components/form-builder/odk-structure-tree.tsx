"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Type,
  Hash,
  List,
  Circle,
  CheckSquare,
  Calendar,
  Clock,
  Upload,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  FileText,
  Star,
  SlidersHorizontal,
  QrCode,
  Calculator,
  ImageIcon,
  ChevronDown,
  FolderOpen,
  Folder,
  Layers,
  Repeat,
} from "lucide-react"
import { FormField } from "@/lib/form-store"
import { FormGroupMeta, RepeatGroupMeta } from "./odk-form-designer"
import { cn } from "@/lib/utils"

const fieldTypeIcons: Record<string, any> = {
  text: Type,
  integer: Hash,
  decimal: Hash,
  number: Hash,
  select: List,
  radio: Circle,
  checkbox: CheckSquare,
  date: Calendar,
  time: Clock,
  file: Upload,
  email: Mail,
  phone: Phone,
  gps: MapPin,
  likert: BarChart3,
  note: FileText,
  rating: Star,
  range: SlidersHorizontal,
  image: ImageIcon,
  barcode: QrCode,
  calculate: Calculator,
}

interface OdkStructureTreeProps {
  fields: FormField[]
  groups: FormGroupMeta[]
  repeatGroups: RepeatGroupMeta[]
  selectedFieldId: string | null
  onSelectField: (fieldId: string | null) => void
}

export default function OdkStructureTree({
  fields,
  groups,
  repeatGroups,
  selectedFieldId,
  onSelectField,
}: OdkStructureTreeProps) {
  const groupMap = new Map(groups.map(g => [g.id, g]))
  const repeatMap = new Map(repeatGroups.map(g => [g.id, g]))

  // Sections: groups, repeat groups, and loose fields
  type Section =
    | { type: "group"; group: FormGroupMeta; fields: FormField[] }
    | { type: "repeat"; group: RepeatGroupMeta; fields: FormField[] }
    | { type: "field"; field: FormField }

  const sections: Section[] = []
  const renderedGroupIds = new Set<string>()
  const renderedRepeatIds = new Set<string>()

  fields.forEach(f => {
    if (f.repeatGroupId && repeatMap.has(f.repeatGroupId)) {
      if (!renderedRepeatIds.has(f.repeatGroupId)) {
        renderedRepeatIds.add(f.repeatGroupId)
        sections.push({
          type: "repeat",
          group: repeatMap.get(f.repeatGroupId)!,
          fields: fields.filter(ff => ff.repeatGroupId === f.repeatGroupId),
        })
      }
    } else if (f.groupId && groupMap.has(f.groupId)) {
      if (!renderedGroupIds.has(f.groupId)) {
        renderedGroupIds.add(f.groupId)
        sections.push({
          type: "group",
          group: groupMap.get(f.groupId)!,
          fields: fields.filter(ff => ff.groupId === f.groupId),
        })
      }
    } else if (!f.groupId && !f.repeatGroupId) {
      sections.push({ type: "field", field: f })
    } else if (f.groupId && !groupMap.has(f.groupId)) {
      sections.push({ type: "field", field: f })
    } else if (f.repeatGroupId && !repeatMap.has(f.repeatGroupId)) {
      sections.push({ type: "field", field: f })
    }
  })

  // Empty groups/repeats
  groups.forEach(g => {
    if (!renderedGroupIds.has(g.id)) {
      sections.push({ type: "group", group: g, fields: [] })
    }
  })
  repeatGroups.forEach(g => {
    if (!renderedRepeatIds.has(g.id)) {
      sections.push({ type: "repeat", group: g, fields: [] })
    }
  })

  const renderFieldItem = (f: FormField, indented: boolean) => {
    const Icon = fieldTypeIcons[f.type] || Type
    const isSelected = selectedFieldId === f.id
    return (
      <button
        key={f.id}
        onClick={() => onSelectField(f.id)}
        className={cn(
          "flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-md text-sm transition-colors",
          indented ? "pl-6" : "pl-2",
          isSelected
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted text-foreground/80"
        )}
      >
        <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs">{f.label || "Untitled"}</span>
      </button>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Structure</span>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {fields.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No questions yet
            </div>
          ) : (
            sections.map((section, sIdx) => {
              if (section.type === "group") {
                return (
                  <Collapsible key={section.group.id} defaultOpen>
                    <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-left py-1.5 px-2 rounded-md hover:bg-muted transition-colors group">
                      <ChevronDown className="w-3 h-3 text-muted-foreground transition-transform group-data-[state=closed]:rotate-[-90deg]" />
                      <FolderOpen className="w-3.5 h-3.5 text-amber-600 shrink-0 group-data-[state=closed]:hidden" />
                      <Folder className="w-3.5 h-3.5 text-amber-600 shrink-0 group-data-[state=open]:hidden" />
                      <span className="text-xs font-medium truncate">{section.group.label}</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-0.5 mt-0.5">
                        {section.fields.map(f => renderFieldItem(f, true))}
                        {section.fields.length === 0 && (
                          <div className="pl-6 text-[11px] text-muted-foreground py-1">Empty group</div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              }

              if (section.type === "repeat") {
                return (
                  <Collapsible key={section.group.id} defaultOpen>
                    <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-left py-1.5 px-2 rounded-md hover:bg-muted transition-colors group">
                      <ChevronDown className="w-3 h-3 text-muted-foreground transition-transform group-data-[state=closed]:rotate-[-90deg]" />
                      <Repeat className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      <span className="text-xs font-medium truncate">{section.group.label}</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-0.5 mt-0.5">
                        {section.fields.map(f => renderFieldItem(f, true))}
                        {section.fields.length === 0 && (
                          <div className="pl-6 text-[11px] text-muted-foreground py-1">Empty repeat</div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              }

              return renderFieldItem(section.field, false)
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
