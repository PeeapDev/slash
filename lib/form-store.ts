import { indexedDBService } from './indexdb-service'

// ─── Write-behind cache: synchronous in-memory + async IndexedDB persistence ───
let _formsCache: Form[] | null = null
let _responsesCache: FormResponse[] | null = null
let _hydrated = false

// Hydrate cache from IndexedDB on module load (browser only)
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const idbForms = await indexedDBService.getAll<Form>('forms')
      if (idbForms && idbForms.length > 0 && !_formsCache) {
        _formsCache = idbForms
      }
      const idbResponses = await indexedDBService.getAll<FormResponse>('form_responses')
      if (idbResponses && idbResponses.length > 0 && !_responsesCache) {
        _responsesCache = idbResponses
      }
      _hydrated = true
    } catch (e) {
      console.warn('IndexedDB hydration failed, using fallback:', e)
    }
  })()
}

function persistFormsToIDB(forms: Form[]) {
  indexedDBService.setAll('forms', forms).catch(e => console.warn('IDB forms persist failed:', e))
}

function persistResponsesToIDB(responses: FormResponse[]) {
  indexedDBService.setAll('form_responses', responses).catch(e => console.warn('IDB responses persist failed:', e))
}

// ─── Condition for skip logic / relevance ───
export interface FieldCondition {
  fieldId: string          // the field this condition references
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty' | 'in' | 'not_in'
  value?: any              // the value to compare against
  conjunction?: 'and' | 'or' // how to combine with next condition
}

// ─── Constraint / validation rule ───
export interface FieldConstraint {
  type: 'regex' | 'range' | 'length' | 'custom_expression' | 'unique' | 'email' | 'phone' | 'url'
  value?: any              // regex string, {min,max}, etc.
  min?: number
  max?: number
  message: string          // error message shown when constraint fails
}

// ─── Cascading select choice ───
export interface CascadingChoice {
  value: string
  label: string
  parentValue?: string     // links to parent field's selected value
}

export interface FormField {
  id: string
  type: 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 'file'
    | 'email' | 'phone' | 'gps' | 'likert' | 'note' | 'rating' | 'range' | 'image' | 'barcode'
    | 'calculate' | 'integer' | 'decimal' | 'dateTime' | 'ranking'
  label: string
  placeholder?: string
  hint?: string
  required: boolean
  options?: string[]                 // for select, radio, checkbox, likert, ranking
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  // ── KoboToolbox / SurveyCTO-style features ──
  relevance?: FieldCondition[]       // skip logic: show field only when conditions met
  constraints?: FieldConstraint[]    // validation constraints
  appearance?: 'minimal' | 'horizontal' | 'likert' | 'multiline' | 'signature' | 'map' | 'label' | 'quick'
  defaultValue?: string | number     // default / pre-filled value
  readOnly?: boolean                 // computed or locked fields
  calculation?: string               // expression: e.g. "${field-001} + ${field-002}"
  cascadingParentId?: string         // parent field for cascading selects
  cascadingChoices?: CascadingChoice[]
  groupId?: string                   // for grouping fields into sections
  repeatGroupId?: string             // for repeat groups
  repeatMin?: number
  repeatMax?: number
  ratingMax?: number                 // for rating type (e.g. 5 stars)
  rangeMin?: number                  // for range slider
  rangeMax?: number
  rangeStep?: number
  likertLabels?: string[]            // custom labels for likert scale
  acknowledgeLabel?: string          // for note/acknowledge fields
  choiceFilterExpression?: string    // ODK-style choice_filter expression for dynamic option filtering
  orOther?: boolean                  // auto-append "Other" option with free-text input
  guidanceHint?: string              // collapsible "More info" below hint
  randomizeChoices?: boolean         // Fisher-Yates shuffle options before rendering
  // ── Multi-language ──
  translations?: Record<string, { label: string; hint?: string; guidanceHint?: string; options?: string[] }>
  // ODK metadata — auto-captured fields (start, end, today, deviceid, etc.)
  metadata?: 'start' | 'end' | 'today' | 'deviceid' | 'phonenumber' | 'username' | 'email' | 'simserial' | 'subscriberid' | 'audit' | 'start-geopoint' | 'background-audio'
  name?: string  // original XLSForm field name
}

