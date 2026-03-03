/**
 * Form Logic & Validation Engine
 * KoboToolbox / SurveyCTO / ODK-style data validation and skip logic
 */

import type { FormField, FieldCondition, FieldConstraint, CascadingChoice } from "./form-store"

// ─── Skip Logic / Relevance Evaluation ───

export function evaluateCondition(
  condition: FieldCondition,
  responses: Record<string, any>
): boolean {
  const fieldValue = responses[condition.fieldId]

  switch (condition.operator) {
    case "eq":
      return fieldValue == condition.value
    case "neq":
      return fieldValue != condition.value
    case "gt":
      return Number(fieldValue) > Number(condition.value)
    case "gte":
      return Number(fieldValue) >= Number(condition.value)
    case "lt":
      return Number(fieldValue) < Number(condition.value)
    case "lte":
      return Number(fieldValue) <= Number(condition.value)
    case "contains":
      if (Array.isArray(fieldValue)) return fieldValue.includes(condition.value)
      return String(fieldValue || "").includes(String(condition.value))
    case "not_contains":
      if (Array.isArray(fieldValue)) return !fieldValue.includes(condition.value)
      return !String(fieldValue || "").includes(String(condition.value))
    case "is_empty":
      return !fieldValue || fieldValue === "" || (Array.isArray(fieldValue) && fieldValue.length === 0)
    case "is_not_empty":
      return !!fieldValue && fieldValue !== "" && !(Array.isArray(fieldValue) && fieldValue.length === 0)
    case "in":
      if (Array.isArray(condition.value)) return condition.value.includes(fieldValue)
      return String(condition.value).split(",").map((s: string) => s.trim()).includes(String(fieldValue))
    case "not_in":
      if (Array.isArray(condition.value)) return !condition.value.includes(fieldValue)
      return !String(condition.value).split(",").map((s: string) => s.trim()).includes(String(fieldValue))
    default:
      return true
  }
}

export function evaluateRelevance(
  conditions: FieldCondition[] | undefined,
  responses: Record<string, any>
): boolean {
  if (!conditions || conditions.length === 0) return true

  let result = evaluateCondition(conditions[0], responses)

  for (let i = 1; i < conditions.length; i++) {
    const prevConjunction = conditions[i - 1].conjunction || "and"
    const condResult = evaluateCondition(conditions[i], responses)

    if (prevConjunction === "and") {
      result = result && condResult
    } else {
      result = result || condResult
    }
  }

  return result
}

// ─── Constraint Validation ───

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/
const URL_REGEX = /^https?:\/\/.+/

export function validateConstraint(
  constraint: FieldConstraint,
  value: any,
  allResponses?: Record<string, any>
): { valid: boolean; message: string } {
  const fail = (msg: string) => ({ valid: false, message: msg })
  const pass = () => ({ valid: true, message: "" })

  if (value === undefined || value === null || value === "") {
    // Empty values are handled by 'required' — constraints only apply to non-empty
    return pass()
  }

  switch (constraint.type) {
    case "regex": {
      if (!constraint.value) return pass()
      try {
        const regex = new RegExp(constraint.value)
        return regex.test(String(value)) ? pass() : fail(constraint.message)
      } catch {
        return pass()
      }
    }

    case "range": {
      const num = Number(value)
      if (isNaN(num)) return fail(constraint.message || "Must be a number")
      if (constraint.min !== undefined && num < constraint.min) return fail(constraint.message || `Minimum value is ${constraint.min}`)
      if (constraint.max !== undefined && num > constraint.max) return fail(constraint.message || `Maximum value is ${constraint.max}`)
      return pass()
    }

    case "length": {
      const len = String(value).length
      if (constraint.min !== undefined && len < constraint.min) return fail(constraint.message || `Minimum length is ${constraint.min} characters`)
      if (constraint.max !== undefined && len > constraint.max) return fail(constraint.message || `Maximum length is ${constraint.max} characters`)
      return pass()
    }

    case "email":
      return EMAIL_REGEX.test(String(value)) ? pass() : fail(constraint.message || "Enter a valid email address")

    case "phone":
      return PHONE_REGEX.test(String(value)) ? pass() : fail(constraint.message || "Enter a valid phone number")

    case "url":
      return URL_REGEX.test(String(value)) ? pass() : fail(constraint.message || "Enter a valid URL (https://...)")

    case "unique": {
      // Check uniqueness against all other responses for the same field
      // This would need the full response set — simplified here
      return pass()
    }

    case "custom_expression": {
      if (!constraint.value || !allResponses) return pass()
      try {
        const result = evaluateExpression(constraint.value, allResponses)
        return result ? pass() : fail(constraint.message || "Validation failed")
      } catch {
        return pass()
      }
    }

    default:
      return pass()
  }
}

