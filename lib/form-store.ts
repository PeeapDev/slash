import { indexedDBService } from './indexdb-service'

// ─── Write-behind cache: synchronous in-memory + async IndexedDB persistence ───
let _formsCache: Form[] | null = null
let _responsesCache: FormResponse[] | null = null
let _hydrated = false

// Known fake/demo IDs to strip on hydration
const FAKE_FORM_IDS = new Set(['FORM-001', 'FORM-002'])

// Promise that resolves when IndexedDB hydration is complete
let _hydrateResolve: () => void
const _hydratePromise = new Promise<void>(resolve => { _hydrateResolve = resolve })

/** Wait for IndexedDB hydration to finish (safe to call multiple times). */
export function waitForHydration(): Promise<void> {
  if (_hydrated) return Promise.resolve()
  return _hydratePromise
}

// Hydrate cache from IndexedDB on module load (browser only)
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const idbForms = await indexedDBService.getAll<Form>('forms')
      if (idbForms && idbForms.length > 0 && !_formsCache) {
        // Filter out legacy demo forms
        const clean = idbForms.filter(f => !FAKE_FORM_IDS.has(f.id))
        _formsCache = clean
        // Persist cleaned list if we removed anything
        if (clean.length !== idbForms.length) {
          persistFormsToIDB(clean)
        }
      }
      const idbResponses = await indexedDBService.getAll<FormResponse>('form_responses')
      if (idbResponses && idbResponses.length > 0 && !_responsesCache) {
        // Filter out responses linked to demo forms
        const clean = idbResponses.filter(r => !FAKE_FORM_IDS.has(r.formId))
        _responsesCache = clean
        if (clean.length !== idbResponses.length) {
          persistResponsesToIDB(clean)
        }
      }
      _hydrated = true
      _hydrateResolve()
    } catch (e) {
      console.warn('IndexedDB hydration failed, using fallback:', e)
      _hydrated = true
      _hydrateResolve()
    }
  })()
} else {
  _hydrated = true
  _hydrateResolve!()
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

export function getForms(): Form[] {
  if (_formsCache) return _formsCache

  // Start empty — no demo data
  _formsCache = []
  return _formsCache
}

export function saveForms(forms: Form[]): void {
  _formsCache = forms
  persistFormsToIDB(forms)
}

export function getFormResponses(): FormResponse[] {
  if (_responsesCache) return _responsesCache

  // Start empty — no demo data
  _responsesCache = []
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
