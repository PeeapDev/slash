"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { FieldCondition, FormField } from "@/lib/form-store"

const operatorLabels: Record<FieldCondition["operator"], string> = {
  eq: "equals",
  neq: "not equals",
  gt: "greater than",
  gte: "greater or equal",
  lt: "less than",
  lte: "less or equal",
  contains: "contains",
  not_contains: "not contains",
  is_empty: "is empty",
  is_not_empty: "is not empty",
  in: "is in",
  not_in: "not in",
}

const operatorsByFieldType: Record<string, FieldCondition["operator"][]> = {
  text: ["eq", "neq", "contains", "not_contains", "is_empty", "is_not_empty"],
  integer: ["eq", "neq", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"],
  decimal: ["eq", "neq", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"],
  number: ["eq", "neq", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"],
  select: ["eq", "neq", "in", "not_in", "is_empty", "is_not_empty"],
  radio: ["eq", "neq", "in", "not_in", "is_empty", "is_not_empty"],
  checkbox: ["contains", "not_contains", "is_empty", "is_not_empty"],
  date: ["eq", "neq", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"],
  time: ["eq", "neq", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"],
  default: ["eq", "neq", "is_empty", "is_not_empty"],
}

function getOperatorsForType(type: string): FieldCondition["operator"][] {
  return operatorsByFieldType[type] || operatorsByFieldType.default
}

interface OdkSkipLogicBuilderProps {
  conditions: FieldCondition[]
  availableFields: FormField[]
  onChange: (conditions: FieldCondition[]) => void
}

export default function OdkSkipLogicBuilder({
  conditions,
  availableFields,
  onChange,
}: OdkSkipLogicBuilderProps) {
  const addCondition = () => {
    const newCondition: FieldCondition = {
      fieldId: availableFields.length > 0 ? availableFields[0].id : "",
      operator: "eq",
      value: "",
      conjunction: conditions.length > 0 ? "and" : undefined,
    }
    onChange([...conditions, newCondition])
  }

  const updateCondition = (index: number, updates: Partial<FieldCondition>) => {
    const updated = conditions.map((c, i) => (i === index ? { ...c, ...updates } : c))
    onChange(updated)
  }

  const removeCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index)
    // Clear conjunction on first remaining condition
    if (updated.length > 0 && updated[0].conjunction) {
      updated[0] = { ...updated[0], conjunction: undefined }
    }
    onChange(updated)
  }

  const noValueOperators: FieldCondition["operator"][] = ["is_empty", "is_not_empty"]

  return (
    <div className="space-y-2">
      {conditions.map((condition, idx) => {
        const refField = availableFields.find(f => f.id === condition.fieldId)
        const operators = refField ? getOperatorsForType(refField.type) : getOperatorsForType("default")
        const isChoiceField = refField && ["select", "radio", "checkbox"].includes(refField.type)
        const hideValue = noValueOperators.includes(condition.operator)

        return (
          <div key={idx} className="space-y-1.5">
            {/* Conjunction */}
            {idx > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={() => updateCondition(idx, { conjunction: condition.conjunction === "and" ? "or" : "and" })}
                  className="text-[10px] font-semibold uppercase px-3 py-0.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  {condition.conjunction || "and"}
                </button>
              </div>
            )}

            <div className="flex gap-1 items-start p-2 rounded-md bg-muted/50 border">
              <div className="flex-1 space-y-1.5">
                {/* Field selector */}
                <select
                  value={condition.fieldId}
                  onChange={(e) => updateCondition(idx, { fieldId: e.target.value, value: "" })}
                  className="w-full h-7 text-xs border rounded bg-background px-1.5"
                >
                  <option value="">Select field...</option>
                  {availableFields.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.label || f.id}
                    </option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(idx, { operator: e.target.value as FieldCondition["operator"] })}
                  className="w-full h-7 text-xs border rounded bg-background px-1.5"
                >
                  {operators.map(op => (
                    <option key={op} value={op}>{operatorLabels[op]}</option>
                  ))}
                </select>

                {/* Value input */}
                {!hideValue && (
                  isChoiceField && refField?.options ? (
                    <select
                      value={condition.value || ""}
                      onChange={(e) => updateCondition(idx, { value: e.target.value })}
                      className="w-full h-7 text-xs border rounded bg-background px-1.5"
                    >
                      <option value="">Select value...</option>
                      {refField.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={condition.value || ""}
                      onChange={(e) => updateCondition(idx, { value: e.target.value })}
                      placeholder="Value"
                      className="h-7 text-xs"
                    />
                  )
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeCondition(idx)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )
      })}

      {availableFields.length === 0 && conditions.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          No preceding fields available. Skip logic can only reference fields that appear before this question.
        </p>
      )}

      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs h-7"
        onClick={addCondition}
        disabled={availableFields.length === 0}
      >
        <Plus className="w-3 h-3 mr-1" />
        Add Condition
      </Button>
    </div>
  )
}