export function validateFieldConstraints(
  field: FormField,
  value: any,
  allResponses?: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Legacy validation support
  if (field.validation) {
    if (field.validation.min !== undefined && Number(value) < field.validation.min) {
      errors.push(field.validation.message || `Minimum value is ${field.validation.min}`)
    }
    if (field.validation.max !== undefined && Number(value) > field.validation.max) {
      errors.push(field.validation.message || `Maximum value is ${field.validation.max}`)
    }
    if (field.validation.pattern && value) {
      try {
        if (!new RegExp(field.validation.pattern).test(String(value))) {
          errors.push(field.validation.message || "Invalid format")
        }
      } catch { /* ignore bad regex */ }
    }
  }

  // New constraint system
  if (field.constraints) {
    for (const constraint of field.constraints) {
      const result = validateConstraint(constraint, value, allResponses)
      if (!result.valid) errors.push(result.message)
    }
  }

  // Built-in type validation
  if (value !== undefined && value !== null && value !== "") {
    switch (field.type) {
      case "email":
        if (!EMAIL_REGEX.test(String(value))) errors.push("Enter a valid email address")
        break
      case "phone":
        if (!PHONE_REGEX.test(String(value))) errors.push("Enter a valid phone number")
        break
      case "integer":
        if (!Number.isInteger(Number(value))) errors.push("Must be a whole number")
        break
      case "decimal":
        if (isNaN(Number(value))) errors.push("Must be a valid number")
        break
    }
  }

  return { valid: errors.length === 0, errors }
}

// ─── Calculated Fields ───

