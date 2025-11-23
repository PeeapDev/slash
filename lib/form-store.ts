export interface FormField {
  id: string
  type: 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 'file'
  label: string
  placeholder?: string
  hint?: string
  required: boolean
  options?: string[] // for select, radio, checkbox
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface Form {
  id: string
  name: string
  type: 'survey' | 'sample'
  targetRole: string
  assignedProjects: string[]
  assignedRegions: string[]
  fields: FormField[]
  createdBy: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'archived'
}

export interface FormResponse {
  id: string
  formId: string
  responses: Record<string, any>
  submittedBy: string
  submittedAt: string
  linkedTo?: {
    householdId?: string
    participantId?: string
    sampleId?: string
    projectId?: string
  }
  status: 'draft' | 'submitted' | 'synced'
}

// Sample forms data
const sampleForms: Form[] = [
  {
    id: 'FORM-001',
    name: 'Household Demographics Survey',
    type: 'survey',
    targetRole: 'field-collector',
    assignedProjects: ['proj-001', 'proj-002'],
    assignedRegions: ['north', 'south'],
    fields: [
      {
        id: 'field-001',
        type: 'text',
        label: 'Head of Household Name',
        required: true,
        placeholder: 'Enter full name'
      },
      {
        id: 'field-002',
        type: 'number',
        label: 'Number of Household Members',
        required: true,
        validation: { min: 1, max: 20, message: 'Must be between 1 and 20' }
      },
      {
        id: 'field-003',
        type: 'select',
        label: 'Primary Water Source',
        required: true,
        options: ['Tap water', 'Well water', 'River/Stream', 'Borehole', 'Other']
      },
      {
        id: 'field-004',
        type: 'radio',
        label: 'Electricity Access',
        required: true,
        options: ['Grid electricity', 'Solar power', 'Generator', 'No electricity']
      }
    ],
    createdBy: 'admin@slash.org',
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-11-15T14:30:00Z',
    status: 'active'
  },
  {
    id: 'FORM-002',
    name: 'Urine Sample Collection',
    type: 'sample',
    targetRole: 'field-collector',
    assignedProjects: ['proj-001'],
    assignedRegions: ['north', 'east'],
    fields: [
      {
        id: 'field-005',
        type: 'text',
        label: 'Sample ID',
        required: true,
        placeholder: 'Auto-generated or manual entry'
      },
      {
        id: 'field-006',
        type: 'date',
        label: 'Collection Date',
        required: true
      },
      {
        id: 'field-007',
        type: 'time',
        label: 'Collection Time',
        required: true
      },
      {
        id: 'field-008',
        type: 'select',
        label: 'Sample Quality',
        required: true,
        options: ['Excellent', 'Good', 'Acceptable', 'Poor', 'Rejected']
      },
      {
        id: 'field-009',
        type: 'checkbox',
        label: 'Storage Conditions Met',
        required: true,
        options: ['Temperature controlled', 'Proper labeling', 'Chain of custody', 'Contamination prevention']
      }
    ],
    createdBy: 'admin@slash.org',
    createdAt: '2024-11-05T09:15:00Z',
    updatedAt: '2024-11-10T16:45:00Z',
    status: 'active'
  }
]

const sampleResponses: FormResponse[] = [
  {
    id: 'resp-001',
    formId: 'FORM-001',
    responses: {
      'field-001': 'John Kamau',
      'field-002': 5,
      'field-003': 'Tap water',
      'field-004': 'Grid electricity'
    },
    submittedBy: 'collector@field.org',
    submittedAt: '2024-11-20T14:30:00Z',
    linkedTo: {
      householdId: 'HH-001',
      projectId: 'proj-001'
    },
    status: 'synced'
  }
]

export function getForms(): Form[] {
  const stored = localStorage.getItem('slash_forms')
  return stored ? JSON.parse(stored) : sampleForms
}

export function saveForms(forms: Form[]): void {
  localStorage.setItem('slash_forms', JSON.stringify(forms))
}

export function getFormResponses(): FormResponse[] {
  const stored = localStorage.getItem('slash_form_responses')
  return stored ? JSON.parse(stored) : sampleResponses
}

export function saveFormResponses(responses: FormResponse[]): void {
  localStorage.setItem('slash_form_responses', JSON.stringify(responses))
}

export function getFormById(id: string): Form | undefined {
  return getForms().find(form => form.id === id)
}

export function createForm(form: Omit<Form, 'id' | 'createdAt' | 'updatedAt'>): Form {
  const forms = getForms()
  const newForm: Form = {
    ...form,
    id: `FORM-${String(forms.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  forms.push(newForm)
  saveForms(forms)
  return newForm
}

export function updateForm(id: string, updates: Partial<Form>): Form | null {
  const forms = getForms()
  const index = forms.findIndex(form => form.id === id)
  
  if (index === -1) return null
  
  forms[index] = {
    ...forms[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  saveForms(forms)
  return forms[index]
}

export function deleteForm(id: string): boolean {
  const forms = getForms()
  const filteredForms = forms.filter(form => form.id !== id)
  
  if (filteredForms.length === forms.length) return false
  
  saveForms(filteredForms)
  return true
}

export function cloneForm(id: string, newName: string): Form | null {
  const originalForm = getFormById(id)
  if (!originalForm) return null
  
  return createForm({
    ...originalForm,
    name: newName,
    status: 'active'
  })
}

export function submitFormResponse(response: Omit<FormResponse, 'id' | 'submittedAt'>): FormResponse {
  const responses = getFormResponses()
  const newResponse: FormResponse = {
    ...response,
    id: `resp-${String(responses.length + 1).padStart(3, '0')}`,
    submittedAt: new Date().toISOString()
  }
  
  responses.push(newResponse)
  saveFormResponses(responses)
  return newResponse
}
