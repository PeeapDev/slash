"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Plus,
  Edit3,
  Copy,
  Trash2,
  Eye,
  Search,
  FileText,
  Beaker,
  Link2,
  Share2,
  Check,
  MoreHorizontal,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Upload,
  Sparkles,
  LayoutTemplate,
  ClipboardList,
  Stethoscope,
  Home,
  Users,
  Activity,
  Baby,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Form, getForms, deleteForm, cloneForm, getFormResponses, createForm } from "@/lib/form-store"
import FormBuilderEditor from "./form-builder-editor"
import FormPreview from "./form-preview"
import XLSFormImportDialog from "./xlsform-import-dialog"
import { Textarea } from "@/components/ui/textarea"
import { getDefaultProvider } from "@/lib/ai-store"

type SortColumn = 'name' | 'type' | 'status' | 'questions' | 'submissions' | 'modified'
type SortDirection = 'asc' | 'desc'

// ─── Form Templates ───

interface FormTemplate {
  id: string
  name: string
  description: string
  icon: React.ElementType
  type: 'survey' | 'sample'
  category: string
  fields: any[]
}

const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'tpl-household',
    name: 'Household Survey',
    description: 'Demographics, family composition, and living conditions with skip logic',
    icon: Home,
    type: 'survey',
    category: 'Health Survey',
    fields: [
      { id: 'hh_id', name: 'hh_id', label: 'Household ID', type: 'text', required: true },
      { id: 'head_name', name: 'head_name', label: 'Head of Household Name', type: 'text', required: true },
      { id: 'head_gender', name: 'head_gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female'] },
      { id: 'num_members', name: 'num_members', label: 'Number of Household Members', type: 'number', required: true, validation: { min: 1, max: 50 } },
      { id: 'has_children', name: 'has_children', label: 'Are there children under 5?', type: 'select', required: true, options: ['Yes', 'No'] },
      { id: 'num_children', name: 'num_children', label: 'Number of children under 5', type: 'number', skipLogic: { field: 'has_children', operator: 'equals', value: 'Yes' }, validation: { min: 1, max: 20 } },
      { id: 'water_source', name: 'water_source', label: 'Primary Water Source', type: 'select', required: true, options: ['Piped water', 'Borehole', 'Well', 'River/Stream', 'Rainwater', 'Other'] },
      { id: 'water_other', name: 'water_other', label: 'Specify other water source', type: 'text', skipLogic: { field: 'water_source', operator: 'equals', value: 'Other' } },
      { id: 'gps', name: 'gps', label: 'GPS Location', type: 'geopoint' },
      { id: 'photo', name: 'photo', label: 'Household Photo', type: 'image' },
    ],
  },
  {
    id: 'tpl-health-screening',
    name: 'Health Screening',
    description: 'Patient vitals, symptoms assessment with cascading conditions',
    icon: Stethoscope,
    type: 'survey',
    category: 'Clinical',
    fields: [
      { id: 'patient_id', name: 'patient_id', label: 'Patient ID', type: 'text', required: true },
      { id: 'visit_date', name: 'visit_date', label: 'Visit Date', type: 'date', required: true },
      { id: 'age', name: 'age', label: 'Age (years)', type: 'number', required: true, validation: { min: 0, max: 150 } },
      { id: 'sex', name: 'sex', label: 'Sex', type: 'select', required: true, options: ['Male', 'Female'] },
      { id: 'pregnant', name: 'pregnant', label: 'Currently pregnant?', type: 'select', options: ['Yes', 'No'], skipLogic: { field: 'sex', operator: 'equals', value: 'Female' } },
      { id: 'trimester', name: 'trimester', label: 'Trimester', type: 'select', options: ['1st', '2nd', '3rd'], skipLogic: { field: 'pregnant', operator: 'equals', value: 'Yes' } },
      { id: 'temp', name: 'temp', label: 'Temperature (°C)', type: 'decimal', required: true, validation: { min: 34, max: 43 } },
      { id: 'bp_systolic', name: 'bp_systolic', label: 'Blood Pressure (Systolic)', type: 'number', validation: { min: 60, max: 250 } },
      { id: 'bp_diastolic', name: 'bp_diastolic', label: 'Blood Pressure (Diastolic)', type: 'number', validation: { min: 30, max: 150 } },
      { id: 'weight', name: 'weight', label: 'Weight (kg)', type: 'decimal', validation: { min: 0.5, max: 300 } },
      { id: 'symptoms', name: 'symptoms', label: 'Symptoms (select all)', type: 'multiselect', options: ['Fever', 'Cough', 'Headache', 'Fatigue', 'Diarrhea', 'Vomiting', 'Rash', 'None'] },
      { id: 'referral', name: 'referral', label: 'Referred to facility?', type: 'select', options: ['Yes', 'No'] },
    ],
  },
  {
    id: 'tpl-sample-collection',
    name: 'Lab Sample Collection',
    description: 'Sample tracking with barcode, chain of custody, and lab results',
    icon: Beaker,
    type: 'sample',
    category: 'Laboratory',
    fields: [
      { id: 'sample_id', name: 'sample_id', label: 'Sample Barcode', type: 'barcode', required: true },
      { id: 'sample_type', name: 'sample_type', label: 'Sample Type', type: 'select', required: true, options: ['Blood', 'Urine', 'Stool', 'Sputum', 'Swab', 'Water', 'Soil'] },
      { id: 'collection_date', name: 'collection_date', label: 'Collection Date/Time', type: 'datetime', required: true },
      { id: 'collector_name', name: 'collector_name', label: 'Collected By', type: 'text', required: true },
      { id: 'participant_id', name: 'participant_id', label: 'Participant ID', type: 'text', required: true },
      { id: 'storage_temp', name: 'storage_temp', label: 'Storage Temperature', type: 'select', required: true, options: ['Room temp', '2-8°C', '-20°C', '-80°C'] },
      { id: 'condition', name: 'condition', label: 'Sample Condition', type: 'select', required: true, options: ['Good', 'Hemolyzed', 'Lipemic', 'Clotted', 'Insufficient'] },
      { id: 'rejected', name: 'rejected', label: 'Sample rejected?', type: 'select', options: ['Yes', 'No'], skipLogic: { field: 'condition', operator: 'not_equals', value: 'Good' } },
      { id: 'reject_reason', name: 'reject_reason', label: 'Rejection reason', type: 'text', skipLogic: { field: 'rejected', operator: 'equals', value: 'Yes' } },
      { id: 'notes', name: 'notes', label: 'Notes', type: 'text' },
    ],
  },
  {
    id: 'tpl-maternal',
    name: 'Maternal & Child Health',
    description: 'Antenatal care, immunization tracking, and growth monitoring',
    icon: Baby,
    type: 'survey',
    category: 'Health Survey',
    fields: [
      { id: 'mother_id', name: 'mother_id', label: 'Mother ID', type: 'text', required: true },
      { id: 'visit_type', name: 'visit_type', label: 'Visit Type', type: 'select', required: true, options: ['Antenatal', 'Postnatal', 'Child Growth Monitoring', 'Immunization'] },
      { id: 'gest_weeks', name: 'gest_weeks', label: 'Gestational Age (weeks)', type: 'number', validation: { min: 1, max: 45 }, skipLogic: { field: 'visit_type', operator: 'equals', value: 'Antenatal' } },
      { id: 'child_name', name: 'child_name', label: 'Child Name', type: 'text', skipLogic: { field: 'visit_type', operator: 'not_equals', value: 'Antenatal' } },
      { id: 'child_dob', name: 'child_dob', label: 'Child Date of Birth', type: 'date', skipLogic: { field: 'visit_type', operator: 'not_equals', value: 'Antenatal' } },
      { id: 'child_weight', name: 'child_weight', label: 'Child Weight (kg)', type: 'decimal', validation: { min: 0.5, max: 30 }, skipLogic: { field: 'visit_type', operator: 'equals', value: 'Child Growth Monitoring' } },
      { id: 'child_height', name: 'child_height', label: 'Child Height (cm)', type: 'decimal', validation: { min: 30, max: 150 }, skipLogic: { field: 'visit_type', operator: 'equals', value: 'Child Growth Monitoring' } },
      { id: 'muac', name: 'muac', label: 'MUAC (cm)', type: 'decimal', validation: { min: 5, max: 30 }, skipLogic: { field: 'visit_type', operator: 'equals', value: 'Child Growth Monitoring' } },
      { id: 'vaccines', name: 'vaccines', label: 'Vaccines Given', type: 'multiselect', options: ['BCG', 'OPV', 'Penta', 'PCV', 'Rota', 'Measles', 'Yellow Fever', 'Vitamin A'], skipLogic: { field: 'visit_type', operator: 'equals', value: 'Immunization' } },
      { id: 'next_visit', name: 'next_visit', label: 'Next Visit Date', type: 'date' },
    ],
  },
  {
    id: 'tpl-community',
    name: 'Community Health Assessment',
    description: 'Village-level health infrastructure and disease surveillance',
    icon: Users,
    type: 'survey',
    category: 'Health Survey',
    fields: [
      { id: 'community_name', name: 'community_name', label: 'Community/Village Name', type: 'text', required: true },
      { id: 'population', name: 'population', label: 'Estimated Population', type: 'number', required: true },
      { id: 'has_health_facility', name: 'has_health_facility', label: 'Health facility present?', type: 'select', required: true, options: ['Yes', 'No'] },
      { id: 'facility_type', name: 'facility_type', label: 'Facility Type', type: 'select', options: ['Hospital', 'Health Center', 'Dispensary', 'CHPS Compound'], skipLogic: { field: 'has_health_facility', operator: 'equals', value: 'Yes' } },
      { id: 'dist_to_facility', name: 'dist_to_facility', label: 'Distance to nearest facility (km)', type: 'decimal', skipLogic: { field: 'has_health_facility', operator: 'equals', value: 'No' } },
      { id: 'common_diseases', name: 'common_diseases', label: 'Most common diseases', type: 'multiselect', options: ['Malaria', 'Diarrhea', 'Pneumonia', 'Typhoid', 'Cholera', 'TB', 'HIV/AIDS', 'Malnutrition'] },
      { id: 'water_access', name: 'water_access', label: 'Access to clean water (%)', type: 'number', validation: { min: 0, max: 100 } },
      { id: 'sanitation', name: 'sanitation', label: 'Sanitation coverage (%)', type: 'number', validation: { min: 0, max: 100 } },
      { id: 'gps', name: 'gps', label: 'GPS Coordinates', type: 'geopoint' },
      { id: 'assessor_notes', name: 'assessor_notes', label: 'Assessor Notes', type: 'text' },
    ],
  },
]