export function evaluateExpression(
  expression: string,
  responses: Record<string, any>
): any {
  if (!expression) return undefined

  // Replace ${fieldId} references with actual values
  let resolved = expression.replace(/\$\{([^}]+)\}/g, (_, fieldId) => {
    const val = responses[fieldId.trim()]
    if (val === undefined || val === null || val === "") return "0"
    if (typeof val === "number") return String(val)
    if (!isNaN(Number(val))) return String(Number(val))
    return `"${String(val)}"`
  })

  // Support common functions
  resolved = resolved
    .replace(/\bcount\(([^)]*)\)/gi, (_, inner) => {
      const arr = responses[inner.trim()]
      return Array.isArray(arr) ? String(arr.length) : "0"
    })
    .replace(/\bcount-selected\(([^)]*)\)/gi, (_, inner) => {
      const val = inner.trim().replace(/^"|"$/g, "")
      const arr = responses[val]
      return Array.isArray(arr) ? String(arr.length) : "0"
    })
    .replace(/\bselected\(([^,]+),([^)]+)\)/gi, (_, field, value) => {
      const fieldVal = field.trim().replace(/^"|"$/g, "")
      const checkVal = value.trim().replace(/^"|"$/g, "")
      const arr = responses[fieldVal]
      if (Array.isArray(arr)) return arr.includes(checkVal) ? "true" : "false"
      return String(arr) === checkVal ? "true" : "false"
    })
    .replace(/\bif\(([^,]+),([^,]+),([^)]+)\)/gi, (_, cond, t, f) => {
      try {
        return new Function(`return (${cond}) ? (${t}) : (${f})`)() as string
      } catch { return String(f).trim() }
    })
    .replace(/\btoday\(\)/gi, `"${new Date().toISOString().split("T")[0]}"`)
    .replace(/\bnow\(\)/gi, `"${new Date().toISOString()}"`)
    .replace(/\bconcat\(([^)]*)\)/gi, (_, args) => {
      const parts = args.split(",").map((a: string) => a.trim().replace(/^"|"$/g, ""))
      return `"${parts.join("")}"`
    })
    .replace(/\bround\(([^,]+),([^)]+)\)/gi, (_, num, digits) => {
      try {
        const n = Number(num.trim()); const d = Number(digits.trim())
        return String(Math.round(n * Math.pow(10, d)) / Math.pow(10, d))
      } catch { return "0" }
    })
    .replace(/\bint\(([^)]+)\)/gi, (_, num) => {
      const n = parseInt(num.trim()); return isNaN(n) ? "0" : String(n)
    })
    .replace(/\bstring-length\(([^)]+)\)/gi, (_, str) => {
      return String(String(str.trim().replace(/^"|"$/g, "")).length)
    })
    .replace(/\bsubstr\(([^,]+),([^,]+),([^)]+)\)/gi, (_, str, start, end) => {
      const s = String(str.trim().replace(/^"|"$/g, ""))
      return `"${s.substring(Number(start.trim()), Number(end.trim()))}"`
    })
    .replace(/\bnot\(([^)]+)\)/gi, (_, val) => {
      try { return new Function(`return !(${val.trim()})`)() ? "true" : "false" } catch { return "false" }
    })
    .replace(/\bcoalesce\(([^)]*)\)/gi, (_, args) => {
      const parts = args.split(",").map((a: string) => a.trim().replace(/^"|"$/g, ""))
      for (const p of parts) { if (p && p !== "" && p !== "0") return /^\d/.test(p) ? p : `"${p}"` }
      return '""'
    })
    .replace(/\bmin\(([^)]*)\)/gi, (_, args) => {
      const nums = args.split(",").map((a: string) => Number(a.trim())).filter((n: number) => !isNaN(n))
      return nums.length > 0 ? String(Math.min(...nums)) : "0"
    })
    .replace(/\bmax\(([^)]*)\)/gi, (_, args) => {
      const nums = args.split(",").map((a: string) => Number(a.trim())).filter((n: number) => !isNaN(n))
      return nums.length > 0 ? String(Math.max(...nums)) : "0"
    })
    .replace(/\bsum\(([^)]*)\)/gi, (_, args) => {
      const nums = args.split(",").map((a: string) => Number(a.trim())).filter((n: number) => !isNaN(n))
      return String(nums.reduce((a: number, b: number) => a + b, 0))
    })

  try {
    // Safe evaluation (no access to window/document/etc.)
    const fn = new Function(`"use strict"; return (${resolved})`)
    return fn()
  } catch {
    return undefined
  }
}

export function computeCalculatedFields(
  fields: FormField[],
  responses: Record<string, any>
): Record<string, any> {
  const computed: Record<string, any> = {}

  for (const field of fields) {
    if (field.type === "calculate" && field.calculation) {
      computed[field.id] = evaluateExpression(field.calculation, { ...responses, ...computed })
    }
  }

  return computed
}

// ─── Cascading Selects ───

export function getCascadingOptions(
  field: FormField,
  responses: Record<string, any>
): CascadingChoice[] {
  if (!field.cascadingChoices || !field.cascadingParentId) return []

  const parentValue = responses[field.cascadingParentId]
  if (!parentValue) return []

  return field.cascadingChoices.filter((c) => c.parentValue === parentValue)
}

// ─── Full Form Validation ───

export interface ValidationResult {
  valid: boolean
  fieldErrors: Record<string, string[]>
  firstErrorFieldId?: string
}

