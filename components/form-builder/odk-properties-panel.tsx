"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Settings2, Zap, Paintbrush } from "lucide-react"
import { FormField } from "@/lib/form-store"
import { FormGroupMeta, RepeatGroupMeta } from "./odk-form-designer"
import OdkSkipLogicBuilder from "./odk-skip-logic-builder"
import OdkConstraintBuilder from "./odk-constraint-builder"
import OdkCascadingEditor from "./odk-cascading-editor"

interface OdkPropertiesPanelProps {
  field: FormField | null
  allFields: FormField[]
  groups: FormGroupMeta[]
  repeatGroups: RepeatGroupMeta[]
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void
}

export default function OdkPropertiesPanel({
  field,
  allFields,
  groups,
  repeatGroups,
  onUpdateField,
}: OdkPropertiesPanelProps) {
  if (!field) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Settings2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No question selected</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Click a question on the canvas to view and edit its properties</p>
      </div>
    )
  }

  const update = (updates: Partial<FormField>) => onUpdateField(field.id, updates)
  const hasOptions = ["select", "radio", "checkbox", "likert"].includes(field.type)
  const isChoiceField = ["select", "radio", "checkbox"].includes(field.type)

  // Fields appearing before this one (for skip logic + cascading references)
  const fieldIndex = allFields.findIndex(f => f.id === field.id)
  const precedingFields = allFields.slice(0, fieldIndex)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</div>
        <div className="text-sm font-medium truncate mt-0.5">{field.label || "Untitled"}</div>
      </div>

      <Tabs defaultValue="general" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mx-2 mt-2">
          <TabsTrigger value="general" className="text-xs gap-1">
            <Settings2 className="w-3 h-3" />
            General
          </TabsTrigger>
          <TabsTrigger value="logic" className="text-xs gap-1">
            <Zap className="w-3 h-3" />
            Logic
          </TabsTrigger>
          <TabsTrigger value="display" className="text-xs gap-1">
            <Paintbrush className="w-3 h-3" />
            Display
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* ─── General Tab ─── */}
          <TabsContent value="general" className="px-3 pb-4 space-y-4 mt-0">
            {/* Label */}
            <div className="space-y-1.5 pt-3">
              <label className="text-xs font-medium">Question Label</label>
              <Input
                value={field.label}
                onChange={(e) => update({ label: e.target.value })}
                placeholder="Enter question text"
                className="text-sm"
              />
            </div>

            {/* Hint */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Hint / Help Text</label>
              <Input
                value={field.hint || ""}
                onChange={(e) => update({ hint: e.target.value })}
                placeholder="Shown below the question"
                className="text-sm"
              />
            </div>

            {/* Placeholder */}
            {!["note", "calculate", "gps", "image", "file", "barcode"].includes(field.type) && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Placeholder</label>
                <Input
                  value={field.placeholder || ""}
                  onChange={(e) => update({ placeholder: e.target.value })}
                  placeholder="Input placeholder text"
                  className="text-sm"
                />
              </div>
            )}

            {/* Default Value */}
            {!["note", "calculate", "gps", "image", "file", "barcode"].includes(field.type) && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Default Value</label>
                <Input
                  value={String(field.defaultValue ?? "")}
                  onChange={(e) => update({ defaultValue: e.target.value })}
                  placeholder="Pre-filled value"
                  className="text-sm"
                />
              </div>
            )}

            <Separator />

            {/* Switches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Required</label>
                <Switch checked={field.required} onCheckedChange={(v) => update({ required: v })} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Read Only</label>
                <Switch checked={field.readOnly || false} onCheckedChange={(v) => update({ readOnly: v })} />
              </div>
            </div>

            {/* Guidance Hint */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Guidance Hint</label>
              <Input
                value={field.guidanceHint || ""}
                onChange={(e) => update({ guidanceHint: e.target.value || undefined })}
                placeholder="Collapsible 'More info' text"
                className="text-sm"
              />
            </div>

            {/* Options Editor */}
            {hasOptions && !field.cascadingParentId && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">Options</label>
                    <Badge variant="outline" className="text-[10px] h-4">{field.options?.length || 0}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {(field.options || []).map((opt, i) => (
                      <div key={i} className="flex gap-1">
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const updated = [...(field.options || [])]
                            updated[i] = e.target.value
                            update({ options: updated })
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
                            update({ options: updated })
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
                      onClick={() => update({ options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* or_other + randomize toggles for choice fields */}
            {hasOptions && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">Allow &quot;Other&quot;</label>
                    <Switch checked={field.orOther || false} onCheckedChange={(v) => update({ orOther: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">Randomize Choices</label>
                    <Switch checked={field.randomizeChoices || false} onCheckedChange={(v) => update({ randomizeChoices: v })} />
                  </div>
                </div>
              </>
            )}

            {/* Rating specific */}
            {field.type === "rating" && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Max Rating</label>
                  <Input
                    type="number"
                    value={field.ratingMax ?? 5}
                    onChange={(e) => update({ ratingMax: parseInt(e.target.value) || 5 })}
                    min={1}
                    max={10}
                    className="text-sm h-8"
                  />
                </div>
              </>
            )}

            {/* Range specific */}
            {field.type === "range" && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Range Settings</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Min</label>
                      <Input
                        type="number"
                        value={field.rangeMin ?? 0}
                        onChange={(e) => update({ rangeMin: parseFloat(e.target.value) || 0 })}
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Max</label>
                      <Input
                        type="number"
                        value={field.rangeMax ?? 100}
                        onChange={(e) => update({ rangeMax: parseFloat(e.target.value) || 100 })}
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Step</label>
                      <Input
                        type="number"
                        value={field.rangeStep ?? 1}
                        onChange={(e) => update({ rangeStep: parseFloat(e.target.value) || 1 })}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Likert specific */}
            {field.type === "likert" && field.likertLabels && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Likert Labels</label>
                  {field.likertLabels.map((lbl, i) => (
                    <Input
                      key={i}
                      value={lbl}
                      onChange={(e) => {
                        const updated = [...(field.likertLabels || [])]
                        updated[i] = e.target.value
                        update({ likertLabels: updated })
                      }}
                      className="text-sm h-8"
                      placeholder={`Label ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Calculate specific */}
            {field.type === "calculate" && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Calculation Expression</label>
                  <Input
                    value={field.calculation || ""}
                    onChange={(e) => update({ calculation: e.target.value })}
                    placeholder='e.g. ${field-001} + ${field-002}'
                    className="text-sm font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Reference fields with {'${field-id}'}. Supports: +, -, *, /, count(), if(), today(), now()
                  </p>
                </div>
              </>
            )}

            {/* Note specific */}
            {field.type === "note" && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Acknowledge Label</label>
                  <Input
                    value={field.acknowledgeLabel || ""}
                    onChange={(e) => update({ acknowledgeLabel: e.target.value })}
                    placeholder="e.g. I have read this note"
                    className="text-sm"
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* ─── Logic Tab ─── */}
          <TabsContent value="logic" className="px-3 pb-4 space-y-4 mt-0">
            {/* Skip Logic */}
            <div className="pt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Skip Logic (Relevance)</h4>
              <p className="text-[11px] text-muted-foreground mb-3">Show this question only when all/any conditions are met.</p>
              <OdkSkipLogicBuilder
                conditions={field.relevance || []}
                availableFields={precedingFields}
                onChange={(conditions) => update({ relevance: conditions.length > 0 ? conditions : undefined })}
              />
            </div>

            <Separator />

            {/* Constraints */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Constraints (Validation)</h4>
              <p className="text-[11px] text-muted-foreground mb-3">Define validation rules for user input.</p>
              <OdkConstraintBuilder
                constraints={field.constraints || []}
                onChange={(constraints) => update({ constraints: constraints.length > 0 ? constraints : undefined })}
              />
            </div>

            {/* Cascading Selects */}
            {isChoiceField && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Cascading Select</h4>
                  <p className="text-[11px] text-muted-foreground mb-3">Make options depend on a parent field&apos;s selected value.</p>
                  <OdkCascadingEditor
                    field={field}
                    allFields={precedingFields}
                    onUpdate={update}
                  />
                </div>
              </>
            )}

            {/* Choice Filter Expression */}
            {isChoiceField && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Choice Filter</h4>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Filter visible options dynamically using an expression.
                  </p>
                  <Input
                    value={field.choiceFilterExpression || ""}
                    onChange={(e) => update({ choiceFilterExpression: e.target.value || undefined })}
                    placeholder='e.g. ${region} == $choice'
                    className="text-xs font-mono h-7"
                  />
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <p><code className="bg-muted px-1 rounded">{'${field-id}'}</code> — references another field&apos;s value</p>
                    <p><code className="bg-muted px-1 rounded">$choice</code> — the current option being evaluated</p>
                    <p>Operators: <code className="bg-muted px-1 rounded">==</code> <code className="bg-muted px-1 rounded">!=</code> <code className="bg-muted px-1 rounded">starts_with()</code> <code className="bg-muted px-1 rounded">contains()</code></p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ─── Display Tab ─── */}
          <TabsContent value="display" className="px-3 pb-4 space-y-4 mt-0">
            <div className="space-y-1.5 pt-3">
              <label className="text-xs font-medium">Appearance</label>
              <select
                value={field.appearance || ""}
                onChange={(e) => update({ appearance: (e.target.value || undefined) as FormField["appearance"] })}
                className="w-full h-8 text-sm border rounded-md bg-background px-2"
              >
                <option value="">Default</option>
                <option value="minimal">Minimal</option>
                <option value="horizontal">Horizontal</option>
                {field.type === "likert" && <option value="likert">Likert</option>}
                {field.type === "text" && <option value="multiline">Multiline</option>}
                {field.type === "text" && <option value="signature">Signature</option>}
                {field.type === "gps" && <option value="map">Map</option>}
                {(field.type === "radio" || field.type === "select") && <option value="quick">Quick (auto-advance)</option>}
                <option value="label">Label Only</option>
              </select>
            </div>

            {/* Group assignment */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Group / Section</label>
              <select
                value={field.groupId || ""}
                onChange={(e) => {
                  const groupId = e.target.value || undefined
                  // Clear repeat if assigning to group
                  update({ groupId, ...(groupId ? { repeatGroupId: undefined } : {}) })
                }}
                className="w-full h-8 text-sm border rounded-md bg-background px-2"
              >
                <option value="">No group</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            {/* Repeat group assignment */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Repeat Group</label>
              <select
                value={field.repeatGroupId || ""}
                onChange={(e) => {
                  const repeatGroupId = e.target.value || undefined
                  const rg = repeatGroups.find(g => g.id === repeatGroupId)
                  // Clear group if assigning to repeat
                  update({
                    repeatGroupId,
                    ...(repeatGroupId ? { groupId: undefined, repeatMin: rg?.repeatMin, repeatMax: rg?.repeatMax } : { repeatMin: undefined, repeatMax: undefined }),
                  })
                }}
                className="w-full h-8 text-sm border rounded-md bg-background px-2"
              >
                <option value="">Not in repeat group</option>
                {repeatGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            {/* Repeat min/max (when in a repeat group) */}
            {field.repeatGroupId && (
              <div className="space-y-1.5 p-2 rounded-md bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/50">
                <label className="text-xs font-medium text-violet-700 dark:text-violet-400">Repeat Constraints</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Min Repeats</label>
                    <Input
                      type="number"
                      value={field.repeatMin ?? ""}
                      onChange={(e) => update({ repeatMin: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="1"
                      className="h-7 text-xs"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Max Repeats</label>
                    <Input
                      type="number"
                      value={field.repeatMax ?? ""}
                      onChange={(e) => update({ repeatMax: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="No limit"
                      className="h-7 text-xs"
                      min={1}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Field type */}
            <Separator />
            <div className="space-y-1">
              <label className="text-xs font-medium">Field Type</label>
              <select
                value={field.type}
                onChange={(e) => update({ type: e.target.value as FormField["type"] })}
                className="w-full h-8 text-sm border rounded-md bg-background px-2"
              >
                <optgroup label="Text">
                  <option value="text">Text</option>
                  <option value="integer">Integer</option>
                  <option value="decimal">Decimal</option>
                </optgroup>
                <optgroup label="Choice">
                  <option value="select">Select One</option>
                  <option value="radio">Radio Buttons</option>
                  <option value="checkbox">Select Multiple</option>
                </optgroup>
                <optgroup label="Date & Time">
                  <option value="date">Date</option>
                  <option value="time">Time</option>
                  <option value="dateTime">Date + Time</option>
                </optgroup>
                <optgroup label="Media">
                  <option value="image">Image</option>
                  <option value="file">File Upload</option>
                </optgroup>
                <optgroup label="Location">
                  <option value="gps">GPS Location</option>
                </optgroup>
                <optgroup label="Advanced">
                  <option value="calculate">Calculate</option>
                  <option value="barcode">Barcode / QR</option>
                  <option value="note">Note</option>
                  <option value="rating">Rating</option>
                  <option value="range">Range Slider</option>
                  <option value="likert">Likert Scale</option>
                  <option value="ranking">Ranking</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </optgroup>
              </select>
            </div>

            {/* Field ID (read-only) */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Field ID</label>
              <Input value={field.id} readOnly className="text-xs h-7 font-mono bg-muted/50" />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
