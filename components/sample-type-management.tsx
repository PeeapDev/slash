"use client"

import React, { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Beaker,
  FileText,
  Save,
  X,
  AlertCircle
} from "lucide-react"

interface SampleType {
  id: string
  code: string
  name: string
  description: string
  fields: Array<{
    name: string
    type: string
    label: string
    required: boolean
    options?: string[]
  }>
  createdAt: string
}

export default function SampleTypeManagement() {
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
      
      const localTypes = await offlineDB.getAll<SampleType>('sample_types')
      console.log(`✅ Loaded ${localTypes.length} sample types from IndexedDB`)
      
      // If no custom types exist, load defaults
      if (localTypes.length === 0) {
        const defaultTypes = [
          {
            id: 'BLOOD',
            code: 'BLOOD',
            name: 'Blood Sample',
            description: 'Venous blood collection in EDTA tube',
            fields: [
              { name: 'volume_collected', type: 'number', label: 'Volume (mL)', required: true },
              { name: 'container_type', type: 'select', label: 'Container Type', required: true, options: ['EDTA tube', 'Serum tube', 'Heparin tube'] },
              { name: 'temperature_at_collection', type: 'number', label: 'Temperature (°C)', required: false },
              { name: 'collection_notes', type: 'textarea', label: 'Collection Notes', required: false }
            ],
            createdAt: new Date().toISOString()
          },
          {
            id: 'URINE',
            code: 'URINE', 
            name: 'Urine Sample',
            description: 'Clean catch urine sample',
            fields: [
              { name: 'volume_collected', type: 'number', label: 'Volume (mL)', required: true },
              { name: 'collection_time', type: 'select', label: 'Collection Time', required: true, options: ['Morning', 'Afternoon', 'Evening', 'Random'] },
              { name: 'appearance', type: 'select', label: 'Appearance', required: false, options: ['Clear', 'Cloudy', 'Dark', 'Bloody'] },
              { name: 'collection_notes', type: 'textarea', label: 'Collection Notes', required: false }
            ],
            createdAt: new Date().toISOString()
          },
          {
            id: 'SALIVA',
            code: 'SALIVA',
            name: 'Saliva Sample', 
            description: 'Passive drool saliva collection',
            fields: [
              { name: 'volume_collected', type: 'number', label: 'Volume (mL)', required: true },
              { name: 'fasting_status', type: 'select', label: 'Fasting Status', required: true, options: ['Fasting', 'Non-fasting'] },
              { name: 'collection_notes', type: 'textarea', label: 'Collection Notes', required: false }
            ],
            createdAt: new Date().toISOString()
          },
          {
            id: 'SWAB',
            code: 'SWAB',
            name: 'Swab Sample',
            description: 'Nasopharyngeal or throat swab',
            fields: [
              { name: 'swab_type', type: 'select', label: 'Swab Type', required: true, options: ['Nasopharyngeal', 'Throat', 'Nasal'] },
              { name: 'transport_medium', type: 'select', label: 'Transport Medium', required: true, options: ['VTM', 'UTM', 'Dry swab'] },
              { name: 'collection_notes', type: 'textarea', label: 'Collection Notes', required: false }
            ],
            createdAt: new Date().toISOString()
          }
        ]
        
        // Save defaults to IndexedDB
        for (const type of defaultTypes) {
          await offlineDB.create<SampleType>('sample_types', type)
        }
        setSampleTypes(defaultTypes)
        console.log('✅ Created default sample types in IndexedDB')
      } else {
        setSampleTypes(localTypes)
      }
    } catch (error) {
      console.error('❌ Error loading sample types:', error)
      setSampleTypes([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddType = () => {
    setEditingType(null)
    setShowForm(true)
  }

  const handleEditType = (sampleType: SampleType) => {
    setEditingType(sampleType)
    setShowForm(true)
  }

  const handleDeleteType = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sample type?')) {
      try {
        const { offlineDB } = await import('@/lib/offline-first-db')
        await offlineDB.init()
        
        // Remove from IndexedDB
        await offlineDB.delete('sample_types', id)
        
        // Update local state
        setSampleTypes(prev => prev.filter(type => type.id !== id))
        console.log(`✅ Deleted sample type: ${id}`)
      } catch (error) {
        console.error('❌ Error deleting sample type:', error)
      }
    }
  }

  const handleSaveType = async (typeData: Partial<SampleType>) => {
    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()

      if (editingType) {
        // Update existing
        const updatedType = { ...editingType, ...typeData }
        await offlineDB.update('sample_types', editingType.id, updatedType)
        setSampleTypes(prev => prev.map(type => 
          type.id === editingType.id ? updatedType : type
        ))
        console.log(`✅ Updated sample type: ${editingType.id}`)
      } else {
        // Create new
        const newType: SampleType = {
          id: `TYPE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          code: typeData.code!.toUpperCase(),
          name: typeData.name!,
          description: typeData.description || '',
          fields: typeData.fields || [],
          createdAt: new Date().toISOString()
        }
        
        await offlineDB.create<SampleType>('sample_types', newType)
        setSampleTypes(prev => [...prev, newType])
        console.log(`✅ Created sample type: ${newType.id}`)
      }
      
      setShowForm(false)
      setEditingType(null)
    } catch (error) {
      console.error('❌ Error saving sample type:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading sample types...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / Configuration</div>
          <h1 className="text-2xl font-bold mt-1">Sample Type Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Define and manage sample collection types</p>
        </div>
        <Button onClick={handleAddType} className="gap-2">
          <Plus size={18} />
          Add Sample Type
        </Button>
      </div>

      {/* Sample Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleTypes.map((sampleType) => (
          <Card key={sampleType.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Beaker className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{sampleType.name}</h3>
                  <p className="text-sm text-muted-foreground">Code: {sampleType.code}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditType(sampleType)}
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
                Created: {new Date(sampleType.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Sample Type Form Modal */}
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

// Sample Type Form Component
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
    fields: sampleType?.fields || []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">Collection Fields</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Collection fields will be available for configuration in a future update. 
                Current fields are preset based on sample type.
              </p>
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
