"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useParams, useSearchParams } from "next/navigation"
import type { Form, FormField, FormGroupMeta } from "@/lib/form-store"
import { getFormById, getFormResponses, saveFormResponses, updateFormResponse } from "@/lib/form-store"
import {
  evaluateRelevance,
  validateFieldConstraints,
  computeCalculatedFields,
  getCascadingOptions,
  validateForm as validateFormEngine,
  getVisibleFields,
  filterChoicesByExpression,
  getRepeatFieldId,
} from "@/lib/form-logic-engine"

// ─── Text styling helper: parse **bold**, *italic*, [links](url) ───
function renderStyledText(text: string) {
  if (!text) return null
  const parts: (string | JSX.Element)[] = []
  let remaining = text
  let key = 0
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index))
    }
    if (match[1]) parts.push(<strong key={key++}>{match[1]}</strong>)
    else if (match[2]) parts.push(<em key={key++}>{match[2]}</em>)
    else if (match[3] && match[4]) parts.push(<a key={key++} href={match[4]} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{match[3]}</a>)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < remaining.length) parts.push(remaining.slice(lastIndex))
  return <>{parts}</>
}

// ─── Fisher-Yates shuffle (seeded by fieldId for session consistency) ───
function shuffleOptions(options: string[], seed: string): string[] {
  const arr = [...options]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  const random = () => { hash = (hash * 1103515245 + 12345) & 0x7fffffff; return hash / 0x7fffffff }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ─── Audit log event type ───
interface AuditEvent {
  type: 'form_open' | 'field_change' | 'constraint_violation' | 'save_draft' | 'submit'
  timestamp: string
  fieldId?: string
  oldValue?: any
  newValue?: any
  details?: string
}

// ─── Dynamic section derived from form groups ───
interface DynamicSection {
  id: string
  label: string
  description?: string
  fields: FormField[]
  isFieldList?: boolean
}

function buildSections(form: Form, visibleFields: FormField[]): DynamicSection[] {
  const visibleIds = new Set(visibleFields.map(f => f.id))
  const groups = form.groups || []

  if (groups.length === 0) {
    const fields = visibleFields.filter(f => !f.repeatGroupId)
    return fields.length > 0
      ? [{ id: "survey", label: "Survey Questions", description: `${form.type === "survey" ? "Survey" : "Collection"} form`, fields }]
      : [{ id: "survey", label: "Survey Questions", fields: [] }]
  }

  const sections: DynamicSection[] = []
  const usedFieldIds = new Set<string>()

  // Check for field-list groups — these get merged into the preceding/following section
  const fieldListGroupIds = new Set(groups.filter(g => g.appearance === 'field-list').map(g => g.id))

  for (const group of groups) {
    const groupFields = form.fields.filter(
      f => f.groupId === group.id && !f.repeatGroupId && visibleIds.has(f.id)
    )
    groupFields.forEach(f => usedFieldIds.add(f.id))
    if (groupFields.length > 0) {
      sections.push({
        id: group.id,
        label: group.label,
        description: group.description,
        fields: groupFields,
        isFieldList: fieldListGroupIds.has(group.id),
      })
    }
  }

  // Merge field-list sections into their neighbors
  const merged: DynamicSection[] = []
  for (const section of sections) {
    if (section.isFieldList && merged.length > 0) {
      merged[merged.length - 1].fields.push(...section.fields)
    } else {
      merged.push(section)
    }
  }

  const ungrouped = visibleFields.filter(
    f => !f.groupId && !f.repeatGroupId && !usedFieldIds.has(f.id)
  )
  if (ungrouped.length > 0) {
    merged.push({ id: "general", label: "General", fields: ungrouped })
  }

  return merged.length > 0 ? merged : [{ id: "survey", label: "Survey Questions", fields: [] }]
}

export default function PublicFormPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const formId = params?.id as string
  const editResponseId = searchParams?.get('responseId') || null

  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const [repeatCounts, setRepeatCounts] = useState<Record<string, number>>({})
  const [activeLanguage, setActiveLanguage] = useState<string>('')
  const [expandedGuidance, setExpandedGuidance] = useState<Set<string>>(new Set())

  // Audit log
  const auditLogRef = useRef<AuditEvent[]>([])

  // Invisible time tracking
  const startedAtRef = useRef(new Date().toISOString())

  // Device ID from IndexedDB
  const deviceIdRef = useRef('unknown')
  useEffect(() => {
    (async () => {
      try {
        const { indexedDBService } = await import('@/lib/indexdb-service')
        const stored = await indexedDBService.get<{ id: string; value: string }>('app_settings', 'slash_device_id')
        if (stored?.value) deviceIdRef.current = stored.value
        else {
          const newId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          deviceIdRef.current = newId
          await indexedDBService.set('app_settings', { id: 'slash_device_id', value: newId })
        }
      } catch { /* ignore */ }
    })()
  }, [])

  // Signature canvas refs
  const signatureCanvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const signatureDrawingRef = useRef<Record<string, boolean>>({})

  // Load form: try local IndexedDB first, then server
  useEffect(() => {
    if (!formId) return

    const initForm = (found: Form) => {
      setForm(found)
      if (found.defaultLanguage) setActiveLanguage(found.defaultLanguage)
      else if (found.languages?.length) setActiveLanguage(found.languages[0])

      if (editResponseId) {
        const allResponses = getFormResponses()
        const existing = allResponses.find(r => r.id === editResponseId)
        if (existing) {
          setResponses(existing.responses || {})
        }
      }

      if (found.repeatGroups?.length) {
        const counts: Record<string, number> = {}
        found.repeatGroups.forEach(rg => { counts[rg.id] = rg.repeatMin || 1 })
        setRepeatCounts(counts)
      }

      auditLogRef.current.push({ type: 'form_open', timestamp: new Date().toISOString() })
    }

    // Try local first
    const found = getFormById(formId)
    if (found) {
      initForm(found)
      setLoading(false)
      return
    }

    // Not found locally — try server
    fetch(`/api/forms?id=${encodeURIComponent(formId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success && data.form) {
          initForm(data.form as Form)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [formId, editResponseId])

  // ─── Computed values from calculated fields ───
  const computedValues = form ? computeCalculatedFields(form.fields, responses) : {}
  const allResponses = { ...responses, ...computedValues }

  // ─── Visible fields (skip logic applied) ───
  const visibleFields = form ? getVisibleFields(form.fields, allResponses) : []

  // ─── Build dynamic sections ───
  const sections = useMemo(
    () => (form ? buildSections(form, visibleFields) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, JSON.stringify(visibleFields.map(f => f.id))]
  )

  const safeIndex = Math.min(activeSectionIndex, Math.max(sections.length - 1, 0))
  const activeSection = sections[safeIndex] || null

  // ─── Get label/hint with language support ───
  const getLabel = (field: FormField) => {
    if (activeLanguage && field.translations?.[activeLanguage]?.label) {
      return field.translations[activeLanguage].label
    }
    return field.label
  }
  const getHint = (field: FormField) => {
    if (activeLanguage && field.translations?.[activeLanguage]?.hint) {
      return field.translations[activeLanguage].hint
    }
    return field.hint
  }
  const getGuidanceHint = (field: FormField) => {
    if (activeLanguage && field.translations?.[activeLanguage]?.guidanceHint) {
      return field.translations[activeLanguage].guidanceHint
    }
    return field.guidanceHint
  }
  const getOptions = (field: FormField): string[] => {
    let opts = (activeLanguage && field.translations?.[activeLanguage]?.options) || field.options || []

    // Apply choice filter
    const filtered = filterChoicesByExpression(field, allResponses)
    if (filtered) opts = filtered

    // Add "Other" if orOther
    if (field.orOther && !opts.includes('Other')) {
      opts = [...opts, 'Other']
    }

    // Randomize if specified
    if (field.randomizeChoices) {
      opts = shuffleOptions(opts, field.id)
    }

    return opts
  }

  // ─── Field handlers ───
  const handleFieldChange = (fieldId: string, value: any) => {
    // Audit: field change
    auditLogRef.current.push({
      type: 'field_change',
      timestamp: new Date().toISOString(),
      fieldId,
      oldValue: responses[fieldId],
      newValue: value,
    })

    setResponses((prev) => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) setErrors((prev) => ({ ...prev, [fieldId]: "" }))

    // Auto-advance for "quick" appearance
    if (form) {
      const field = form.fields.find(f => f.id === fieldId)
      if (field?.appearance === 'quick' && (field.type === 'radio' || field.type === 'select')) {
        // Auto-advance to next section after short delay
        setTimeout(() => {
          if (safeIndex < sections.length - 1) {
            setActiveSectionIndex(safeIndex + 1)
          }
        }, 300)
      }
    }
  }

  // ─── Inline constraint validation (on blur) ───
  const handleFieldBlur = (field: FormField) => {
    const value = allResponses[field.id]
    if (value === undefined || value === null || value === "") return
    const result = validateFieldConstraints(field, value, allResponses)
    if (!result.valid) {
      setErrors((prev) => ({ ...prev, [field.id]: result.errors[0] }))
      auditLogRef.current.push({
        type: 'constraint_violation',
        timestamp: new Date().toISOString(),
        fieldId: field.id,
        details: result.errors[0],
      })
    }
  }

  const validateAll = (): boolean => {
    if (!form) return false
    const newErrors: Record<string, string> = {}
    let valid = true

    const engineResult = validateFormEngine(form.fields, allResponses)
    if (!engineResult.valid) {
      valid = false
      for (const [fieldId, fieldErrors] of Object.entries(engineResult.fieldErrors)) {
        newErrors[fieldId] = fieldErrors[0]
      }
    }

    // Validate repeat group instances
    const repeatGroups = form.repeatGroups || []
    for (const rg of repeatGroups) {
      const repeatFields = form.fields.filter(f => f.repeatGroupId === rg.id)
      const count = repeatCounts[rg.id] || 1
      for (let i = 0; i < count; i++) {
        for (const field of repeatFields) {
          const key = getRepeatFieldId(field.id, i)
          if (field.required) {
            const val = allResponses[key]
            if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
              newErrors[key] = `${getLabel(field)} is required`
              valid = false
            }
          }
        }
      }
    }

    setErrors(newErrors)
    if (!valid) {
      const firstErrorId = Object.keys(newErrors)[0]
      if (firstErrorId) {
        const errorSectionIdx = sections.findIndex(s => s.fields.some(f => f.id === firstErrorId))
        if (errorSectionIdx >= 0) setActiveSectionIndex(errorSectionIdx)
      }
    }
    return valid
  }

  // ─── Metadata ───
  const buildMetadata = () => ({
    deviceId: deviceIdRef.current,
    startedAt: startedAtRef.current,
    completedAt: new Date().toISOString(),
    today: new Date().toISOString().split('T')[0],
    source: "external_link",
  })

  const handleSubmit = () => {
    if (!validateAll() || !form) return
    setIsSubmitting(true)

    auditLogRef.current.push({ type: 'submit', timestamp: new Date().toISOString() })

    try {
      if (editResponseId) {
        // Update existing response
        updateFormResponse(editResponseId, {
          responses: allResponses,
          submittedAt: new Date().toISOString(),
          status: 'submitted',
        })
      } else {
        const savedResponses = getFormResponses()
        savedResponses.push({
          id: `resp-ext-${Date.now()}`,
          formId: form.id,
          responses: allResponses,
          metadata: buildMetadata(),
          auditLog: auditLogRef.current,
          submittedBy: "External Respondent",
          submittedAt: new Date().toISOString(),
          status: "submitted",
        } as any)
        saveFormResponses(savedResponses)
      }
      setSubmitted(true)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    if (!form) return

    auditLogRef.current.push({ type: 'save_draft', timestamp: new Date().toISOString() })

    try {
      if (editResponseId) {
        updateFormResponse(editResponseId, {
          responses: allResponses,
          status: 'draft',
        })
      } else {
        const savedDrafts = getFormResponses()
        savedDrafts.push({
          id: `resp-ext-${Date.now()}`,
          formId: form.id,
          responses: allResponses,
          metadata: { ...buildMetadata(), savedAt: new Date().toISOString() },
          auditLog: auditLogRef.current,
          submittedBy: "External Respondent",
          submittedAt: new Date().toISOString(),
          status: "draft",
        } as any)
        saveFormResponses(savedDrafts)
      }
      setSubmitted(true)
    } catch (error) {
      console.error("Error saving draft:", error)
    }
  }

  // ─── Repeat group helpers ───
  const addRepeatInstance = (repeatGroupId: string) => {
    const rg = form?.repeatGroups?.find(r => r.id === repeatGroupId)
    const max = rg?.repeatMax
    const current = repeatCounts[repeatGroupId] || 1
    if (max && current >= max) return
    setRepeatCounts(prev => ({ ...prev, [repeatGroupId]: current + 1 }))
  }

  const removeRepeatInstance = (repeatGroupId: string) => {
    const rg = form?.repeatGroups?.find(r => r.id === repeatGroupId)
    const min = rg?.repeatMin || 1
    const current = repeatCounts[repeatGroupId] || 1
    if (current <= min) return
    // Remove responses for the last instance
    const fields = form?.fields.filter(f => f.repeatGroupId === repeatGroupId) || []
    const lastIndex = current - 1
    setResponses(prev => {
      const next = { ...prev }
      fields.forEach(f => { delete next[getRepeatFieldId(f.id, lastIndex)] })
      return next
    })
    setRepeatCounts(prev => ({ ...prev, [repeatGroupId]: current - 1 }))
  }

  // ─── Signature canvas helpers ───
  const initSignatureCanvas = (canvas: HTMLCanvasElement | null, fieldId: string) => {
    signatureCanvasRefs.current[fieldId] = canvas
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      return { x: clientX - rect.left, y: clientY - rect.top }
    }

    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      signatureDrawingRef.current[fieldId] = true
      const pos = getPos(e)
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    }
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!signatureDrawingRef.current[fieldId]) return
      e.preventDefault()
      const pos = getPos(e)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
    const endDraw = () => {
      signatureDrawingRef.current[fieldId] = false
      handleFieldChange(fieldId, canvas.toDataURL())
    }

    canvas.addEventListener('mousedown', startDraw)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', endDraw)
    canvas.addEventListener('mouseleave', endDraw)
    canvas.addEventListener('touchstart', startDraw, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', endDraw)
  }

  const clearSignature = (fieldId: string) => {
    const canvas = signatureCanvasRefs.current[fieldId]
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    handleFieldChange(fieldId, '')
  }

  // ─── Progress ───
  const requiredVisible = visibleFields.filter(f => f.required && f.type !== "note" && f.type !== "calculate")
  const answeredRequiredCount = requiredVisible.filter(f => {
    const v = allResponses[f.id]
    return v !== "" && v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)
  }).length
  const progressPct = requiredVisible.length > 0 ? Math.round((answeredRequiredCount / requiredVisible.length) * 100) : 0

  // ─── Ranking drag handler (simplified: move up/down) ───
  const moveRankingItem = (fieldId: string, fromIdx: number, toIdx: number) => {
    const current = allResponses[fieldId] || []
    if (!Array.isArray(current) || toIdx < 0 || toIdx >= current.length) return
    const arr = [...current]
    const [item] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, item)
    handleFieldChange(fieldId, arr)
  }

  // ─── or_other text field key ───
  const otherTextKey = (fieldId: string) => `${fieldId}__other`

  // ─── Field renderer ───
  const renderField = (field: FormField, keyPrefix = '') => {
    const fid = keyPrefix ? `${keyPrefix}` : field.id
    const value = field.type === "calculate" ? (computedValues[field.id] ?? "") : (allResponses[fid] ?? "")
    const hasError = !!errors[fid]
    const inputClass = `w-full px-3 py-2.5 text-sm border rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 ${hasError ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}`
    const options = getOptions(field)
    const fieldChange = (v: any) => handleFieldChange(fid, v)

    // Cascading select
    if (field.cascadingParentId && field.cascadingChoices) {
      const opts = getCascadingOptions(field, allResponses)
      const parentVal = allResponses[field.cascadingParentId]
      return (
        <div>
          {!parentVal && <p className="text-xs text-amber-600 mb-1">Please select {form?.fields.find(f => f.id === field.cascadingParentId)?.label || "parent field"} first</p>}
          <select value={value} onChange={(e) => fieldChange(e.target.value)} className={inputClass} disabled={!parentVal}>
            <option value="">— Select —</option>
            {opts.map((c, i) => <option key={i} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      )
    }

    switch (field.type) {
      case "text":
        if (field.appearance === "signature") {
          return (
            <div className="space-y-2">
              <div className="border border-slate-300 rounded bg-white">
                <canvas ref={(el) => initSignatureCanvas(el, fid)} width={400} height={150} className="w-full cursor-crosshair touch-none" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => clearSignature(fid)} className="text-xs text-red-600 hover:underline">Clear</button>
                {value && <span className="text-xs text-green-600">Signature captured</span>}
              </div>
            </div>
          )
        }
        return field.appearance === "multiline"
          ? <textarea value={value} onChange={(e) => fieldChange(e.target.value)} onBlur={() => handleFieldBlur(field)} placeholder={field.placeholder || "Enter response"} rows={3} className={inputClass + " resize-y"} />
          : <input type="text" value={value} onChange={(e) => fieldChange(e.target.value)} onBlur={() => handleFieldBlur(field)} placeholder={field.placeholder || "Enter response"} className={inputClass} readOnly={field.readOnly} />

      case "email":
        return <input type="email" value={value} onChange={(e) => fieldChange(e.target.value)} onBlur={() => handleFieldBlur(field)} placeholder={field.placeholder || "email@example.com"} className={inputClass} />

      case "phone":
        return <input type="tel" value={value} onChange={(e) => fieldChange(e.target.value)} onBlur={() => handleFieldBlur(field)} placeholder={field.placeholder || "+1 234 567 8900"} className={inputClass} />

      case "number": case "integer": case "decimal":
        return <input type="number" value={value} onChange={(e) => fieldChange(e.target.value ? Number(e.target.value) : "")} onBlur={() => handleFieldBlur(field)} placeholder={field.placeholder} step={field.type === "decimal" ? "any" : "1"} className={inputClass} />

      case "select": {
        const showOrOther = field.orOther && value === 'Other'
        return (
          <div className="space-y-2">
            <select value={value} onChange={(e) => fieldChange(e.target.value)} className={inputClass}>
              <option value="">— Select —</option>
              {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
            </select>
            {showOrOther && (
              <input type="text" value={allResponses[otherTextKey(fid)] || ''} onChange={(e) => handleFieldChange(otherTextKey(fid), e.target.value)} placeholder="Please specify..." className={inputClass} />
            )}
          </div>
        )
      }

      case "radio": {
        const showOrOther = field.orOther && value === 'Other'
        return (
          <div className="space-y-1.5">
            <div className={`space-y-1.5 mt-1 ${field.appearance === "horizontal" ? "flex flex-wrap gap-2 space-y-0" : ""}`}>
              {options.map((opt, i) => (
                <label key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded border cursor-pointer transition-colors ${value === opt ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"} ${field.appearance === "horizontal" ? "flex-1 min-w-[120px]" : ""}`}>
                  <input type="radio" name={fid} value={opt} checked={value === opt} onChange={(e) => fieldChange(e.target.value)} className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
            {showOrOther && (
              <input type="text" value={allResponses[otherTextKey(fid)] || ''} onChange={(e) => handleFieldChange(otherTextKey(fid), e.target.value)} placeholder="Please specify..." className={inputClass} />
            )}
          </div>
        )
      }

      case "checkbox": {
        const checkedVals: string[] = value || []
        const showOrOther = field.orOther && checkedVals.includes('Other')
        return (
          <div className="space-y-1.5 mt-1">
            {options.map((opt, i) => (
              <label key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded border cursor-pointer transition-colors ${checkedVals.includes(opt) ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                <input type="checkbox" value={opt} checked={checkedVals.includes(opt)} onChange={(e) => { fieldChange(e.target.checked ? [...checkedVals, opt] : checkedVals.filter((v: string) => v !== opt)) }} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-slate-700">{opt}</span>
              </label>
            ))}
            {showOrOther && (
              <input type="text" value={allResponses[otherTextKey(fid)] || ''} onChange={(e) => handleFieldChange(otherTextKey(fid), e.target.value)} placeholder="Please specify..." className={inputClass} />
            )}
          </div>
        )
      }

      case "date":
        return <input type="date" value={value} onChange={(e) => fieldChange(e.target.value)} className={inputClass} />

      case "time":
        return <input type="time" value={value} onChange={(e) => fieldChange(e.target.value)} className={inputClass} />

      case "dateTime": {
        const dtVal = value || ''
        const [datePart, timePart] = typeof dtVal === 'string' ? dtVal.split('T') : ['', '']
        return (
          <div className="flex gap-2">
            <input type="date" value={datePart || ''} onChange={(e) => fieldChange(`${e.target.value}T${timePart || '00:00'}`)} className={inputClass} />
            <input type="time" value={(timePart || '').replace(/Z$/, '').slice(0, 5)} onChange={(e) => fieldChange(`${datePart || new Date().toISOString().split('T')[0]}T${e.target.value}`)} className={inputClass} />
          </div>
        )
      }

      case "file": case "image":
        return <input type="file" accept={field.type === "image" ? "image/*" : undefined} onChange={(e) => fieldChange(e.target.files?.[0]?.name || "")} className={inputClass} />

      case "calculate":
        return (
          <div className="px-3 py-2.5 text-sm border border-slate-200 rounded bg-slate-50 text-slate-700 font-mono">
            {value !== undefined && value !== "" ? String(value) : <span className="text-slate-400 italic">Waiting for input...</span>}
          </div>
        )

      case "note":
        return (
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900 leading-relaxed">{renderStyledText(getLabel(field))}</div>
            {field.acknowledgeLabel && (
              <label className={`flex items-center gap-3 px-3 py-2.5 rounded border cursor-pointer transition-colors ${value ? "border-green-500 bg-green-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                <input type="checkbox" checked={!!value} onChange={(e) => fieldChange(e.target.checked)} className="w-4 h-4 accent-green-600 rounded" />
                <span className="text-sm text-slate-700">{field.acknowledgeLabel}</span>
              </label>
            )}
          </div>
        )

      case "likert":
        return (
          <div className="mt-1">
            <div className="flex gap-1">
              {options.map((opt, i) => (
                <button key={i} type="button" onClick={() => fieldChange(opt)} className={`flex-1 py-2.5 px-1 text-xs text-center rounded border transition-colors ${value === opt ? "bg-blue-600 text-white border-blue-600 font-medium" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                  {opt}
                </button>
              ))}
            </div>
            {value && <p className="text-xs text-blue-600 mt-1.5 text-center font-medium">Selected: {value}</p>}
          </div>
        )

      case "rating": {
        const max = field.ratingMax || 5
        const current = Number(value) || 0
        return (
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
              <button key={star} type="button" onClick={() => fieldChange(star)} className="p-0.5 transition-transform hover:scale-110">
                <svg className={`w-8 h-8 ${star <= current ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill={star <= current ? "currentColor" : "none"}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            ))}
            {current > 0 && <span className="text-sm text-slate-500 ml-2">{current} / {max}</span>}
          </div>
        )
      }

      case "range": {
        const min = field.rangeMin ?? 0
        const max = field.rangeMax ?? 100
        const step = field.rangeStep ?? 1
        const current = value !== "" ? Number(value) : min
        return (
          <div className="space-y-2 mt-1">
            <input type="range" min={min} max={max} step={step} value={current} onChange={(e) => fieldChange(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{min}</span>
              <span className="text-sm font-medium text-blue-700">{current}</span>
              <span>{max}</span>
            </div>
          </div>
        )
      }

      case "gps":
        return (
          <div className="space-y-2">
            <input type="text" value={value} onChange={(e) => fieldChange(e.target.value)} placeholder="Latitude, Longitude" className={inputClass} />
            <button type="button" onClick={() => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition((pos) => { fieldChange(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`) }) } }} className="text-xs text-blue-600 hover:underline">
              Get current location
            </button>
          </div>
        )

      case "barcode":
        return <input type="text" value={value} onChange={(e) => fieldChange(e.target.value)} placeholder="Scan or enter barcode" className={inputClass} />

      case "ranking": {
        const items: string[] = value || options
        if (!Array.isArray(items) || items.length === 0) {
          // Initialize ranking with options
          if (options.length > 0 && (!value || !Array.isArray(value))) {
            fieldChange([...options])
          }
          return <p className="text-xs text-slate-400">No items to rank</p>
        }
        return (
          <div className="space-y-1 mt-1">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded border border-slate-200 bg-white">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                <span className="flex-1 text-sm text-slate-700">{item}</span>
                <div className="flex gap-1">
                  <button type="button" disabled={idx === 0} onClick={() => moveRankingItem(fid, idx, idx - 1)} className="w-6 h-6 rounded text-xs border border-slate-200 hover:bg-slate-50 disabled:opacity-30">&uarr;</button>
                  <button type="button" disabled={idx === items.length - 1} onClick={() => moveRankingItem(fid, idx, idx + 1)} className="w-6 h-6 rounded text-xs border border-slate-200 hover:bg-slate-50 disabled:opacity-30">&darr;</button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      default:
        return <input type="text" value={value} onChange={(e) => fieldChange(e.target.value)} onBlur={() => handleFieldBlur(field)} placeholder={field.placeholder} className={inputClass} />
    }
  }

  // ─── Render a single field with label, hint, guidance ───
  const renderFieldBlock = (field: FormField, index: number, keyPrefix = '') => {
    const fid = keyPrefix || field.id
    const isNote = field.type === "note"
    const isCalc = field.type === "calculate"
    const hasSkipLogic = field.relevance && field.relevance.length > 0
    const hasConstraints = (field.constraints && field.constraints.length > 0) || field.type === "email" || field.type === "phone"
    const hint = getHint(field)
    const guidanceHint = getGuidanceHint(field)
    const label = getLabel(field)
    const isGuidanceExpanded = expandedGuidance.has(fid)

    return (
      <div key={fid} className={`p-5 transition-colors ${errors[fid] ? "bg-red-50/50" : index % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
        <div className="flex items-start gap-2 mb-1">
          {!isNote && (
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5 ${isCalc ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
              {isCalc ? "fx" : index + 1}
            </span>
          )}
          <div className="flex-1 min-w-0">
            {!isNote && (
              <label className="block text-sm font-medium text-slate-800">
                {renderStyledText(label)}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <div className="flex flex-wrap gap-1 mt-0.5">
              {hasSkipLogic && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">Skip Logic</span>}
              {hasConstraints && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700">Validated</span>}
              {isCalc && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">Calculated</span>}
              {field.readOnly && !isCalc && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">Read Only</span>}
              {field.cascadingParentId && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-100 text-teal-700">Cascading</span>}
            </div>
            {hint && !isNote && <p className="text-xs text-slate-400 mt-1">{renderStyledText(hint)}</p>}
            {guidanceHint && (
              <div className="mt-1">
                <button type="button" onClick={() => setExpandedGuidance(prev => {
                  const next = new Set(prev)
                  next.has(fid) ? next.delete(fid) : next.add(fid)
                  return next
                })} className="text-xs text-blue-600 hover:underline">
                  {isGuidanceExpanded ? 'Hide info' : 'More info'}
                </button>
                {isGuidanceExpanded && (
                  <p className="text-xs text-slate-500 mt-1 p-2 bg-blue-50 rounded">{renderStyledText(guidanceHint)}</p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className={isNote ? "" : "ml-8 mt-2"}>
          {renderField(field, keyPrefix)}
          {errors[fid] && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
              {errors[fid]}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm">Loading form...</p>
        </div>
      </div>
    )
  }

  if (notFound || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Form Not Found</h1>
          <p className="text-slate-500 text-sm">The form you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <p className="text-xs text-slate-400 font-mono">ID: {formId}</p>
        </div>
      </div>
    )
  }

  if (form.publishStatus === 'draft') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Form Not Yet Published</h1>
          <p className="text-slate-500 text-sm">This form is still in draft mode and is not accepting submissions. Please contact the form administrator.</p>
          <p className="text-xs text-slate-400 font-mono">{form.name}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Response Recorded</h1>
          <p className="text-slate-500 text-sm">Thank you for completing <strong>{form.name}</strong>.</p>
          <button onClick={() => { setSubmitted(false); setResponses({}); setErrors({}); setActiveSectionIndex(0); startedAtRef.current = new Date().toISOString(); auditLogRef.current = [] }} className="px-4 py-2 text-sm border border-slate-300 rounded hover:bg-slate-50 transition-colors">
            Submit Another Response
          </button>
        </div>
      </div>
    )
  }

  const isLastSection = safeIndex === sections.length - 1
  const isFirstSection = safeIndex === 0
  const repeatGroups = form.repeatGroups || []
  const languages = form.languages || []

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ── Top Bar ── */}
      <header className="bg-blue-800 text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center font-bold text-sm">S</div>
            <div>
              <h1 className="font-semibold text-sm leading-tight truncate max-w-[220px] sm:max-w-none">{form.name}</h1>
              <p className="text-blue-200 text-xs">{form.id} &middot; {visibleFields.length} questions visible</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language selector */}
            {languages.length > 1 && (
              <select value={activeLanguage} onChange={(e) => setActiveLanguage(e.target.value)} className="bg-blue-700 text-white text-xs border border-blue-600 rounded px-2 py-1">
                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            )}
            <div className="text-right text-xs">
              <span className="text-blue-200">Progress</span>
              <div className="font-bold text-lg leading-none">{Math.min(progressPct, 100)}%</div>
            </div>
          </div>
        </div>
        <div className="h-1 bg-blue-900">
          <div className="h-1 bg-blue-400 transition-all duration-500" style={{ width: `${Math.min(progressPct, 100)}%` }} />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 flex gap-4">
        <nav className="hidden md:block w-56 shrink-0">
          <div className="sticky top-20 bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sections</p>
            </div>
            {sections.map((s, idx) => (
              <button key={s.id} onClick={() => setActiveSectionIndex(idx)} className={`w-full text-left px-3 py-2.5 text-sm border-l-3 transition-colors ${safeIndex === idx ? "border-l-blue-600 bg-blue-50 text-blue-800 font-medium" : "border-l-transparent text-slate-600 hover:bg-slate-50"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="md:hidden w-full mb-0">
          <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
            {sections.map((s, idx) => (
              <button key={s.id} onClick={() => setActiveSectionIndex(idx)} className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors ${safeIndex === idx ? "bg-blue-700 text-white border-blue-700" : "bg-white text-slate-600 border-slate-300"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pb-8 md:flex gap-4">
        <div className="hidden md:block w-56 shrink-0" />
        <div className="flex-1 min-w-0 space-y-4">

          {activeSection && (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-blue-800 text-white">
                <h2 className="font-semibold">{activeSection.label}</h2>
                {activeSection.description && <p className="text-blue-200 text-xs mt-0.5">{activeSection.description}</p>}
                <p className="text-blue-200 text-xs mt-0.5">
                  Section {safeIndex + 1} of {sections.length}
                  {activeSection.fields.length > 0 && ` \u00b7 ${activeSection.fields.length} question${activeSection.fields.length !== 1 ? "s" : ""}`}
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {activeSection.fields.map((field, index) => renderFieldBlock(field, index))}
              </div>

              {activeSection.fields.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">No questions visible with current responses.</div>
              )}

              {/* Navigation */}
              <div className="p-5 border-t border-slate-200 flex flex-col sm:flex-row gap-3 justify-between">
                {!isFirstSection ? (
                  <button onClick={() => setActiveSectionIndex(safeIndex - 1)} className="px-5 py-2.5 border border-slate-300 text-slate-600 text-sm font-medium rounded hover:bg-slate-50 transition-colors">
                    &larr; Back
                  </button>
                ) : <div />}

                {isLastSection ? (
                  <div className="flex gap-3">
                    <button onClick={handleSaveDraft} disabled={isSubmitting} className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded hover:bg-slate-50 transition-colors disabled:opacity-50">
                      Save as Draft
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {isSubmitting ? "Submitting..." : "Submit Form"}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setActiveSectionIndex(safeIndex + 1)} className="px-5 py-2.5 bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-800 transition-colors">
                    Next &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Repeat Groups ── */}
          {repeatGroups.map(rg => {
            const repeatFields = form.fields.filter(f => f.repeatGroupId === rg.id)
            if (repeatFields.length === 0) return null
            const count = repeatCounts[rg.id] || 1

            return (
              <div key={rg.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-violet-700 text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{rg.label}</h3>
                    <p className="text-violet-200 text-xs">{count} instance{count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => removeRepeatInstance(rg.id)} disabled={count <= (rg.repeatMin || 1)} className="px-2 py-1 text-xs bg-violet-600 rounded hover:bg-violet-500 disabled:opacity-40">Remove</button>
                    <button type="button" onClick={() => addRepeatInstance(rg.id)} disabled={!!rg.repeatMax && count >= rg.repeatMax} className="px-2 py-1 text-xs bg-violet-600 rounded hover:bg-violet-500 disabled:opacity-40">+ Add Another</button>
                  </div>
                </div>
                {Array.from({ length: count }, (_, instanceIdx) => (
                  <div key={instanceIdx} className="border-b border-slate-100 last:border-b-0">
                    <div className="px-5 py-2 bg-violet-50 text-xs font-medium text-violet-700">Instance {instanceIdx + 1}</div>
                    <div className="divide-y divide-slate-100">
                      {repeatFields.map((field, fIdx) => renderFieldBlock(field, fIdx, getRepeatFieldId(field.id, instanceIdx)))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}

        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-slate-400">
          <span>Powered by <strong className="text-slate-600">SLASH</strong></span>
          <span>{form.id} &middot; v{form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : "1.0"}</span>
        </div>
      </footer>
    </div>
  )
}
