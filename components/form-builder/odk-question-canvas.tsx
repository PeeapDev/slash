"use client"

import { useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { FormField } from "@/lib/form-store"
import { FormGroupMeta, RepeatGroupMeta } from "./odk-form-designer"
import OdkQuestionCard from "./odk-question-card"
import OdkGroupWrapper from "./odk-group-wrapper"
import OdkRepeatGroupWrapper from "./odk-repeat-group-wrapper"

interface OdkQuestionCanvasProps {
  fields: FormField[]
  groups: FormGroupMeta[]
  repeatGroups: RepeatGroupMeta[]
  selectedFieldId: string | null
  expandedCardIds: Set<string>
  onSelectField: (fieldId: string | null) => void
  onToggleExpanded: (fieldId: string) => void
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void
  onRemoveField: (fieldId: string) => void
  onDuplicateField: (fieldId: string) => void
  onMoveField: (fieldId: string, direction: "up" | "down") => void
  onReorderFields: (oldIndex: number, newIndex: number) => void
  onAddField: (type: FormField["type"], insertAfterId?: string) => void
  onRemoveGroup: (groupId: string) => void
  onUpdateGroup: (groupId: string, updates: Partial<FormGroupMeta>) => void
  onRemoveRepeatGroup: (repeatGroupId: string) => void
  onUpdateRepeatGroup: (repeatGroupId: string, updates: Partial<RepeatGroupMeta>) => void
}

export default function OdkQuestionCanvas({
  fields,
  groups,
  repeatGroups,
  selectedFieldId,
  expandedCardIds,
  onSelectField,
  onToggleExpanded,
  onUpdateField,
  onRemoveField,
  onDuplicateField,
  onMoveField,
  onReorderFields,
  onAddField,
  onRemoveGroup,
  onUpdateGroup,
  onRemoveRepeatGroup,
  onUpdateRepeatGroup,
}: OdkQuestionCanvasProps) {
  // DnD sensors with activation constraint to avoid accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = fields.findIndex(f => f.id === active.id)
    const newIndex = fields.findIndex(f => f.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderFields(oldIndex, newIndex)
    }
  }, [fields, onReorderFields])

  // Build rendering structure
  const groupMap = new Map(groups.map(g => [g.id, g]))
  const repeatMap = new Map(repeatGroups.map(g => [g.id, g]))

  type RenderItem =
    | { type: "field"; id: string }
    | { type: "group"; id: string; groupMeta: FormGroupMeta; fields: FormField[] }
    | { type: "repeat"; id: string; repeatMeta: RepeatGroupMeta; fields: FormField[] }

  const renderItems: RenderItem[] = []

  // Collect fields by group/repeat
  const fieldsByGroup = new Map<string, FormField[]>()
  const fieldsByRepeat = new Map<string, FormField[]>()

  fields.forEach(f => {
    if (f.repeatGroupId && repeatMap.has(f.repeatGroupId)) {
      if (!fieldsByRepeat.has(f.repeatGroupId)) fieldsByRepeat.set(f.repeatGroupId, [])
      fieldsByRepeat.get(f.repeatGroupId)!.push(f)
    } else if (f.groupId && groupMap.has(f.groupId)) {
      if (!fieldsByGroup.has(f.groupId)) fieldsByGroup.set(f.groupId, [])
      fieldsByGroup.get(f.groupId)!.push(f)
    }
  })

  const renderedGroups = new Set<string>()
  const renderedRepeats = new Set<string>()

  fields.forEach(f => {
    if (f.repeatGroupId && repeatMap.has(f.repeatGroupId)) {
      if (!renderedRepeats.has(f.repeatGroupId)) {
        renderedRepeats.add(f.repeatGroupId)
        renderItems.push({
          type: "repeat",
          id: f.repeatGroupId,
          repeatMeta: repeatMap.get(f.repeatGroupId)!,
          fields: fieldsByRepeat.get(f.repeatGroupId) || [],
        })
      }
    } else if (f.groupId && groupMap.has(f.groupId)) {
      if (!renderedGroups.has(f.groupId)) {
        renderedGroups.add(f.groupId)
        renderItems.push({
          type: "group",
          id: f.groupId,
          groupMeta: groupMap.get(f.groupId)!,
          fields: fieldsByGroup.get(f.groupId) || [],
        })
      }
    } else {
      renderItems.push({ type: "field", id: f.id })
    }
  })

  // Empty groups/repeats
  groups.forEach(g => {
    if (!renderedGroups.has(g.id)) {
      renderItems.push({ type: "group", id: g.id, groupMeta: g, fields: [] })
    }
  })
  repeatGroups.forEach(g => {
    if (!renderedRepeats.has(g.id)) {
      renderItems.push({ type: "repeat", id: g.id, repeatMeta: g, fields: [] })
    }
  })

  const renderFieldCard = (field: FormField) => {
    const fieldIndex = fields.findIndex(f => f.id === field.id)
    return (
      <OdkQuestionCard
        key={field.id}
        field={field}
        index={fieldIndex}
        totalFields={fields.length}
        isSelected={selectedFieldId === field.id}
        isExpanded={expandedCardIds.has(field.id)}
        onSelect={() => onSelectField(field.id)}
        onToggleExpanded={() => onToggleExpanded(field.id)}
        onUpdate={(updates) => onUpdateField(field.id, updates)}
        onRemove={() => onRemoveField(field.id)}
        onDuplicate={() => onDuplicateField(field.id)}
        onMoveUp={() => onMoveField(field.id, "up")}
        onMoveDown={() => onMoveField(field.id, "down")}
        onAddAfter={() => onAddField("text", field.id)}
      />
    )
  }

  const fieldIds = fields.map(f => f.id)

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2 max-w-3xl mx-auto">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium mb-1">No questions yet</p>
            <p className="text-sm mb-4">Click &ldquo;+ Question&rdquo; in the toolbar to add your first question</p>
            <Button variant="outline" onClick={() => onAddField("text")}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Question
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
              {renderItems.map(item => {
                if (item.type === "group") {
                  return (
                    <OdkGroupWrapper
                      key={item.id}
                      group={item.groupMeta}
                      onUpdateGroup={(updates) => onUpdateGroup(item.id, updates)}
                      onRemoveGroup={() => onRemoveGroup(item.id)}
                    >
                      <div className="space-y-2">
                        {item.fields.map(f => renderFieldCard(f))}
                        {item.fields.length === 0 && (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No questions in this group yet
                          </div>
                        )}
                      </div>
                    </OdkGroupWrapper>
                  )
                }

                if (item.type === "repeat") {
                  return (
                    <OdkRepeatGroupWrapper
                      key={item.id}
                      group={item.repeatMeta}
                      onUpdateGroup={(updates) => onUpdateRepeatGroup(item.id, updates)}
                      onRemoveGroup={() => onRemoveRepeatGroup(item.id)}
                    >
                      <div className="space-y-2">
                        {item.fields.map(f => renderFieldCard(f))}
                        {item.fields.length === 0 && (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No questions in this repeat group yet
                          </div>
                        )}
                      </div>
                    </OdkRepeatGroupWrapper>
                  )
                }

                const field = fields.find(f => f.id === item.id)
                if (!field) return null
                return renderFieldCard(field)
              })}
            </SortableContext>

            {/* Add question at end */}
            <div className="flex justify-center pt-2 pb-8">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" onClick={() => onAddField("text")}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add question here
              </Button>
            </div>
          </DndContext>
        )}
      </div>
    </ScrollArea>
  )
}