// ─── Group metadata (canonical location) ───
export interface FormGroupMeta {
  id: string
  label: string
  description?: string
  collapsed: boolean
  appearance?: 'field-list' | string   // field-list = render all fields on single page
}

export interface RepeatGroupMeta {
  id: string
  label: string
  collapsed: boolean
  repeatMin?: number
  repeatMax?: number
}

export interface FormVersion {
  version: number
  publishedBy: string
  publishedAt: string
  fieldCount: number
}

export interface Form {
  id: string
  name: string
  type: 'survey' | 'sample'
  targetRole: string
  assignedProjects: string[]
  assignedRegions: string[]
  fields: FormField[]
  groups?: FormGroupMeta[]
  repeatGroups?: RepeatGroupMeta[]
  createdBy: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'archived'
  publishStatus: 'draft' | 'published'
  publishedAt?: string
  // ODK Central extensions
  projectId?: string
  odkStatus?: 'open' | 'closing' | 'closed'
  versions?: FormVersion[]
  // Multi-language
  languages?: string[]
  defaultLanguage?: string
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

// Sample forms data — demonstrates skip logic, constraints, cascading, calculated fields
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
        placeholder: 'Enter full name',
        constraints: [{ type: 'length', min: 2, max: 100, message: 'Name must be 2–100 characters' }]
      },
      {
        id: 'field-001b',
        type: 'email',
        label: 'Contact Email',
        required: false,
        placeholder: 'email@example.com',
        hint: 'Optional — for follow-up communication'
      },
      {
        id: 'field-001c',
        type: 'phone',
        label: 'Contact Phone',
        required: false,
        placeholder: '+1 234 567 8900',
        hint: 'Include country code'
      },
      {
        id: 'field-002',
        type: 'integer',
        label: 'Number of Adults (18+)',
        required: true,
        constraints: [{ type: 'range', min: 0, max: 20, message: 'Must be between 0 and 20' }]
      },
      {
        id: 'field-002b',
        type: 'integer',
        label: 'Number of Children (under 18)',
        required: true,
        constraints: [{ type: 'range', min: 0, max: 20, message: 'Must be between 0 and 20' }]
      },
      {
        id: 'field-002c',
        type: 'calculate',
        label: 'Total Household Members',
        required: false,
        calculation: '${field-002} + ${field-002b}',
        readOnly: true,
        hint: 'Auto-calculated from adults + children'
      },
      {
        id: 'field-003',
        type: 'select',
        label: 'Region',
        required: true,
        options: ['North', 'South', 'East', 'West']
      },
      {
        id: 'field-003b',
        type: 'select',
        label: 'District',
        required: true,
        cascadingParentId: 'field-003',
        cascadingChoices: [
          { value: 'north-a', label: 'Kigali', parentValue: 'North' },
          { value: 'north-b', label: 'Musanze', parentValue: 'North' },
          { value: 'north-c', label: 'Gicumbi', parentValue: 'North' },
          { value: 'south-a', label: 'Huye', parentValue: 'South' },
          { value: 'south-b', label: 'Nyanza', parentValue: 'South' },
          { value: 'east-a', label: 'Rwamagana', parentValue: 'East' },
          { value: 'east-b', label: 'Kayonza', parentValue: 'East' },
          { value: 'west-a', label: 'Rubavu', parentValue: 'West' },
          { value: 'west-b', label: 'Karongi', parentValue: 'West' },
        ],
        hint: 'Select region first'
      },
      {
        id: 'field-004',
        type: 'select',
        label: 'Primary Water Source',
        required: true,
        options: ['Tap water', 'Well water', 'River/Stream', 'Borehole', 'Other']
      },
      {
        id: 'field-004b',
        type: 'text',
        label: 'Specify Other Water Source',
        required: true,
        placeholder: 'Please describe',
        relevance: [{ fieldId: 'field-004', operator: 'eq', value: 'Other' }]
      },
      {
        id: 'field-005x',
        type: 'radio',
        label: 'Electricity Access',
        required: true,
        options: ['Grid electricity', 'Solar power', 'Generator', 'No electricity']
      },
      {
        id: 'field-005y',
        type: 'integer',
        label: 'Average hours of electricity per day',
        required: true,
        constraints: [{ type: 'range', min: 1, max: 24, message: 'Must be between 1 and 24 hours' }],
        relevance: [{ fieldId: 'field-005x', operator: 'neq', value: 'No electricity' }],
        hint: 'Only shown if household has electricity'
      },
      {
        id: 'field-006x',
        type: 'likert',
        label: 'How satisfied are you with your water supply?',
        required: true,
        options: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'],
        hint: 'Rate from 1 (Very Dissatisfied) to 5 (Very Satisfied)'
      },
      {
        id: 'field-007x',
        type: 'rating',
        label: 'Rate the overall living conditions',
        required: true,
        ratingMax: 5,
        hint: 'Click to rate 1–5 stars'
      },
      {
        id: 'field-008x',
        type: 'range',
        label: 'Monthly household income (USD)',
        required: false,
        rangeMin: 0,
        rangeMax: 5000,
        rangeStep: 50,
        hint: 'Drag the slider to approximate income'
      },
      {
        id: 'field-009x',
        type: 'note',
        label: 'Thank you for completing the household section. The following questions are about health.',
        required: false,
        acknowledgeLabel: 'I have read this note'
      },
      {
        id: 'field-010x',
        type: 'radio',
        label: 'Has any household member been ill in the past 2 weeks?',
        required: true,
        options: ['Yes', 'No']
      },
      {
        id: 'field-010y',
        type: 'checkbox',
        label: 'What symptoms were observed?',
        required: true,
        options: ['Fever', 'Cough', 'Diarrhea', 'Vomiting', 'Skin rash', 'Other'],
        relevance: [{ fieldId: 'field-010x', operator: 'eq', value: 'Yes' }],
        hint: 'Select all that apply — only shown if illness reported'
      },
      {
        id: 'field-010z',
        type: 'text',
        label: 'Describe other symptoms',
        required: true,
        relevance: [
          { fieldId: 'field-010x', operator: 'eq', value: 'Yes', conjunction: 'and' },
          { fieldId: 'field-010y', operator: 'contains', value: 'Other' }
        ],
        hint: 'Only shown if "Other" symptom is selected'
      }
    ],
    createdBy: 'admin@slash.org',
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-11-15T14:30:00Z',
    status: 'active',
    publishStatus: 'published',
    publishedAt: '2024-11-15T14:30:00Z',
    versions: [{ version: 1, publishedBy: 'admin@slash.org', publishedAt: '2024-11-15T14:30:00Z', fieldCount: 18 }]
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
        id: 'field-s01',
        type: 'text',
        label: 'Sample ID',
        required: true,
        placeholder: 'Auto-generated or manual entry',
        constraints: [
          { type: 'regex', value: '^[A-Z]{2,4}-\\d{3,6}$', message: 'Format: XX-000 (e.g. UR-001234)' }
        ]
      },
      {
        id: 'field-s02',
        type: 'date',
        label: 'Collection Date',
        required: true
      },
      {
        id: 'field-s03',
        type: 'time',
        label: 'Collection Time',
        required: true
      },
      {
        id: 'field-s04',
        type: 'decimal',
        label: 'Sample Volume (mL)',
        required: true,
        constraints: [{ type: 'range', min: 0.1, max: 500, message: 'Volume must be 0.1–500 mL' }],
        hint: 'Enter volume in milliliters'
      },
      {
        id: 'field-s05',
        type: 'select',
        label: 'Sample Quality',
        required: true,
        options: ['Excellent', 'Good', 'Acceptable', 'Poor', 'Rejected']
      },
      {
        id: 'field-s05b',
        type: 'text',
        label: 'Reason for Poor/Rejected Quality',
        required: true,
        appearance: 'multiline',
        relevance: [
          { fieldId: 'field-s05', operator: 'in', value: 'Poor,Rejected' }
        ],
        hint: 'Required when quality is Poor or Rejected'
      },
      {
        id: 'field-s06',
        type: 'checkbox',
        label: 'Storage Conditions Met',
        required: true,
        options: ['Temperature controlled', 'Proper labeling', 'Chain of custody', 'Contamination prevention']
      },
      {
        id: 'field-s07',
        type: 'rating',
        label: 'Collector confidence in sample integrity',
        required: true,
        ratingMax: 5,
        hint: '1 = Low confidence, 5 = High confidence'
      },
      {
        id: 'field-s08',
        type: 'note',
        label: 'Ensure the sample is stored at 2–8°C within 30 minutes of collection. Label with participant ID and date.',
        required: false,
        acknowledgeLabel: 'I confirm proper storage protocol'
      }
    ],
    createdBy: 'admin@slash.org',
    createdAt: '2024-11-05T09:15:00Z',
    updatedAt: '2024-11-10T16:45:00Z',
    status: 'active',
    publishStatus: 'published',
    publishedAt: '2024-11-10T16:45:00Z',
    versions: [{ version: 1, publishedBy: 'admin@slash.org', publishedAt: '2024-11-10T16:45:00Z', fieldCount: 9 }]
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
  if (_formsCache) return _formsCache

  _formsCache = [...sampleForms]
  persistFormsToIDB(_formsCache)
  return _formsCache
}

