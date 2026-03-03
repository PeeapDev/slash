"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Beaker, Clock, MapPin, User } from "lucide-react"
import { Form, FormField } from "@/lib/form-store"
import {
  evaluateRelevance,
  computeCalculatedFields,
  getCascadingOptions,
  getVisibleFields,
  filterChoicesByExpression,
} from "@/lib/form-logic-engine"

interface FormPreviewProps {
  form: Form
  onClose: () => void
}

export default function FormPreview({ form, onClose }: FormPreviewProps) {
  const [responses, setResponses] = useState<Record<string, any>>({})

  const computedValues = computeCalculatedFields(form.fields, responses)
  const allResponses = { ...responses, ...computedValues }
  const visibleFields = getVisibleFields(form.fields, allResponses)

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }))
  }

  const getOptions = (field: FormField): string[] => {
    const filtered = filterChoicesByExpression(field, allResponses)
    let opts = filtered || field.options || []
    if (field.orOther && !opts.includes('Other')) opts = [...opts, 'Other']
    return opts
  }

  const renderField = (field: FormField) => {
    const value = field.type === "calculate" ? (computedValues[field.id] ?? "") : (allResponses[field.id] ?? "")
    const inputClass = "w-full p-2 border border-input rounded-md bg-background text-sm"
    const options = getOptions(field)

    // Cascading select
    if (field.cascadingParentId && field.cascadingChoices) {
      const opts = getCascadingOptions(field, allResponses)
      const parentVal = allResponses[field.cascadingParentId]
      return (
        <div>
          {!parentVal && <p className="text-xs text-amber-600 mb-1">Select parent field first</p>}
          <select value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} className={inputClass} disabled={!parentVal}>
            <option value="">— Select —</option>
            {opts.map((c, i) => <option key={i} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      )
    }

    switch (field.type) {
      case 'text':
        return field.appearance === 'multiline'
          ? <textarea value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} rows={3} className={inputClass + " resize-y"} />
          : field.appearance === 'signature'
            ? <div className="border rounded p-4 text-center text-muted-foreground text-xs">[Signature Canvas]</div>
            : <Input value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} readOnly={field.readOnly} />

      case 'email':
        return <Input type="email" value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} placeholder="email@example.com" />

      case 'phone':
        return <Input type="tel" value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} placeholder="+1 234 567 8900" />

      case 'number': case 'integer': case 'decimal':
        return <Input type="number" value={value} onChange={(e) => handleFieldChange(field.id, e.target.value ? Number(e.target.value) : "")} placeholder={field.placeholder} step={field.type === 'decimal' ? 'any' : '1'} />

      case 'select': {
        const showOther = field.orOther && value === 'Other'
        return (
          <div className="space-y-2">
            <select value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} className={inputClass}>
              <option value="">Select an option</option>
              {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
            </select>
            {showOther && <Input value={allResponses[`${field.id}__other`] || ''} onChange={(e) => handleFieldChange(`${field.id}__other`, e.target.value)} placeholder="Please specify..." />}
          </div>
        )
      }

      case 'radio': {
        const showOther = field.orOther && value === 'Other'
        return (
          <div className="space-y-2">
            {options.map((opt, i) => (
              <label key={i} className="flex items-center gap-2">
                <input type="radio" name={field.id} value={opt} checked={value === opt} onChange={(e) => handleFieldChange(field.id, e.target.value)} className="rounded" />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
            {showOther && <Input value={allResponses[`${field.id}__other`] || ''} onChange={(e) => handleFieldChange(`${field.id}__other`, e.target.value)} placeholder="Please specify..." />}
          </div>
        )
      }

      case 'checkbox': {
        const checked: string[] = value || []
        const showOther = field.orOther && checked.includes('Other')
        return (
          <div className="space-y-2">
            {options.map((opt, i) => (
              <label key={i} className="flex items-center gap-2">
                <input type="checkbox" value={opt} checked={checked.includes(opt)} onChange={(e) => {
                  handleFieldChange(field.id, e.target.checked ? [...checked, opt] : checked.filter((v: string) => v !== opt))
                }} className="rounded" />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
            {showOther && <Input value={allResponses[`${field.id}__other`] || ''} onChange={(e) => handleFieldChange(`${field.id}__other`, e.target.value)} placeholder="Please specify..." />}
          </div>
        )
      }

      case 'date':
        return <Input type="date" value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} />

      case 'time':
        return <Input type="time" value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} />

      case 'dateTime': {
        const [datePart, timePart] = typeof value === 'string' ? value.split('T') : ['', '']
        return (
          <div className="flex gap-2">
            <Input type="date" value={datePart || ''} onChange={(e) => handleFieldChange(field.id, `${e.target.value}T${timePart || '00:00'}`)} />
            <Input type="time" value={(timePart || '').slice(0, 5)} onChange={(e) => handleFieldChange(field.id, `${datePart}T${e.target.value}`)} />
          </div>
        )
      }

      case 'file': case 'image':
        return <Input type="file" accept={field.type === 'image' ? 'image/*' : undefined} onChange={(e) => handleFieldChange(field.id, e.target.files?.[0]?.name || '')} />

      case 'calculate':
        return <div className="p-2 border rounded bg-muted text-sm font-mono">{value !== undefined && value !== '' ? String(value) : <span className="text-muted-foreground italic">Waiting...</span>}</div>

      case 'note':
        return (
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">{field.label}</div>
            {field.acknowledgeLabel && (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!value} onChange={(e) => handleFieldChange(field.id, e.target.checked)} />
                <span className="text-sm">{field.acknowledgeLabel}</span>
              </label>
            )}
          </div>
        )

      case 'likert':
        return (
          <div className="flex gap-1">
            {options.map((opt, i) => (
              <button key={i} type="button" onClick={() => handleFieldChange(field.id, opt)} className={`flex-1 py-2 text-xs rounded border ${value === opt ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
                {opt}
              </button>
            ))}
          </div>
        )

      case 'rating': {
        const max = field.ratingMax || 5
        const current = Number(value) || 0
        return (
          <div className="flex gap-1">
            {Array.from({ length: max }, (_, i) => i + 1).map(star => (
              <button key={star} type="button" onClick={() => handleFieldChange(field.id, star)} className="p-0.5">
                <svg className={`w-7 h-7 ${star <= current ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill={star <= current ? "currentColor" : "none"}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            ))}
            {current > 0 && <span className="text-sm text-muted-foreground ml-1 self-center">{current}/{max}</span>}
          </div>
        )
      }

      case 'range': {
        const min = field.rangeMin ?? 0, max = field.rangeMax ?? 100, step = field.rangeStep ?? 1
        const current = value !== '' ? Number(value) : min
        return (
          <div className="space-y-1">
            <input type="range" min={min} max={max} step={step} value={current} onChange={(e) => handleFieldChange(field.id, Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground"><span>{min}</span><span className="font-medium">{current}</span><span>{max}</span></div>
          </div>
        )
      }

      case 'gps':
        return (
          <div className="space-y-1">
            <Input value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} placeholder="Latitude, Longitude" />
            <button type="button" className="text-xs text-blue-600 hover:underline">Get current location</button>
          </div>
        )

      case 'barcode':
        return <Input value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} placeholder="Scan or enter barcode" />

      case 'ranking': {
        const items: string[] = value || options
        return (
          <div className="space-y-1">
            {(Array.isArray(items) ? items : []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded border text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">{idx + 1}</span>
                <span className="flex-1">{item}</span>
              </div>
            ))}
          </div>
        )
      }

      default:
        return <Input value={value} onChange={(e) => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} />
    }
  }

  const getFormIcon = () => form.type === 'survey' ? <FileText className="w-6 h-6" /> : <Beaker className="w-6 h-6" />
  const getFormTypeColor = () => form.type === 'survey' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forms
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Form Preview</h1>
            <p className="text-muted-foreground">Preview how this form will appear to field collectors</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="max-w-md mx-auto bg-gray-900 rounded-[2.5rem] p-2">
            <div className="bg-white rounded-[2rem] p-6 h-[600px] overflow-y-auto">
              <div className="flex items-center gap-3 pb-4 border-b mb-6">
                <div className={`p-2 rounded-lg ${getFormTypeColor()}`}>{getFormIcon()}</div>
                <div>
                  <h2 className="font-semibold text-gray-900">{form.name}</h2>
                  <p className="text-sm text-gray-600">Field Data Collection</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600"><User className="w-4 h-4" /><span>Collector: John Doe</span></div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="w-4 h-4" /><span>Location: North Region</span></div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-4 h-4" /><span>Time: {new Date().toLocaleTimeString()}</span></div>
              </div>

              <div className="space-y-6">
                {visibleFields.map((field) => {
                  const isNote = field.type === 'note'
                  return (
                    <div key={field.id} className="space-y-2">
                      {!isNote && (
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                      )}
                      {field.hint && !isNote && <p className="text-xs text-gray-500">{field.hint}</p>}
                      {field.guidanceHint && <p className="text-xs text-blue-500 italic">{field.guidanceHint}</p>}
                      {renderField(field)}
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 space-y-3">
                <Button className="w-full" size="lg">Submit Form</Button>
                <Button variant="outline" className="w-full">Save as Draft</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Form Details</h3>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">ID:</span><p className="text-muted-foreground">{form.id}</p></div>
              <div><span className="font-medium">Type:</span><div className="mt-1"><Badge className={getFormTypeColor()}>{getFormIcon()}<span className="ml-1 capitalize">{form.type}</span></Badge></div></div>
              <div><span className="font-medium">Target Role:</span><p className="text-muted-foreground capitalize">{form.targetRole.replace('-', ' ')}</p></div>
              <div><span className="font-medium">Status:</span><div className="mt-1"><Badge variant={form.status === 'active' ? 'default' : 'secondary'}>{form.status}</Badge></div></div>
              <div><span className="font-medium">Fields:</span><p className="text-muted-foreground">{form.fields.length} field(s)</p></div>
              <div><span className="font-medium">Visible:</span><p className="text-muted-foreground">{visibleFields.length} visible (skip logic applied)</p></div>
              <div><span className="font-medium">Required:</span><p className="text-muted-foreground">{form.fields.filter(f => f.required).length} required</p></div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Field Summary</h3>
            <div className="space-y-2">
              {form.fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div>
                    <p className="font-medium">{field.label}</p>
                    <p className="text-muted-foreground text-xs capitalize">{field.type}</p>
                  </div>
                  {field.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
