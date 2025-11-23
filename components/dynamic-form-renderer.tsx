"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Send, FileText, Beaker, AlertCircle } from "lucide-react"
import { Form, FormField, submitFormResponse } from "@/lib/form-store"

interface DynamicFormRendererProps {
  form: Form
  onClose: () => void
  onSubmit?: (responses: Record<string, any>) => void
  linkedTo?: {
    householdId?: string
    participantId?: string
    sampleId?: string
    projectId?: string
  }
  collector: any
}

export default function DynamicFormRenderer({ 
  form, 
  onClose, 
  onSubmit, 
  linkedTo, 
  collector 
}: DynamicFormRendererProps) {
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDraft, setIsDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))

    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }))
    }
  }

  const validateField = (field: FormField, value: any): string => {
    if (field.required && (!value || value === '' || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} is required`
    }

    if (field.validation) {
      if (field.type === 'number' && typeof value === 'number') {
        if (field.validation.min !== undefined && value < field.validation.min) {
          return field.validation.message || `Minimum value is ${field.validation.min}`
        }
        if (field.validation.max !== undefined && value > field.validation.max) {
          return field.validation.message || `Maximum value is ${field.validation.max}`
        }
      }

      if (field.validation.pattern && typeof value === 'string') {
        const regex = new RegExp(field.validation.pattern)
        if (!regex.test(value)) {
          return field.validation.message || 'Invalid format'
        }
      }
    }

    return ''
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    form.fields.forEach(field => {
      const error = validateField(field, responses[field.id])
      if (error) {
        newErrors[field.id] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleSaveAsDraft = () => {
    setIsDraft(true)
    const response = submitFormResponse({
      formId: form.id,
      responses,
      submittedBy: collector.email || collector.name,
      linkedTo,
      status: 'draft'
    })
    
    onSubmit?.(responses)
    onClose()
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = submitFormResponse({
        formId: form.id,
        responses,
        submittedBy: collector.email || collector.name,
        linkedTo,
        status: 'submitted'
      })
      
      onSubmit?.(responses)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = responses[field.id] || ''
    const hasError = !!errors[field.id]

    const baseClasses = `w-full p-2 border rounded-md bg-background ${
      hasError ? 'border-red-500' : 'border-input'
    }`

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? 'border-red-500' : ''}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value ? Number(e.target.value) : '')}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={hasError ? 'border-red-500' : ''}
          />
        )

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseClasses}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="rounded"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={(value || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = value || []
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option)
                    handleFieldChange(field.id, newValues)
                  }}
                  className="rounded"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={hasError ? 'border-red-500' : ''}
          />
        )

      case 'time':
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={hasError ? 'border-red-500' : ''}
          />
        )

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => handleFieldChange(field.id, e.target.files?.[0]?.name || '')}
            className={hasError ? 'border-red-500' : ''}
          />
        )

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? 'border-red-500' : ''}
          />
        )
    }
  }

  const getFormIcon = () => {
    return form.type === 'survey' ? <FileText className="w-6 h-6" /> : <Beaker className="w-6 h-6" />
  }

  const getFormTypeColor = () => {
    return form.type === 'survey' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
  }

  const completionPercentage = Math.round(
    (Object.keys(responses).filter(key => responses[key] !== '').length / form.fields.length) * 100
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getFormTypeColor()}`}>
                {getFormIcon()}
              </div>
              <div>
                <h1 className="text-xl font-bold">{form.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {completionPercentage}% completed • {form.fields.length} fields
                </p>
              </div>
            </div>
          </div>
          
          <Badge className={getFormTypeColor()}>
            {form.type}
          </Badge>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8">
          <div className="space-y-6">
            {form.fields.map((field, index) => (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.hint && (
                  <p className="text-sm text-muted-foreground">{field.hint}</p>
                )}
                
                {renderField(field)}
                
                {errors[field.id] && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors[field.id]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-8 mt-8 border-t">
            <Button 
              onClick={handleSaveAsDraft}
              variant="outline" 
              className="flex-1 gap-2"
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </Button>
            
            <Button 
              onClick={handleSubmit}
              className="flex-1 gap-2"
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  )
}
