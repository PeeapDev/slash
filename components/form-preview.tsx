"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Beaker, Clock, MapPin, User } from "lucide-react"
import { Form, FormField } from "@/lib/form-store"

interface FormPreviewProps {
  form: Form
  onClose: () => void
}

export default function FormPreview({ form, onClose }: FormPreviewProps) {
  const [responses, setResponses] = useState<Record<string, any>>({})

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const renderField = (field: FormField) => {
    const value = responses[field.id] || ''

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background"
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
              <label key={index} className="flex items-center gap-2">
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
              <label key={index} className="flex items-center gap-2">
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
          />
        )

      case 'time':
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        )

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => handleFieldChange(field.id, e.target.files?.[0])}
          />
        )

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forms
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Form Preview</h1>
            <p className="text-muted-foreground">
              Preview how this form will appear to field collectors
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Form Preview */}
        <div className="lg:col-span-3">
          {/* Mobile Device Frame */}
          <div className="max-w-md mx-auto bg-gray-900 rounded-[2.5rem] p-2">
            <div className="bg-white rounded-[2rem] p-6 h-[600px] overflow-y-auto">
              {/* Mobile Header */}
              <div className="flex items-center gap-3 pb-4 border-b mb-6">
                <div className={`p-2 rounded-lg ${getFormTypeColor()}`}>
                  {getFormIcon()}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{form.name}</h2>
                  <p className="text-sm text-gray-600">Field Data Collection</p>
                </div>
              </div>

              {/* Context Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Collector: John Doe</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Location: North Region</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Time: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {form.fields.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.hint && (
                      <p className="text-xs text-gray-500">{field.hint}</p>
                    )}
                    
                    {renderField(field)}
                    
                    {field.validation?.message && responses[field.id] && (
                      <p className="text-xs text-red-600">{field.validation.message}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="mt-8 space-y-3">
                <Button className="w-full" size="lg">
                  Submit Form
                </Button>
                <Button variant="outline" className="w-full">
                  Save as Draft
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Details Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Form Details</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">ID:</span>
                <p className="text-muted-foreground">{form.id}</p>
              </div>
              
              <div>
                <span className="font-medium">Type:</span>
                <div className="mt-1">
                  <Badge className={getFormTypeColor()}>
                    {getFormIcon()}
                    <span className="ml-1 capitalize">{form.type}</span>
                  </Badge>
                </div>
              </div>
              
              <div>
                <span className="font-medium">Target Role:</span>
                <p className="text-muted-foreground capitalize">{form.targetRole.replace('-', ' ')}</p>
              </div>
              
              <div>
                <span className="font-medium">Status:</span>
                <div className="mt-1">
                  <Badge variant={form.status === 'active' ? 'default' : 'secondary'}>
                    {form.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <span className="font-medium">Fields:</span>
                <p className="text-muted-foreground">{form.fields.length} field(s)</p>
              </div>
              
              <div>
                <span className="font-medium">Required Fields:</span>
                <p className="text-muted-foreground">
                  {form.fields.filter(f => f.required).length} required
                </p>
              </div>
              
              <div>
                <span className="font-medium">Created:</span>
                <p className="text-muted-foreground">
                  {new Date(form.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <span className="font-medium">Last Updated:</span>
                <p className="text-muted-foreground">
                  {new Date(form.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Field Summary</h3>
            
            <div className="space-y-2">
              {form.fields.map((field, index) => (
                <div key={field.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div>
                    <p className="font-medium">{field.label}</p>
                    <p className="text-muted-foreground text-xs capitalize">{field.type}</p>
                  </div>
                  {field.required && (
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Preview Notes</h3>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• This preview shows how the form appears on mobile devices</p>
              <p>• Field collectors will see contextual information</p>
              <p>• Forms can be saved as drafts for offline completion</p>
              <p>• Validation occurs before submission</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
