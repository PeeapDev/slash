"use client"

import React, { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Beaker,
  FileText,
  Save,
  X,
  Settings,
  GripVertical,
  Copy
} from "lucide-react"
import { SampleType } from "@/lib/offline-first-db"

interface CollectionField {
  name: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date' | 'time'
  label: string
  required: boolean
  options?: string[]
  placeholder?: string
  defaultValue?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export default function SampleTypeConfiguration() {
  const [sampleTypes, setSampleTypes] = useState<SampleType[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState<SampleType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSampleTypes()
  }, [])

  const loadSampleTypes = async () => {
    try {
      console.log('🧪 Loading sample types from IndexedDB...')
      setIsLoading(true)
      
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const localTypes = await offlineDB.getAll('sample_types') as SampleType[]
      console.log(`✅ Loaded ${localTypes.length} sample types from IndexedDB`)
      
      if (localTypes.length === 0) {
        await createDefaultTypes()
      } else {
        setSampleTypes(localTypes)
      }
    } catch (error) {
      console.error('❌ Error loading sample types:', error)
      await createDefaultTypes()
    } finally {
      setIsLoading(false)
    }
  }

  const createDefaultTypes = async () => {
    const defaultTypes: SampleType[] = [
      {
        id: 'BLOOD',
        code: 'BLOOD',
        name: 'Blood Sample',
        description: 'Venous blood collection in EDTA tube',
        isActive: true,
        fields: [
          { name: 'volume_collected', type: 'number', label: 'Volume (mL)', required: true, validation: { min: 1, max: 50 } },
          { name: 'container_type', type: 'select', label: 'Container Type', required: true, options: ['EDTA tube', 'Serum tube', 'Heparin tube'] },
          { name: 'temperature_at_collection', type: 'number', label: 'Temperature (°C)', required: false, validation: { min: 15, max: 40 } },
          { name: 'collection_notes', type: 'textarea', label: 'Collection Notes', required: false, placeholder: 'Any observations during collection...' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deviceId: 'system',
        collectorId: 'system',
        syncStatus: 'pending' as const,
        version: 1
      },
      {
        id: 'URINE',
        code: 'URINE', 
        name: 'Urine Sample',
        description: 'Clean catch urine sample',
        isActive: true,
        fields: [
          { name: 'volume_collected', type: 'number', label: 'Volume (mL)', required: true, validation: { min: 5, max: 200 } },
          { name: 'collection_time', type: 'select', label: 'Collection Time', required: true, options: ['Morning', 'Afternoon', 'Evening', 'Random'] },
          { name: 'appearance', type: 'select', label: 'Appearance', required: false, options: ['Clear', 'Cloudy', 'Dark', 'Bloody'] },
          { name: 'collection_notes', type: 'textarea', label: 'Collection Notes', required: false }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deviceId: 'system',
        collectorId: 'system',
        syncStatus: 'pending' as const,
        version: 1
      }
    ]
    
    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      for (const type of defaultTypes) {
        await offlineDB.create('sample_types', type)
      }
      setSampleTypes(defaultTypes)
      console.log('✅ Created default sample types')
    } catch (error) {
      console.error('❌ Error creating default types:', error)
      setSampleTypes(defaultTypes)
    }
  }

  const handleSaveType = async (typeData: Partial<SampleType>) => {
    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()

      if (editingType) {
        const updatedType = { 
          ...editingType, 
          ...typeData,
          updatedAt: new Date().toISOString(),
          version: (editingType.version || 1) + 1
        }
        await offlineDB.update('sample_types', editingType.id, updatedType)
        setSampleTypes(prev => prev.map(type => 
          type.id === editingType.id ? updatedType : type
        ))
        console.log(`✅ Updated sample type: ${editingType.id}`)
      } else {
        const newType: SampleType = {
          id: `TYPE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          code: typeData.code!.toUpperCase(),
          name: typeData.name!,
          description: typeData.description || '',
          fields: typeData.fields || [],
          isActive: typeData.isActive !== false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deviceId: 'user_created',
          collectorId: 'admin',
          syncStatus: 'pending' as const,
          version: 1
        }
        
        await offlineDB.create('sample_types', newType)
        setSampleTypes(prev => [...prev, newType])
        console.log(`✅ Created sample type: ${newType.id}`)
      }
      
      setShowForm(false)
      setEditingType(null)
    } catch (error) {
      console.error('❌ Error saving sample type:', error)
    }
  }

  const handleDeleteType = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sample type?')) {
      try {
        const { offlineDB } = await import('@/lib/offline-first-db')
        await offlineDB.delete('sample_types', id)
        setSampleTypes(prev => prev.filter(type => type.id !== id))
        console.log(`✅ Deleted sample type: ${id}`)
      } catch (error) {
        console.error('❌ Error deleting sample type:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading sample types...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sample Types & Collection Fields</h3>
          <p className="text-sm text-muted-foreground">Configure collection forms for each sample type</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={18} />
          Add Sample Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sampleTypes.map((sampleType) => (
          <Card key={sampleType.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Beaker className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{sampleType.name}</h4>
                  <p className="text-sm text-muted-foreground">Code: {sampleType.code}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingType(sampleType)
                    setShowForm(true)
                  }}
                >
                  <Edit2 size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteType(sampleType.id)}
                >
                  <Trash2 size={16} className="text-red-600" />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {sampleType.description}
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText size={16} />
                <span>{sampleType.fields.length} collection fields</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Active: {sampleType.isActive ? '✅' : '❌'}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showForm && (
        <SampleTypeForm
          sampleType={editingType}
          onSave={handleSaveType}
          onClose={() => {
            setShowForm(false)
            setEditingType(null)
          }}
        />
      )}
    </div>
  )
}

interface SampleTypeFormProps {
  sampleType: SampleType | null
  onSave: (data: Partial<SampleType>) => void
  onClose: () => void
}

function SampleTypeForm({ sampleType, onSave, onClose }: SampleTypeFormProps) {
  const [formData, setFormData] = useState({
    code: sampleType?.code || '',
    name: sampleType?.name || '',
    description: sampleType?.description || '',
    isActive: sampleType?.isActive !== false,
    fields: sampleType?.fields || []
  })

  const addField = () => {
    const newField: CollectionField = {
      name: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false
    }
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
  }

  const updateField = (index: number, field: CollectionField) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? field : f)
    }))
  }

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {sampleType ? 'Edit Sample Type' : 'Create Sample Type'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Sample Type Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., BLOOD, URINE"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Display Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Blood Sample"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the sample collection procedure..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active (available for collection)</Label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Collection Fields</h3>
                <Button type="button" onClick={addField} size="sm" className="gap-2">
                  <Plus size={16} />
                  Add Field
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {formData.fields.map((field, index) => (
                  <FieldEditor
                    key={index}
                    field={field}
                    onUpdate={(updatedField) => updateField(index, updatedField)}
                    onRemove={() => removeField(index)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Save size={16} />
                {sampleType ? 'Update' : 'Create'} Sample Type
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

interface FieldEditorProps {
  field: CollectionField
  onUpdate: (field: CollectionField) => void
  onRemove: () => void
}

function FieldEditor({ field, onUpdate, onRemove }: FieldEditorProps) {
  return (
    <Card className="p-4 border-l-4 border-l-primary/20">
      <div className="grid grid-cols-12 gap-4 items-start">
        <div className="col-span-3">
          <Label>Field Name</Label>
          <Input
            value={field.name}
            onChange={(e) => onUpdate({ ...field, name: e.target.value })}
            placeholder="field_name"
          />
        </div>
        
        <div className="col-span-3">
          <Label>Display Label</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ ...field, label: e.target.value })}
            placeholder="Display Label"
          />
        </div>

        <div className="col-span-2">
          <Label>Field Type</Label>
          <Select value={field.type} onValueChange={(type: any) => onUpdate({ ...field, type })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="select">Select</SelectItem>
              <SelectItem value="textarea">Textarea</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="time">Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 flex items-center space-x-2">
          <Switch
            checked={field.required}
            onCheckedChange={(required) => onUpdate({ ...field, required })}
          />
          <Label>Required</Label>
        </div>

        <div className="col-span-2 flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 size={16} className="text-red-600" />
          </Button>
        </div>

        {field.type === 'select' && (
          <div className="col-span-12">
            <Label>Options (comma-separated)</Label>
            <Input
              value={field.options?.join(', ') || ''}
              onChange={(e) => onUpdate({ 
                ...field, 
                options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              placeholder="Option 1, Option 2, Option 3"
            />
          </div>
        )}

        <div className="col-span-6">
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
            placeholder="Placeholder text..."
          />
        </div>

        {field.type === 'number' && (
          <div className="col-span-6 grid grid-cols-2 gap-2">
            <div>
              <Label>Min Value</Label>
              <Input
                type="number"
                value={field.validation?.min || ''}
                onChange={(e) => onUpdate({ 
                  ...field, 
                  validation: { ...field.validation, min: parseInt(e.target.value) || undefined }
                })}
              />
            </div>
            <div>
              <Label>Max Value</Label>
              <Input
                type="number"
                value={field.validation?.max || ''}
                onChange={(e) => onUpdate({ 
                  ...field, 
                  validation: { ...field.validation, max: parseInt(e.target.value) || undefined }
                })}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