export default function FormBuilder() {
  const [forms, setForms] = useState<Form[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [currentView, setCurrentView] = useState<'list' | 'editor' | 'preview'>('list')
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [previewForm, setPreviewForm] = useState<Form | null>(null)
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<SortColumn>('modified')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState("")

  useEffect(() => {
    loadForms()
  }, [])

  const loadForms = () => {
    const loadedForms = getForms()
    setForms(loadedForms)
  }

  const responseCounts = useMemo(() => {
    const responses = getFormResponses()
    const counts: Record<string, number> = {}
    responses.forEach(r => { counts[r.formId] = (counts[r.formId] || 0) + 1 })
    return counts
  }, [forms])

  const filteredForms = useMemo(() => {
    let filtered = forms

    if (searchTerm) {
      filtered = filtered.filter(form =>
        form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterType !== "all") {
      filtered = filtered.filter(form => form.type === filterType)
    }

    return filtered
  }, [forms, searchTerm, filterType])

  const sortForms = (formsToSort: Form[]) => {
    return [...formsToSort].sort((a, b) => {
      let comparison = 0
      switch (sortColumn) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'questions':
          comparison = a.fields.length - b.fields.length
          break
        case 'submissions':
          comparison = (responseCounts[a.id] || 0) - (responseCounts[b.id] || 0)
          break
        case 'modified':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  const activeForms = useMemo(() => {
    const active = filteredForms.filter(f => f.status !== 'archived')
    return sortForms(active)
  }, [filteredForms, sortColumn, sortDirection, responseCounts])

  const archivedForms = useMemo(() => {
    const archived = filteredForms.filter(f => f.status === 'archived')
    return sortForms(archived)
  }, [filteredForms, sortColumn, sortDirection, responseCounts])

  const totalForms = forms.length
  const activeCount = forms.filter(f => f.status === 'active').length
  const archivedCount = forms.filter(f => f.status === 'archived').length

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection(column === 'name' || column === 'type' ? 'asc' : 'desc')
    }
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />
  }

  const handleCreateNew = () => {
    setEditingForm(null)
    setCurrentView('editor')
  }

  const handleImported = (form: Form) => {
    loadForms()
    setEditingForm(form)
    setCurrentView('editor')
  }

  const handleUseTemplate = (template: FormTemplate) => {
    const form = createForm({
      name: template.name,
      type: template.type,
      targetRole: 'field-collector',
      assignedProjects: [],
      assignedRegions: [],
      fields: template.fields,
      createdBy: 'current-user',
      status: 'active',
      publishStatus: 'draft',
    })
    setTemplateDialogOpen(false)
    setEditingForm(form)
    setCurrentView('editor')
  }

  const handleAIBuild = async () => {
    if (!aiPrompt.trim()) return
    setAiGenerating(true)
    setAiError("")

    const provider = getDefaultProvider()
    if (!provider) {
      setAiError("No AI provider configured. Go to Settings > AI Integration to add an API key.")
      setAiGenerating(false)
      return
    }

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: provider.id,
          apiKey: provider.apiKey,
          messages: [
            {
              role: 'system',
              content: `You are a form designer for health data collection. Generate a JSON array of form fields based on the user's description. Each field must have: id (snake_case), name (same as id), label (human readable), type (one of: text, number, decimal, select, multiselect, date, datetime, time, image, barcode, geopoint), required (boolean). For select/multiselect fields include an "options" array of strings. For number/decimal fields optionally include "validation" with min/max. For conditional fields include "skipLogic" with field, operator (equals/not_equals), value. Return ONLY the JSON array, no explanation.`
            },
            { role: 'user', content: aiPrompt }
          ],
          max_tokens: 2000,
          temperature: 0.2,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        setAiError(data.error || 'AI generation failed')
        setAiGenerating(false)
        return
      }

      let fields: any[]
      try {
        const text = data.data.trim()
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        fields = JSON.parse(jsonMatch ? jsonMatch[0] : text)
      } catch {
        setAiError('AI returned invalid form data. Try a more specific description.')
        setAiGenerating(false)
        return
      }

      const form = createForm({
        name: aiPrompt.slice(0, 60),
        type: 'survey',
        targetRole: 'field-collector',
        assignedProjects: [],
        assignedRegions: [],
        fields,
        createdBy: 'current-user',
        status: 'active',
        publishStatus: 'draft',
      })

      setAiDialogOpen(false)
      setAiPrompt("")
      setEditingForm(form)
      setCurrentView('editor')
    } catch (err: any) {
      setAiError(err?.message || 'Failed to connect to AI')
    } finally {
      setAiGenerating(false)
    }
  }

  const handleEdit = (form: Form) => {
    setEditingForm(form)
    setCurrentView('editor')
  }

  const handlePreview = (form: Form) => {
    if (form.fields && form.fields.length > 0) {
      setPreviewForm(form)
      setCurrentView('preview')
    } else {
      alert('Cannot preview form: No fields added yet')
    }
  }

  const getFormLink = (formId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/form/${formId}`
    }
    return `/form/${formId}`
  }

  const handleCopyLink = async (form: Form) => {
    const link = getFormLink(form.id)
    try {
      await navigator.clipboard.writeText(link)
      setCopiedFormId(form.id)
      setTimeout(() => setCopiedFormId(null), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedFormId(form.id)
      setTimeout(() => setCopiedFormId(null), 2000)
    }
  }

  const handleShare = async (form: Form) => {
    const link = getFormLink(form.id)
    if (navigator.share) {
      try {
        await navigator.share({
          title: form.name,
          text: `Fill out this form: ${form.name}`,
          url: link,
        })
      } catch {
        handleCopyLink(form)
      }
    } else {
      handleCopyLink(form)
    }
  }

  const handleClone = async (form: Form) => {
    const newName = `${form.name} (Copy)`
    const clonedForm = cloneForm(form.id, newName)
    if (clonedForm) {
      loadForms()
    }
  }

  const handleDelete = async (formId: string) => {
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      const success = deleteForm(formId)
      if (success) {
        loadForms()
      }
    }
  }

  const handleEditorClose = () => {
    setCurrentView('list')
    setEditingForm(null)
    loadForms()
  }

  const handlePreviewClose = () => {
    setCurrentView('list')
    setPreviewForm(null)
  }

  if (currentView === 'editor') {
    return (
      <FormBuilderEditor
        form={editingForm}
        onClose={handleEditorClose}
      />
    )
  }

  if (currentView === 'preview' && previewForm) {
    return (
      <FormPreview
        form={previewForm}
        onClose={handlePreviewClose}
      />
    )
  }

  const renderFormRow = (form: Form) => (
    <TableRow
      key={form.id}
      className="group cursor-default"
      onDoubleClick={() => handleEdit(form)}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {form.type === 'survey'
            ? <FileText className="w-4 h-4 text-blue-500 shrink-0" />
            : <Beaker className="w-4 h-4 text-purple-500 shrink-0" />
          }
          <span className="truncate max-w-[240px]">{form.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={
          form.type === 'survey'
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-purple-50 text-purple-700 border-purple-200'
        }>
          {form.type === 'survey' ? 'Survey' : 'Sample'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Badge variant={form.status === 'active' ? 'default' : 'secondary'} className="capitalize">
            {form.status}
          </Badge>
          <Badge
            variant="outline"
            className={
              form.publishStatus === 'published'
                ? 'bg-green-50 text-green-700 border-green-200 text-[10px]'
                : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]'
            }
          >
            {form.publishStatus === 'published' ? 'Published' : 'Draft'}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-center tabular-nums">
        {form.fields.length}
      </TableCell>
      <TableCell className="text-center tabular-nums">
        {responseCounts[form.id] || 0}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDistanceToNow(new Date(form.updatedAt), { addSuffix: false })}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => { e.stopPropagation(); handleEdit(form) }}
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => { e.stopPropagation(); handlePreview(form) }}
            title="Preview"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleClone(form)}>
                <Copy className="w-4 h-4 mr-2" />
                Clone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopyLink(form)}>
                {copiedFormId === form.id
                  ? <><Check className="w-4 h-4 mr-2" /> Copied!</>
                  : <><Link2 className="w-4 h-4 mr-2" /> Copy Link</>
                }
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare(form)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(form.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )

  const renderTableHeader = () => (
    <TableHeader>
      <TableRow>
        <TableHead
          className="cursor-pointer select-none"
          onClick={() => handleSort('name')}
        >
          <span className="flex items-center">
            Name <SortIcon column="name" />
          </span>
        </TableHead>
        <TableHead
          className="cursor-pointer select-none w-[100px]"
          onClick={() => handleSort('type')}
        >
          <span className="flex items-center">
            Type <SortIcon column="type" />
          </span>
        </TableHead>
        <TableHead
          className="cursor-pointer select-none w-[100px]"
          onClick={() => handleSort('status')}
        >
          <span className="flex items-center">
            Status <SortIcon column="status" />
          </span>
        </TableHead>
        <TableHead
          className="cursor-pointer select-none text-center w-[100px]"
          onClick={() => handleSort('questions')}
        >
          <span className="flex items-center justify-center">
            Questions <SortIcon column="questions" />
          </span>
        </TableHead>
        <TableHead
          className="cursor-pointer select-none text-center w-[110px]"
          onClick={() => handleSort('submissions')}
        >
          <span className="flex items-center justify-center">
            Submissions <SortIcon column="submissions" />
          </span>
        </TableHead>
        <TableHead
          className="cursor-pointer select-none w-[110px]"
          onClick={() => handleSort('modified')}
        >
          <span className="flex items-center">
            Modified <SortIcon column="modified" />
          </span>
        </TableHead>
        <TableHead className="w-[110px]" />
      </TableRow>
    </TableHeader>
  )

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Form Builder</h1>
          <Button onClick={handleCreateNew} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            Blank Form
          </Button>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Upload Form */}
          <button
            onClick={() => setImportDialogOpen(true)}
            className="group relative flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center transition-all hover:border-primary hover:bg-primary/10 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Upload Form</p>
              <p className="text-xs text-muted-foreground">Import XLSForm (.xlsx)</p>
            </div>
          </button>

          {/* Build with AI */}
          <button
            onClick={() => { setAiError(""); setAiDialogOpen(true) }}
            className="group relative flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-violet-400/30 bg-violet-50 dark:bg-violet-950/20 p-5 text-center transition-all hover:border-violet-500 hover:bg-violet-100 dark:hover:bg-violet-950/40 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Build with AI</p>
              <p className="text-xs text-muted-foreground">Describe your form</p>
            </div>
          </button>

          {/* Use Template */}
          <button
            onClick={() => setTemplateDialogOpen(true)}
            className="group relative flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-emerald-400/30 bg-emerald-50 dark:bg-emerald-950/20 p-5 text-center transition-all hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <LayoutTemplate className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Use Template</p>
              <p className="text-xs text-muted-foreground">Start from a template</p>
            </div>
          </button>
        </div>
      </div>

      {/* Stats + Search + Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">{totalForms} Forms</span>
          <span className="text-muted-foreground">|</span>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-normal">
            {activeCount} Active
          </Badge>
          {archivedCount > 0 && (
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 font-normal">
              {archivedCount} Archived
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 w-full sm:w-[200px] text-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 shrink-0">
                {filterType === 'all' ? 'All Types' : filterType === 'survey' ? 'Survey' : 'Sample'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterType('all')}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('survey')}>
                <FileText className="w-4 h-4 mr-2" />
                Survey
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('sample')}>
                <Beaker className="w-4 h-4 mr-2" />
                Sample
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active forms table */}
      {activeForms.length > 0 ? (
        <Card>
          <Table>
            {renderTableHeader()}
            <TableBody>
              {activeForms.map(renderFormRow)}
            </TableBody>
          </Table>
        </Card>
      ) : filteredForms.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No forms found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first form to get started.'
                }
              </p>
            </div>
            {!searchTerm && filterType === 'all' && (
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Form
              </Button>
            )}
          </div>
        </Card>
      ) : null}

      {/* Archived forms collapsible */}
      {archivedForms.length > 0 && (
        <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen}>
          <Card>
            <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className={`w-4 h-4 transition-transform ${archivedOpen ? 'rotate-90' : ''}`} />
              Archived ({archivedForms.length})
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Table>
                {renderTableHeader()}
                <TableBody>
                  {archivedForms.map(renderFormRow)}
                </TableBody>
              </Table>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* XLSForm Import Dialog */}
      <XLSFormImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImported={handleImported}
      />

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-emerald-600" />
              Form Templates
            </DialogTitle>
            <DialogDescription>
              Choose a template with pre-built fields, skip logic, and validation rules
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {FORM_TEMPLATES.map((tpl) => {
              const Icon = tpl.icon
              return (
                <button
                  key={tpl.id}
                  onClick={() => handleUseTemplate(tpl)}
                  className="flex items-start gap-4 rounded-lg border p-4 text-left hover:bg-muted/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{tpl.name}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {tpl.fields.length} fields
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${
                        tpl.type === 'survey' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {tpl.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Form Builder Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              Build Form with AI
            </DialogTitle>
            <DialogDescription>
              Describe the form you need and AI will generate the fields, validation, and skip logic
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Example: Create a malaria rapid diagnostic test form with patient ID, age, sex, pregnancy status (for females only), RDT result, treatment given if positive, and GPS location"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={5}
              className="resize-none"
            />
            {aiError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg">
                {aiError}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Tip: Be specific about field types, conditions, and validation rules you need.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAIBuild}
              disabled={!aiPrompt.trim() || aiGenerating}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Form
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
