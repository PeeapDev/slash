"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  TestTube,
  Users,
  MapPin,
  Calendar,
  Thermometer,
  Droplets,
  FileText,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface SampleType {
  id: string
  type_code: string
  display_name: string
  description: string
  form_schema: {
    fields: Array<{
      name: string
      type: string
      label: string
      required: boolean
      options?: string[]
    }>
  }
}

interface Project {
  id: string
  project_code: string
  project_name: string
  expected_sample_types: string[]
}

interface Participant {
  id: string
  participant_id: string
  full_name: string
  household_id: string
}

interface FormData {
  [key: string]: any
}

export default function DynamicSampleForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit?: (data: any) => void
  onCancel?: () => void 
}) {
  const [sampleTypes, setSampleTypes] = useState<SampleType[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedSampleType, setSelectedSampleType] = useState<SampleType | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Mock current user (in real app, get from auth context)
  const currentUser = {
    id: 'user-123',
    name: 'John Collector',
    role: 'field_collector'
  }

  useEffect(() => {
    loadSampleTypes()
    loadProjects()
    loadParticipants()
  }, [])

  const loadSampleTypes = async () => {
    try {
      // PURE INDEXEDDB MODE - Load sample types from IndexedDB
      console.log('🧪 Loading sample types from IndexedDB...')
      
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const localTypes = await offlineDB.getAll('sample_types')
      console.log(`✅ Loaded ${localTypes.length} sample types from IndexedDB`)
      console.log('📋 Sample types raw data:', localTypes)

      if (localTypes.length === 0) {
        console.log('⚠️ No sample types found in IndexedDB - using fallback types')
        // Use fallback types if none exist
        const fallbackTypes = [
          { 
            id: 'fallback_BLOOD', 
            type_code: 'BLOOD', 
            display_name: 'Blood Sample', 
            description: 'Basic blood collection',
            form_schema: { fields: [
              { name: 'volume_collected', type: 'number', label: 'Volume (mL)', required: true },
              { name: 'collection_notes', type: 'textarea', label: 'Collection Notes', required: false }
            ] }
          },
          { 
            id: 'fallback_URINE', 
            type_code: 'URINE', 
            display_name: 'Urine Sample', 
            description: 'Basic urine collection',
            form_schema: { fields: [
              { name: 'volume_collected', type: 'number', label: 'Volume (mL)', required: true },
              { name: 'collection_notes', type: 'textarea', label: 'Collection Notes', required: false }
            ] }
          }
        ]
        setSampleTypes(fallbackTypes)
        return
      }

      // Filter only active sample types and format for form compatibility
      const activeTypes = localTypes.filter((type: any) => type.isActive !== false)
      console.log(`🎯 Filtered to ${activeTypes.length} active sample types`)
      
      const formattedTypes = activeTypes.map((type: any) => {
        console.log('🔄 Formatting type:', type)
        return {
          id: `db_${type.id}`, // Prefix to ensure uniqueness
          type_code: type.code,
          display_name: type.name,
          description: type.description,
          isActive: type.isActive,
          form_schema: {
            fields: type.fields || []
          }
        }
      })
      
      // Log before deduplication
      console.log(`📦 Before deduplication: ${formattedTypes.length} types`)
      formattedTypes.forEach((type, idx) => {
        console.log(`  ${idx + 1}. ${type.display_name} (${type.type_code}) - ID: ${type.id}`)
      })
      
      // Remove duplicates by type_code to prevent key conflicts
      const uniqueTypes = formattedTypes.filter((type, index, array) => 
        array.findIndex(t => t.type_code === type.type_code) === index
      )
      
      console.log(`✂️ After deduplication: ${uniqueTypes.length} unique types`)
      uniqueTypes.forEach((type, idx) => {
        console.log(`  ${idx + 1}. ${type.display_name} (${type.type_code})`)
      })
      
      setSampleTypes(uniqueTypes)
    } catch (error) {
      console.error('❌ Error loading sample types:', error)
      console.log('🔧 Using fallback sample types due to IndexedDB error')
      // Fallback to basic types if IndexedDB fails
      setSampleTypes([
        { 
          id: 'error_BLOOD', 
          type_code: 'BLOOD', 
          display_name: 'Blood Sample', 
          description: 'Basic blood collection',
          form_schema: { fields: [
            { name: 'volume_collected', type: 'number', label: 'Volume (mL)', required: true },
            { name: 'collection_notes', type: 'textarea', label: 'Collection Notes', required: false }
          ] }
        },
        { 
          id: 'error_URINE', 
          type_code: 'URINE', 
          display_name: 'Urine Sample', 
          description: 'Basic urine collection',
          form_schema: { fields: [
            { name: 'volume_collected', type: 'number', label: 'Volume (mL)', required: true },
            { name: 'collection_notes', type: 'textarea', label: 'Collection Notes', required: false }
          ] }
        }
      ])
    }
  }

  const loadProjects = async () => {
    try {
      // PURE INDEXEDDB MODE - Load projects from local storage
      console.log('📊 Loading projects from IndexedDB for sample form...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const localProjects = await offlineDB.getAll('project_metadata')
      console.log(`✅ Loaded ${localProjects.length} projects from IndexedDB for sample form`)
      
      // Convert to the format expected by the component
      const formattedProjects = localProjects.map((project: any) => ({
        id: project.id,
        project_name: project.projectName,
        project_code: project.projectCode,
        expected_sample_types: project.configurations?.sampleTypes || []
      }))
      
      setProjects(formattedProjects)
    } catch (error) {
      console.error('❌ Error loading projects from IndexedDB:', error)
      setProjects([])
    }
  }

  const loadParticipants = async () => {
    try {
      // OFFLINE-FIRST: Read participants from IndexedDB
      console.log('👥 Loading participants from IndexedDB...')
      
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const localParticipants = await offlineDB.getAll('participants')
      console.log(`✅ Loaded ${localParticipants.length} participants from IndexedDB`)
      
      // Format for form compatibility using correct database fields
      const formattedParticipants = localParticipants.map((p: any) => ({
        id: p.id,
        participant_id: p.participantId,  // Use participantId from database
        full_name: p.fullName,            // Use fullName from database
        age: p.age,
        gender: p.gender,
        household_id: p.householdId
      }))
      
      console.log('📋 Formatted participant sample:', formattedParticipants[0])
      
      setParticipants(formattedParticipants)
      
      if (localParticipants.length === 0) {
        console.log('ℹ️ No participants found in IndexedDB - add participants through the Participants module')
      }
    } catch (error) {
      console.error('❌ Error loading participants from IndexedDB:', error)
      setParticipants([])
    }
  }

  const handleProjectChange = (projectId: string) => {
    // Ignore the "no-projects" placeholder value
    if (projectId === "no-projects") {
      return
    }
    
    const project = projects.find(p => p.id === projectId)
    setSelectedProject(project || null)
    setSelectedSampleType(null)
    setFormData({})
  }

  const handleSampleTypeChange = (sampleTypeCode: string) => {
    const sampleType = sampleTypes.find(st => st.type_code === sampleTypeCode)
    setSelectedSampleType(sampleType || null)
    setFormData({})
  }

  const handleParticipantChange = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId)
    setSelectedParticipant(participant || null)
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Clear error when field is updated
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!selectedProject) {
      newErrors.project = 'Project is required'
    }

    if (!selectedSampleType) {
      newErrors.sampleType = 'Sample type is required'
    }

    if (!selectedParticipant) {
      newErrors.participant = 'Participant is required'
    }

    if (selectedSampleType) {
      selectedSampleType.form_schema.fields.forEach(field => {
        if (field.required && (!formData[field.name] || formData[field.name] === '')) {
          newErrors[field.name] = `${field.label} is required`
        }

        // Validate number fields
        if (field.type === 'number' && formData[field.name]) {
          const value = parseFloat(formData[field.name])
          if (isNaN(value) || value < 0) {
            newErrors[field.name] = `${field.label} must be a valid positive number`
          }
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const sampleData = {
        sampleTypeCode: selectedSampleType!.type_code,
        projectId: selectedProject!.id,
        participantId: selectedParticipant!.id,
        collectedBy: currentUser.id,
        collectionDate: new Date().toISOString(),
        collectionMetadata: formData,
        volumeCollected: formData.volume_collected ? parseFloat(formData.volume_collected) : undefined,
        containerCorrect: formData.container_correct !== 'No',
        temperatureAtCollection: formData.temperature_at_collection ? parseFloat(formData.temperature_at_collection) : undefined,
        transportNotes: formData.collection_notes || ''
      }

      // OFFLINE-FIRST: Save sample to IndexedDB + Sync Queue
      console.log('💾 Saving sample to IndexedDB (offline-first)...')
      
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      // Generate sample with proper BaseRecord structure
      const sampleWithId = {
        id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sampleId: `${selectedProject!.project_code}-${Date.now()}`,
        participantId: selectedParticipant!.id,
        householdId: '', // Will be populated when households are linked
        sampleType: selectedSampleType!.type_code,
        sampleCode: `${selectedProject!.project_code}-${Date.now()}`,
        collectionTimestamp: new Date().toISOString(),
        collectorId: currentUser.id,
        chainOfCustody: [],
        storageCondition: 'room_temperature',
        volume: formData.volume_collected ? parseFloat(formData.volume_collected) : undefined,
        containerType: formData.container_type || 'standard',
        status: 'collected',
        customFields: formData, // Store all form data
        projectId: selectedProject!.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending', // Will sync to cloud when online
        version: 1
      }
      
      // Save to IndexedDB - automatically adds to sync queue
      await offlineDB.create('samples', sampleWithId)
      console.log('✅ Sample saved to IndexedDB + added to sync queue:', sampleWithId.id)
      
      if (onSubmit) {
        onSubmit(sampleWithId)
      }
      
      // Reset form
      setSelectedProject(null)
      setSelectedSampleType(null) 
      setSelectedParticipant(null)
      setFormData({})
    } catch (error) {
      setErrors({ submit: 'Network error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderDynamicField = (field: any) => {
    const { name, type, label, required, options } = field
    const value = formData[name] || ''
    const hasError = !!errors[name]

    switch (type) {
      case 'text':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={name}
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-red-500 text-sm">{errors[name]}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={name}
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && <p className="text-red-500 text-sm">{errors[name]}</p>}
          </div>
        )

      case 'select':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Select 
              value={value} 
              onValueChange={(val) => handleFieldChange(name, val)}
            >
              <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-red-500 text-sm">{errors[name]}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={name}
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
              rows={3}
            />
            {hasError && <p className="text-red-500 text-sm">{errors[name]}</p>}
          </div>
        )

      default:
        return null
    }
  }

  const getAvailableSampleTypes = () => {
    if (!selectedProject) {
      console.log('⚠️ No project selected')
      return []
    }
    
    console.log('🔍 Getting available sample types...')
    console.log('📋 All loaded sample types:', sampleTypes)
    console.log('🎯 Selected project:', selectedProject)
    console.log('📝 Project expected types:', selectedProject.expected_sample_types)
    
    // If project has specific sample types configured, use those
    // Otherwise, show all active sample types from Settings
    if (selectedProject.expected_sample_types && selectedProject.expected_sample_types.length > 0) {
      const filtered = sampleTypes.filter(st => 
        selectedProject.expected_sample_types.includes(st.type_code)
      )
      console.log('✅ Filtered sample types (project-specific):', filtered)
      return filtered
    }
    
    // Show all sample types configured in Settings > Sample Types
    console.log('✅ Showing all sample types from Settings:', sampleTypes)
    return sampleTypes
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <TestTube className="w-6 h-6" />
          <h2 className="text-xl font-bold">New Sample Collection</h2>
        </div>
        <p className="text-muted-foreground">
          Collect a new sample using the dynamic form builder
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Project Selection */}
        <div className="space-y-2">
          <Label htmlFor="project">
            Project <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={selectedProject?.id || ''} 
            onValueChange={handleProjectChange}
          >
            <SelectTrigger className={errors.project ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.length === 0 ? (
                <SelectItem value="no-projects" disabled>
                  No projects available - Create a project first
                </SelectItem>
              ) : (
                projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_name} ({project.project_code})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.project && <p className="text-red-500 text-sm">{errors.project}</p>}
        </div>

        {/* Sample Type Selection */}
        {selectedProject && (
          <div className="space-y-2">
            <Label htmlFor="sampleType">
              Sample Type <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={selectedSampleType?.type_code || ''} 
              onValueChange={handleSampleTypeChange}
            >
              <SelectTrigger className={errors.sampleType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select sample type" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableSampleTypes().length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No sample types configured. Go to Settings → Sample Types to add sample types.
                  </div>
                ) : (
                  getAvailableSampleTypes().map((sampleType) => (
                    <SelectItem key={sampleType.type_code} value={sampleType.type_code}>
                      {sampleType.display_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.sampleType && <p className="text-red-500 text-sm">{errors.sampleType}</p>}
            {getAvailableSampleTypes().length > 0 && (
              <p className="text-xs text-muted-foreground">
                {getAvailableSampleTypes().length} sample type(s) available from Settings
              </p>
            )}
            
            {selectedSampleType && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedSampleType.display_name}</p>
                <p className="text-sm text-muted-foreground">{selectedSampleType.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Participant Selection */}
        {selectedSampleType && (
          <div className="space-y-2">
            <Label htmlFor="participant">
              Participant <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={selectedParticipant?.id || ''} 
              onValueChange={handleParticipantChange}
            >
              <SelectTrigger className={errors.participant ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select participant" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id}>
                    {participant.full_name} ({participant.participant_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.participant && <p className="text-red-500 text-sm">{errors.participant}</p>}
            
            {selectedParticipant && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{selectedParticipant.full_name}</span>
                  <Badge variant="outline">{selectedParticipant.participant_id}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Household: {selectedParticipant.household_id}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Form Fields */}
        {selectedSampleType && selectedParticipant && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5" />
              <h3 className="font-semibold">Collection Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedSampleType.form_schema.fields.map(renderDynamicField)}
            </div>
          </Card>
        )}

        {/* Collection Metadata */}
        {selectedSampleType && selectedParticipant && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5" />
              <h3 className="font-semibold">Collection Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Collected By</p>
                <p className="font-medium">{currentUser.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Collection Date</p>
                <p className="font-medium">{new Date().toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Project</p>
                <p className="font-medium">{selectedProject?.project_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sample Type</p>
                <p className="font-medium">{selectedSampleType?.display_name}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Form Errors */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-700">{errors.submit}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !selectedSampleType || !selectedParticipant}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Sample...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Create Sample
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
