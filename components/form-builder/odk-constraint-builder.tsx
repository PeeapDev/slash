"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"
import { FieldConstraint } from "@/lib/form-store"

const constraintTypeLabels: Record<FieldConstraint["type"], string> = {
  range: "Number Range",
  length: "Text Length",
  regex: "Regex Pattern",
  email: "Email Format",
  phone: "Phone Format",
  url: "URL Format",
  unique: "Must Be Unique",
  custom_expression: "Custom Expression",
}

interface OdkConstraintBuilderProps {
  constraints: FieldConstraint[]
  onChange: (constraints: FieldConstraint[]) => void
}

export default function OdkConstraintBuilder({
  constraints,
  onChange,
}: OdkConstraintBuilderProps) {
  const addConstraint = () => {
    const newConstraint: FieldConstraint = {
      type: "range",
      message: "",
    }
    onChange([...constraints, newConstraint])
  }

  const updateConstraint = (index: number, updates: Partial<FieldConstraint>) => {
    const updated = constraints.map((c, i) => (i === index ? { ...c, ...updates } : c))
    onChange(updated)
  }

  const removeConstraint = (index: number) => {
    onChange(constraints.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {constraints.map((constraint, idx) => (
        <div key={idx} className="p-2 rounded-md bg-muted/50 border space-y-1.5">
          <div className="flex gap-1 items-start">
            <div className="flex-1 space-y-1.5">
              {/* Type selector */}
              <select
                value={constraint.type}
                onChange={(e) => updateConstraint(idx, {
                  type: e.target.value as FieldConstraint["type"],
                  min: undefined,
                  max: undefined,
                  value: undefined,
                })}
                className="w-full h-7 text-xs border rounded bg-background px-1.5"
              >
                {(Object.keys(constraintTypeLabels) as FieldConstraint["type"][]).map(t => (
                  <option key={t} value={t}>{constraintTypeLabels[t]}</option>
                ))}
              </select>

              {/* Type-specific inputs */}
              {(constraint.type === "range" || constraint.type === "length") && (
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Min</label>
                    <Input
                      type="number"
                      value={constraint.min ?? ""}
                      onChange={(e) => updateConstraint(idx, { min: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="Min"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Max</label>
                    <Input
                      type="number"
                      value={constraint.max ?? ""}
                      onChange={(e) => updateConstraint(idx, { max: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="Max"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              )}

              {constraint.type === "regex" && (
                <Input
                  value={constraint.value || ""}
                  onChange={(e) => updateConstraint(idx, { value: e.target.value })}
                  placeholder="Regex pattern, e.g. ^[A-Z]{2}-\d{3}$"
                  className="h-7 text-xs font-mono"
                />
              )}

              {constraint.type === "custom_expression" && (
                <Input
                  value={constraint.value || ""}
                  onChange={(e) => updateConstraint(idx, { value: e.target.value })}
                  placeholder="Custom expression"
                  className="h-7 text-xs font-mono"
                />
              )}

              {/* Error message */}
              <Input
                value={constraint.message}
                onChange={(e) => updateConstraint(idx, { message: e.target.value })}
                placeholder="Error message shown when invalid"
                className="h-7 text-xs"
              />
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => removeConstraint(idx)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}

      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs h-7"
        onClick={addConstraint}
      >
        <Plus className="w-3 h-3 mr-1" />
        Add Constraint
      </Button>
    </div>
  )
}
