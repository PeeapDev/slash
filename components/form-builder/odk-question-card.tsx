"use client"

import { useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
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
  Asterisk,
  Plus,
  Filter,
  ShieldAlert,
} from "lucide-react"
import { FormField } from "@/lib/form-store"
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

const fieldTypeLabels: Record<string, string> = {
  text: "Text",
  integer: "Integer",
  decimal: "Decimal",
  number: "Number",
  select: "Select One",
  radio: "Radio",
  checkbox: "Select Multiple",
  date: "Date",
  time: "Time",
  file: "File Upload",
  email: "Email",
  phone: "Phone",
  gps: "GPS Location",
  likert: "Likert Scale",
  note: "Note",
  rating: "Rating",
  range: "Range",
  image: "Image",
  barcode: "Barcode",
  calculate: "Calculate",
}

interface OdkQuestionCardProps {
  field: FormField
  index: number
  totalFields: number
  isSelected: boolean
  isExpanded: boolean
  onSelect: () => void
  onToggleExpanded: () => void
  onUpdate: (updates: Partial<FormField>) => void
  onRemove: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAddAfter: () => void
}

export default function OdkQuestionCard({
  field,
  index,
  totalFields,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpanded,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onAddAfter,
}: OdkQuestionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const Icon = fieldTypeIcons[field.type] || Type

  // dnd-kit sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Scroll into view when selected
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [isSelected])

  const hasSkipLogic = field.relevance && field.relevance.length > 0
  const hasConstraints = field.constraints && field.constraints.length > 0
  const hasCascading = !!field.cascadingParentId
  const hasOptions = ["select", "radio", "checkbox", "likert"].includes(field.type)

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        ref={cardRef}
        className={cn(
          "transition-all duration-150 cursor-pointer group",
          isSelected ? "border-l-4 border-l-primary ring-1 ring-primary/20 shadow-md" : "hover:shadow-sm border-l-4 border-l-transparent",
          isDragging && "opacity-50 shadow-lg ring-2 ring-primary/30"
        )}
        onClick={onSelect}
      >
        {/* Collapsed Header - always visible */}
        <div className="flex items-center gap-2 p-3">
          <div
            {...listeners}
            className="touch-none"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity" />
          </div>

          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{field.label || "Untitled question"}</span>
              {field.required && (
                <Asterisk className="w-3 h-3 text-red-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                {fieldTypeLabels[field.type] || field.type}
              </Badge>
              {hasSkipLogic && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 gap-0.5">
                  <Filter className="w-2.5 h-2.5" />
                  Logic
                </Badge>
              )}
              {hasConstraints && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 gap-0.5">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  Validated
                </Badge>
              )}
              {hasCascading && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 gap-0.5 text-violet-600">
                  Cascading
                </Badge>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className={cn(
            "flex items-center gap-0.5 shrink-0 transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onMoveUp() }} disabled={index === 0}>
              <ChevronUp className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onMoveDown() }} disabled={index === totalFields - 1}>
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onDuplicate() }}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onRemove() }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={(e) => { e.stopPropagation(); onToggleExpanded() }}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Expanded content */}
        <Collapsible open={isExpanded}>
          <CollapsibleContent>
            <div className="px-3 pb-3 pt-1 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
              {/* Inline label edit */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Question Label</label>
                <Input
                  value={field.label}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  placeholder="Enter question text"
                  className="text-sm"
                />
              </div>

              {/* Hint */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Hint Text</label>
                <Input
                  value={field.hint || ""}
                  onChange={(e) => onUpdate({ hint: e.target.value })}
                  placeholder="Help text shown below the question"
                  className="text-sm"
                />
              </div>

              {/* Options inline editor for choice types */}
              {hasOptions && !hasCascading && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Options</label>
                  <div className="space-y-1.5">
                    {(field.options || []).map((opt, i) => (
                      <div key={i} className="flex gap-1.5">
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const updated = [...(field.options || [])]
                            updated[i] = e.target.value
                            onUpdate({ options: updated })
                          }}
                          className="text-sm h-8"
                          placeholder={`Option ${i + 1}`}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
                          onClick={() => {
                            const updated = (field.options || []).filter((_, idx) => idx !== i)
                            onUpdate({ options: updated })
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-7"
                      onClick={() => onUpdate({ options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              {hasCascading && (
                <div className="text-xs text-muted-foreground bg-violet-50 dark:bg-violet-950/20 rounded-md p-2">
                  <span className="font-medium text-violet-700 dark:text-violet-400">Cascading Select:</span> Options depend on parent field
                  <span className="text-muted-foreground/60"> — edit in Properties &gt; Logic tab</span>
                </div>
              )}

              {/* Summary badges for logic */}
              {hasSkipLogic && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                  <span className="font-medium">Skip Logic:</span> {field.relevance!.length} condition{field.relevance!.length !== 1 ? "s" : ""}
                  <span className="text-muted-foreground/60"> — edit in Properties panel</span>
                </div>
              )}
              {hasConstraints && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                  <span className="font-medium">Constraints:</span> {field.constraints!.length} rule{field.constraints!.length !== 1 ? "s" : ""}
                  <span className="text-muted-foreground/60"> — edit in Properties panel</span>
                </div>
              )}

              {/* Add question after this */}
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs text-muted-foreground h-7"
                onClick={onAddAfter}
              >
                <Plus className="w-3 h-3 mr-1" />
                Insert question below
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}