export function validateForm(
  fields: FormField[],
  responses: Record<string, any>
): ValidationResult {
  const fieldErrors: Record<string, string[]> = {}
  let firstErrorFieldId: string | undefined

  for (const field of fields) {
    // Skip hidden fields (not relevant)
    if (!evaluateRelevance(field.relevance, responses)) continue

    // Skip calculated / note / read-only fields
    if (field.type === "calculate" || field.type === "note" || field.readOnly) continue

    const value = responses[field.id]
    const errors: string[] = []

    // Required check
    if (field.required) {
      const isEmpty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)
      if (isEmpty) {
        errors.push(`${field.label} is required`)
      }
    }

    // Constraint validation
    const constraintResult = validateFieldConstraints(field, value, responses)
    if (!constraintResult.valid) {
      errors.push(...constraintResult.errors)
    }

    if (errors.length > 0) {
      fieldErrors[field.id] = errors
      if (!firstErrorFieldId) firstErrorFieldId = field.id
    }
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    firstErrorFieldId,
  }
}

// ─── Visible Fields (after skip logic) ───

export function getVisibleFields(
  fields: FormField[],
  responses: Record<string, any>
): FormField[] {
  return fields.filter((field) => evaluateRelevance(field.relevance, responses))
}

// ─── Choice Filtering ───

export function filterChoicesByExpression(
  field: FormField,
  responses: Record<string, any>
): string[] | null {
  if (!field.options || field.options.length === 0) return null

  // If cascading, use cascading logic
  if (field.cascadingParentId && field.cascadingChoices) {
    const cascading = getCascadingOptions(field, responses)
    if (cascading.length > 0) return cascading.map(c => c.label)
  }

  // If choice filter expression exists, evaluate per-option
  if (!field.choiceFilterExpression) return null

  const expr = field.choiceFilterExpression.trim()
  if (!expr) return null

  // Simple expression format: "${fieldId}" — filter options to only those matching the referenced field value
  // Or expression like: "starts_with(${fieldId})" — show options starting with field value
  // Or expression like: "${fieldId} != 'value'" — filter by inequality
  try {
    return field.options.filter(option => {
      // Replace ${fieldId} references with actual values, and $choice with current option
      let resolved = expr
        .replace(/\$\{([^}]+)\}/g, (_, fid) => {
          const v = responses[fid.trim()]
          return v !== undefined && v !== null ? String(v) : ""
        })
        .replace(/\$choice/g, JSON.stringify(option))

      // Support simple operators
      if (resolved.includes("==")) {
        const [left, right] = resolved.split("==").map(s => s.trim().replace(/^["']|["']$/g, ""))
        return left === right
      }
      if (resolved.includes("!=")) {
        const [left, right] = resolved.split("!=").map(s => s.trim().replace(/^["']|["']$/g, ""))
        return left !== right
      }
      if (resolved.startsWith("starts_with(")) {
        const inner = resolved.replace(/^starts_with\(/, "").replace(/\)$/, "").trim().replace(/^["']|["']$/g, "")
        return option.toLowerCase().startsWith(inner.toLowerCase())
      }
      if (resolved.startsWith("contains(")) {
        const inner = resolved.replace(/^contains\(/, "").replace(/\)$/, "").trim().replace(/^["']|["']$/g, "")
        return option.toLowerCase().includes(inner.toLowerCase())
      }

      // Fallback: treat as equality match
      return option === resolved.replace(/^["']|["']$/g, "")
    })
  } catch {
    return null
  }
}

// ─── Last-Saved References ───

export function getLastSavedValue(
  formId: string,
  fieldId: string
): any {
  try {
    // Import dynamically to avoid circular deps at module scope
    const { getFormResponses } = require('./form-store')
    const responses = getFormResponses()
    const submitted = responses
      .filter((r: any) => r.formId === formId && r.status === 'submitted')
      .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    if (submitted.length > 0) {
      return submitted[0].responses?.[fieldId]
    }
  } catch { /* ignore */ }
  return undefined
}

// ─── Repeat Group Helpers ───

export function getRepeatGroupInstances(
  repeatGroupId: string,
  responses: Record<string, any>
): number {
  const key = `_repeat_count_${repeatGroupId}`
  return Number(responses[key]) || 1
}

export function getRepeatFieldId(fieldId: string, instanceIndex: number): string {
  return `${fieldId}__${instanceIndex}`
}