export function saveForms(forms: Form[]): void {
  _formsCache = forms
  persistFormsToIDB(forms)
}

export function getFormResponses(): FormResponse[] {
  if (_responsesCache) return _responsesCache

  _responsesCache = [...sampleResponses]
  persistResponsesToIDB(_responsesCache)
  return _responsesCache
}

export function saveFormResponses(responses: FormResponse[]): void {
  _responsesCache = responses
  persistResponsesToIDB(responses)
}

export function updateFormResponse(responseId: string, updates: Partial<FormResponse>): FormResponse | null {
  const responses = getFormResponses()
  const index = responses.findIndex(r => r.id === responseId)
  if (index === -1) return null
  responses[index] = { ...responses[index], ...updates }
  saveFormResponses(responses)
  return responses[index]
}

export function getFormById(id: string): Form | undefined {
  return getForms().find(form => form.id === id)
}

export function createForm(form: Omit<Form, 'id' | 'createdAt' | 'updatedAt'>): Form {
  const forms = getForms()
  const newForm: Form = {
    ...form,
    id: `FORM-${String(forms.length + 1).padStart(3, '0')}`,
    publishStatus: form.publishStatus || 'draft',
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
    status: 'active',
    publishStatus: 'draft',
    publishedAt: undefined,
    versions: [],
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

export function getFormsByProject(projectId: string): Form[] {
  return getForms().filter(f => f.projectId === projectId)
}

export function publishForm(id: string): Form | null {
  const forms = getForms()
  const index = forms.findIndex(f => f.id === id)
  if (index === -1) return null

  const form = forms[index]
  const now = new Date().toISOString()
  const existingVersions = form.versions || []
  const nextVersion = existingVersions.length > 0
    ? existingVersions[existingVersions.length - 1].version + 1
    : 1

  forms[index] = {
    ...form,
    publishStatus: 'published',
    publishedAt: now,
    updatedAt: now,
    versions: [
      ...existingVersions,
      {
        version: nextVersion,
        publishedBy: form.createdBy || 'current-user',
        publishedAt: now,
        fieldCount: form.fields.length,
      },
    ],
  }

  saveForms(forms)
  return forms[index]
}
