"use client"

import { indexedDBService } from './indexdb-service'

// Offline-first form store using IndexedDB
// Replaces localStorage-based form-store.ts

export interface Form {
  id: string
  name: string
  description: string
  fields: FormField[]
  metadata: {
    version: string
    createdBy: string
    category: 'household' | 'participant' | 'sample' | 'lab' | 'survey' | 'other'
    tags: string[]
  }
  settings: {
    allowMultipleSubmissions: boolean
    requireAuthentication: boolean
    enableOfflineMode: boolean
    autoSave: boolean
    validationRules: ValidationRule[]
  }
  createdAt: string
  updatedAt: string
  isActive: boolean
  syncStatus: 'pending' | 'synced' | 'error'
}

export interface FormField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'date' | 'datetime' | 'file' | 'signature' | 'gps' | 'barcode'
  required: boolean
  placeholder?: string
  helpText?: string
  defaultValue?: any
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
    customRules?: string[]
  }
  options?: FormOption[]
  conditional?: {
    field: string
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
    value: any
  }
  metadata?: {
    dataType?: string
    category?: string
    priority?: 'low' | 'medium' | 'high'
  }
}

export interface FormOption {
  value: string
  label: string
  description?: string
}

export interface ValidationRule {
  field: string
  rule: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface FormResponse {
  id: string
  formId: string
  formVersion: string
  data: { [fieldName: string]: any }
  metadata: {
    submittedBy: string
    submittedAt: string
    deviceInfo: {
      userAgent: string
      platform: string
      isOnline: boolean
      location?: {
        latitude: number
        longitude: number
        accuracy: number
      }
    }
    formContext: {
      participantId?: string
      householdId?: string
      sampleId?: string
      projectId?: string
    }
  }
  validation: {
    isValid: boolean
    errors: ValidationError[]
    warnings: ValidationError[]
  }
  status: 'draft' | 'submitted' | 'processing' | 'completed' | 'error'
  syncStatus: 'pending' | 'synced' | 'error'
  attachments?: FileAttachment[]
  createdAt: string
  updatedAt: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'error' | 'warning' | 'info'
}

export interface FileAttachment {
  id: string
  fieldName: string
  fileName: string
  fileType: string
  fileSize: number
  base64Data: string
  uploadStatus: 'pending' | 'uploaded' | 'error'
}

// Default sample forms for health data collection
const defaultForms: Form[] = [
  {
    id: 'household-registration',
    name: 'Household Registration',
    description: 'Register new household for health study participation',
    fields: [
      {
        id: 'household_id',
        name: 'householdId',
        label: 'Household ID',
        type: 'text',
        required: true,
        placeholder: 'HH001',
        validation: { pattern: '^HH\\d{3,6}$' }
      },
      {
        id: 'head_of_household',
        name: 'headOfHousehold',
        label: 'Head of Household',
        type: 'text',
        required: true
      },
      {
        id: 'phone_number',
        name: 'phoneNumber',
        label: 'Phone Number',
        type: 'tel',
        required: false
      },
      {
        id: 'location',
        name: 'location',
        label: 'Location/Address',
        type: 'textarea',
        required: true
      },
      {
        id: 'family_size',
        name: 'familySize',
        label: 'Family Size',
        type: 'number',
        required: true,
        validation: { min: 1, max: 20 }
      },
      {
        id: 'water_source',
        name: 'waterSource',
        label: 'Primary Water Source',
        type: 'select',
        required: true,
        options: [
          { value: 'piped_water', label: 'Piped Water' },
          { value: 'well', label: 'Well' },
          { value: 'borehole', label: 'Borehole' },
          { value: 'surface_water', label: 'Surface Water' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        id: 'sanitation',
        name: 'sanitationFacility',
        label: 'Sanitation Facility',
        type: 'select',
        required: true,
        options: [
          { value: 'flush_toilet', label: 'Flush Toilet' },
          { value: 'pit_latrine', label: 'Pit Latrine' },
          { value: 'composting_toilet', label: 'Composting Toilet' },
          { value: 'none', label: 'None' },
          { value: 'other', label: 'Other' }
        ]
      }
    ],
    metadata: {
      version: '1.0',
      createdBy: 'system',
      category: 'household',
      tags: ['registration', 'household', 'demographics']
    },
    settings: {
      allowMultipleSubmissions: false,
      requireAuthentication: true,
      enableOfflineMode: true,
      autoSave: true,
      validationRules: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    syncStatus: 'synced'
  },
  {
    id: 'participant-registration',
    name: 'Participant Registration',
    description: 'Register individual participants within households',
    fields: [
      {
        id: 'participant_id',
        name: 'participantId',
        label: 'Participant ID',
        type: 'text',
        required: true,
        placeholder: 'P001'
      },
      {
        id: 'full_name',
        name: 'fullName',
        label: 'Full Name',
        type: 'text',
        required: true
      },
      {
        id: 'age',
        name: 'age',
        label: 'Age',
        type: 'number',
        required: true,
        validation: { min: 0, max: 120 }
      },
      {
        id: 'gender',
        name: 'gender',
        label: 'Gender',
        type: 'radio',
        required: true,
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        id: 'relation_to_head',
        name: 'relationToHead',
        label: 'Relationship to Head of Household',
        type: 'select',
        required: true,
        options: [
          { value: 'head', label: 'Head' },
          { value: 'spouse', label: 'Spouse' },
          { value: 'child', label: 'Child' },
          { value: 'parent', label: 'Parent' },
          { value: 'sibling', label: 'Sibling' },
          { value: 'other_relative', label: 'Other Relative' },
          { value: 'non_relative', label: 'Non-Relative' }
        ]
      },
      {
        id: 'pregnancy_status',
        name: 'pregnancyStatus',
        label: 'Pregnancy Status',
        type: 'radio',
        required: false,
        options: [
          { value: 'pregnant', label: 'Pregnant' },
          { value: 'not_pregnant', label: 'Not Pregnant' },
          { value: 'unknown', label: 'Unknown' }
        ],
        conditional: {
          field: 'gender',
          operator: 'equals',
          value: 'female'
        }
      }
    ],
    metadata: {
      version: '1.0',
      createdBy: 'system',
      category: 'participant',
      tags: ['registration', 'participant', 'demographics']
    },
    settings: {
      allowMultipleSubmissions: true,
      requireAuthentication: true,
      enableOfflineMode: true,
      autoSave: true,
      validationRules: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    syncStatus: 'synced'
  }
]

// Form management functions

export async function getForms(): Promise<Form[]> {
  try {
    const forms = await indexedDBService.getAll<Form>('forms')
    return forms.length > 0 ? forms : defaultForms
  } catch (error) {
    console.error('Error getting forms:', error)
    return defaultForms
  }
}

export async function getFormById(id: string): Promise<Form | null> {
  try {
    const form = await indexedDBService.get<Form>('forms', id)
    if (form) {
      return form
    }
    
    // Check default forms
    return defaultForms.find(f => f.id === id) || null
  } catch (error) {
    console.error('Error getting form by ID:', error)
    return null
  }
}

export async function saveForm(form: Omit<Form, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Form> {
  const timestamp = new Date().toISOString()
  const formData: Form = {
    id: `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'pending',
    ...form
  }

  await indexedDBService.set('forms', formData)
  
  // Add to offline queue for sync
  await indexedDBService.addToOfflineQueue({
    type: 'CREATE',
    entity: 'forms',
    data: formData
  })

  return formData
}

export async function updateForm(id: string, updates: Partial<Form>): Promise<void> {
  try {
    const existing = await indexedDBService.get<Form>('forms', id)
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const
      }
      
      await indexedDBService.set('forms', updated)
      
      // Add to offline queue for sync
      await indexedDBService.addToOfflineQueue({
        type: 'UPDATE',
        entity: 'forms',
        data: updated
      })
    }
  } catch (error) {
    console.error('Error updating form:', error)
  }
}

export async function deleteForm(id: string): Promise<void> {
  try {
    await indexedDBService.delete('forms', id)
    
    // Add to offline queue for sync
    await indexedDBService.addToOfflineQueue({
      type: 'DELETE',
      entity: 'forms',
      data: { id }
    })
  } catch (error) {
    console.error('Error deleting form:', error)
  }
}

// Form response functions

export async function getFormResponses(): Promise<FormResponse[]> {
  try {
    return await indexedDBService.getAll<FormResponse>('form_responses')
  } catch (error) {
    console.error('Error getting form responses:', error)
    return []
  }
}

export async function getResponsesByForm(formId: string): Promise<FormResponse[]> {
  try {
    return await indexedDBService.getByIndex<FormResponse>('form_responses', 'formId', formId)
  } catch (error) {
    console.error('Error getting responses by form:', error)
    return []
  }
}

export async function getResponsesByUser(userId: string): Promise<FormResponse[]> {
  try {
    return await indexedDBService.getByIndex<FormResponse>('form_responses', 'submittedBy', userId)
  } catch (error) {
    console.error('Error getting responses by user:', error)
    return []
  }
}

export async function saveFormResponse(response: Omit<FormResponse, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<FormResponse> {
  const timestamp = new Date().toISOString()
  const responseData: FormResponse = {
    id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'pending',
    ...response
  }

  await indexedDBService.set('form_responses', responseData)
  
  // Add to offline queue for sync
  await indexedDBService.addToOfflineQueue({
    type: 'CREATE',
    entity: 'form_responses',
    data: responseData
  })

  return responseData
}

export async function updateFormResponse(id: string, updates: Partial<FormResponse>): Promise<void> {
  try {
    const existing = await indexedDBService.get<FormResponse>('form_responses', id)
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const
      }
      
      await indexedDBService.set('form_responses', updated)
      
      // Add to offline queue for sync
      await indexedDBService.addToOfflineQueue({
        type: 'UPDATE',
        entity: 'form_responses',
        data: updated
      })
    }
  } catch (error) {
    console.error('Error updating form response:', error)
  }
}

// Validation functions

export function validateFormData(form: Form, data: { [key: string]: any }): ValidationError[] {
  const errors: ValidationError[] = []

  form.fields.forEach(field => {
    const value = data[field.name]

    // Required field validation
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: field.name,
        message: `${field.label} is required`,
        code: 'REQUIRED_FIELD',
        severity: 'error'
      })
      return
    }

    // Skip further validation if field is empty and not required
    if (!value) return

    // Type-specific validation
    if (field.type === 'email' && !isValidEmail(value)) {
      errors.push({
        field: field.name,
        message: 'Please enter a valid email address',
        code: 'INVALID_EMAIL',
        severity: 'error'
      })
    }

    if (field.type === 'number' && isNaN(Number(value))) {
      errors.push({
        field: field.name,
        message: 'Please enter a valid number',
        code: 'INVALID_NUMBER',
        severity: 'error'
      })
    }

    // Validation rules
    if (field.validation) {
      const validation = field.validation

      if (validation.min !== undefined && Number(value) < validation.min) {
        errors.push({
          field: field.name,
          message: `Value must be at least ${validation.min}`,
          code: 'MIN_VALUE',
          severity: 'error'
        })
      }

      if (validation.max !== undefined && Number(value) > validation.max) {
        errors.push({
          field: field.name,
          message: `Value must be at most ${validation.max}`,
          code: 'MAX_VALUE',
          severity: 'error'
        })
      }

      if (validation.minLength !== undefined && String(value).length < validation.minLength) {
        errors.push({
          field: field.name,
          message: `Must be at least ${validation.minLength} characters`,
          code: 'MIN_LENGTH',
          severity: 'error'
        })
      }

      if (validation.maxLength !== undefined && String(value).length > validation.maxLength) {
        errors.push({
          field: field.name,
          message: `Must be at most ${validation.maxLength} characters`,
          code: 'MAX_LENGTH',
          severity: 'error'
        })
      }

      if (validation.pattern && !new RegExp(validation.pattern).test(String(value))) {
        errors.push({
          field: field.name,
          message: 'Invalid format',
          code: 'INVALID_PATTERN',
          severity: 'error'
        })
      }
    }
  })

  return errors
}

// Utility functions

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function initializeDefaultForms(): Promise<void> {
  try {
    const existingForms = await indexedDBService.getAll<Form>('forms')
    
    if (existingForms.length === 0) {
      console.log('Initializing default forms...')
      await indexedDBService.setAll('forms', defaultForms)
      console.log('Default forms initialized successfully')
    }
  } catch (error) {
    console.error('Error initializing default forms:', error)
  }
}

// Auto-initialize default forms
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initializeDefaultForms()
  }, 2000)
}
