"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Link2 } from "lucide-react"
import { FormField, CascadingChoice } from "@/lib/form-store"

interface OdkCascadingEditorProps {
  field: FormField
  allFields: FormField[]
  onUpdate: (updates: Partial<FormField>) => void
}

export default function OdkCascadingEditor({
  field,
  allFields,
  onUpdate,
}: OdkCascadingEditorProps) {
  // Only select/radio fields can be cascading parents
  const selectFields = allFields.filter(
    f => f.id !== field.id && ["select", "radio"].includes(f.type) && f.options && f.options.length > 0
  )

  const parentField = selectFields.find(f => f.id === field.cascadingParentId)
  const choices = field.cascadingChoices || []

  const setParent = (parentId: string) => {
    if (!parentId) {
      onUpdate({ cascadingParentId: undefined, cascadingChoices: undefined })
      return
    }
    const parent = selectFields.find(f => f.id === parentId)
    if (!parent) return
    // Auto-generate choices scaffold from parent options
    const existingChoices = field.cascadingChoices || []
    if (existingChoices.length === 0 && parent.options) {
      const scaffold: CascadingChoice[] = parent.options.flatMap(pVal => [
        { value: `${pVal.toLowerCase().replace(/\s/g, "-")}-1`, label: `${pVal} Option 1`, parentValue: pVal },
        { value: `${pVal.toLowerCase().replace(/\s/g, "-")}-2`, label: `${pVal} Option 2`, parentValue: pVal },
      ])
      onUpdate({ cascadingParentId: parentId, cascadingChoices: scaffold })
    } else {
      onUpdate({ cascadingParentId: parentId })
    }
  }

  const addChoice = () => {
    const parentValue = parentField?.options?.[0] || ""
    const newChoice: CascadingChoice = {
      value: `choice-${Date.now()}`,
      label: "New Option",
      parentValue,
    }
    onUpdate({ cascadingChoices: [...choices, newChoice] })
  }

  const updateChoice = (index: number, updates: Partial<CascadingChoice>) => {
    const updated = choices.map((c, i) => (i === index ? { ...c, ...updates } : c))
    onUpdate({ cascadingChoices: updated })
  }

  const removeChoice = (index: number) => {
    onUpdate({ cascadingChoices: choices.filter((_, i) => i !== index) })
  }

  // Group choices by parentValue for display
  const choicesByParent = new Map<string, { choice: CascadingChoice; index: number }[]>()
  choices.forEach((c, i) => {
    const key = c.parentValue || "(no parent)"
    if (!choicesByParent.has(key)) choicesByParent.set(key, [])
    choicesByParent.get(key)!.push({ choice: c, index: i })
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">Cascading Select</span>
      </div>

      {/* Parent field selector */}
      <div className="space-y-1">
        <label className="text-[11px] text-muted-foreground">Parent Field</label>
        <select
          value={field.cascadingParentId || ""}
          onChange={(e) => setParent(e.target.value)}
          className="w-full h-7 text-xs border rounded bg-background px-1.5"
        >
          <option value="">None (not cascading)</option>
          {selectFields.map(f => (
            <option key={f.id} value={f.id}>
              {f.label || f.id}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-muted-foreground">
          Options shown will depend on the selected value in the parent field.
        </p>
      </div>

      {/* Cascading choices editor */}
      {field.cascadingParentId && parentField && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-muted-foreground">Cascading Choices</label>
              <Badge variant="outline" className="text-[10px] h-4">{choices.length}</Badge>
            </div>

            {Array.from(choicesByParent.entries()).map(([parentVal, items]) => (
              <div key={parentVal} className="space-y-1">
                <div className="text-[10px] font-semibold text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                  When parent = &ldquo;{parentVal}&rdquo;
                </div>
                {items.map(({ choice, index }) => (
                  <div key={index} className="flex gap-1 pl-2">
                    <Input
                      value={choice.value}
                      onChange={(e) => updateChoice(index, { value: e.target.value })}
                      placeholder="Value"
                      className="h-6 text-[11px] font-mono flex-1"
                    />
                    <Input
                      value={choice.label}
                      onChange={(e) => updateChoice(index, { label: e.target.value })}
                      placeholder="Display label"
                      className="h-6 text-[11px] flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeChoice(index)}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ))}

            {/* Add choice with parent value picker */}
            <div className="flex gap-1 items-center">
              <select
                id="new-choice-parent"
                className="h-6 text-[11px] border rounded bg-background px-1 flex-1"
                defaultValue={parentField.options?.[0] || ""}
              >
                {parentField.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2"
                onClick={() => {
                  const parentEl = document.getElementById("new-choice-parent") as HTMLSelectElement
                  const parentValue = parentEl?.value || parentField.options?.[0] || ""
                  const newChoice: CascadingChoice = {
                    value: `choice-${Date.now()}`,
                    label: "New Option",
                    parentValue,
                  }
                  onUpdate({ cascadingChoices: [...choices, newChoice] })
                }}
              >
                <Plus className="w-2.5 h-2.5 mr-0.5" />
                Add
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
