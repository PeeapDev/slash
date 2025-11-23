"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FormPreview from "./form-preview"
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical, 
  Save,
  Eye,
  Settings,
  Type,
  Hash,
  Calendar,
  Clock,
  List,
  CheckSquare,
  Circle,
  Upload,
  X,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import { Form, FormField, createForm, updateForm } from "@/lib/form-store"

interface FormBuilderEditorProps {
  form?: Form | null
  onClose: () => void
}

const fieldTypes = [
  { type: 'text', label: 'Text Input', icon: Type, description: 'Single line text' },
  { type: 'number', label: 'Number Input', icon: Hash, description: 'Numeric values' },
  { type: 'select', label: 'Dropdown', icon: List, description: 'Single choice dropdown' },
  { type: 'radio', label: 'Radio Buttons', icon: Circle, description: 'Single choice buttons' },
  { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare, description: 'Multiple choices' },
  { type: 'date', label: 'Date Picker', icon: Calendar, description: 'Date selection' },
  { type: 'time', label: 'Time Picker', icon: Clock, description: 'Time selection' },
  { type: 'file', label: 'File Upload', icon: Upload, description: 'File attachment' },
]

export default function FormBuilderEditor({ form, onClose }: FormBuilderEditorProps) {
  const [formData, setFormData] = useState<Partial<Form>>({
    name: '',
    type: 'survey',
    targetRole: 'field-collector',
    assignedProjects: [],
    assignedRegions: [],
    fields: [],
    status: 'active'
  })
  
  const [activeTab, setActiveTab] = useState('basic')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (form) {
      setFormData(form)
    }
  }, [form])

  if (showPreview && formData.name && formData.fields && formData.fields.length > 0) {
    const previewForm: Form = {
      ...formData as Form,
      id: form?.id || 'preview-form',
      createdAt: form?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user'
    }
    
    return (
      <FormPreview 
        form={previewForm} 
        onClose={() => setShowPreview(false)} 
      />
    )
  }

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: fieldType as any,
      label: `New ${fieldType} field`,
      required: false,
      placeholder: '',
      hint: '',
      options: fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox' 
        ? ['Option 1', 'Option 2'] 
        : undefined
    }

    setFormData(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }))
    
    setActiveTab('fields')
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields?.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      ) || []
    }))
  }

  const removeField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields?.filter(field => field.id !== fieldId) || []
    }))
    
    if (editingField === fieldId) {
      setEditingField(null)
    }
  }

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const fields = formData.fields || []
    const currentIndex = fields.findIndex(f => f.id === fieldId)
    
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === fields.length - 1) return
    
    const newFieldsArray = [...fields]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    const temp = newFieldsArray[currentIndex]
    newFieldsArray[currentIndex] = newFieldsArray[targetIndex]
    newFieldsArray[targetIndex] = temp
    
    setFormData(prev => ({
      ...prev,
      fields: newFieldsArray
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      if (form) {
        updateForm(form.id, formData)
      } else {
        createForm(formData as Omit<Form, 'id' | 'createdAt' | 'updatedAt'>)
      }
      
      onClose()
    } catch (error) {
      console.error('Error saving form:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const canSave = formData.name && formData.fields && formData.fields.length > 0
  const canPreview = formData.name && formData.fields && formData.fields.length > 0

  const renderFieldEditor = (field: FormField) => {
    return (
      <div className="mt-4 p-4 border border-primary/20 bg-primary/5 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-sm">Edit Field</h4>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingField(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Label *</label>
            <Input
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              placeholder="Field label"
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block">Placeholder</label>
              <Input
                value={field.placeholder || ''}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                placeholder="Placeholder text"
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Hint Text</label>
              <Input
                value={field.hint || ''}
                onChange={(e) => updateField(field.id, { hint: e.target.value })}
                placeholder="Helper text"
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`required-${field.id}`}
              checked={field.required}
              onChange={(e) => updateField(field.id, { required: e.target.checked })}
              className="rounded border-input"
            />
            <label htmlFor={`required-${field.id}`} className="text-xs font-medium">Required field</label>
          </div>

          {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
            <div>
              <label className="text-xs font-medium mb-2 block">Options</label>
              <div className="space-y-2">
                {field.options?.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])]
                        newOptions[index] = e.target.value
                        updateField(field.id, { options: newOptions })
                      }}
                      placeholder={`Option ${index + 1}`}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newOptions = (field.options || []).filter((_, i) => i !== index)
                        updateField(field.id, { options: newOptions })
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]
                    updateField(field.id, { options: newOptions })
                  }}
                  className="w-full text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
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
            <h1 className="text-2xl font-bold">
              {form ? `Edit Form: ${form.name}` : 'Create New Form'}
            </h1>
            <p className="text-muted-foreground">
              {form ? 'Modify form settings and fields' : 'Build a new form for field data collection'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!canPreview}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!canSave || isSaving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="fields">Form Fields</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Form Name *</label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Enter form name (e.g., Household Survey Form)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Form Type *</label>
                      <select
                        value={formData.type || 'survey'}
                        onChange={(e) => handleFormChange('type', e.target.value)}
                        className="w-full p-2 border border-input rounded-md bg-background"
                      >
                        <option value="survey">Survey</option>
                        <option value="sample">Sample Collection</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Target Role</label>
                      <select
                        value={formData.targetRole || 'field-collector'}
                        onChange={(e) => handleFormChange('targetRole', e.target.value)}
                        className="w-full p-2 border border-input rounded-md bg-background"
                      >
                        <option value="field-collector">Field Collector</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="lab-technician">Lab Technician</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="fields" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Form Fields</h3>
                  <Badge variant="outline">{formData.fields?.length || 0} fields</Badge>
                </div>

                {formData.fields && formData.fields.length > 0 ? (
                  <div className="space-y-3">
                    {formData.fields.map((field, index) => (
                      <div key={field.id}>
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{field.label}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {field.type}
                                  </Badge>
                                  {field.required && (
                                    <Badge variant="secondary" className="text-xs">Required</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveField(field.id, 'up')}
                                disabled={index === 0}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveField(field.id, 'down')}
                                disabled={index === (formData.fields?.length || 0) - 1}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                                className={editingField === field.id ? "bg-primary text-primary-foreground" : ""}
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeField(field.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {editingField === field.id && renderFieldEditor(field)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No fields added yet</p>
                    <p className="text-sm">Add fields using the panel on the right</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Form Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => handleFormChange('status', e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Field Types */}
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Add Fields</h3>
            
            <div className="space-y-2">
              {fieldTypes.map((fieldType) => {
                const IconComponent = fieldType.icon
                return (
                  <button
                    key={fieldType.type}
                    onClick={() => addField(fieldType.type)}
                    className="w-full p-3 text-left border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{fieldType.label}</p>
                        <p className="text-xs text-muted-foreground">{fieldType.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
