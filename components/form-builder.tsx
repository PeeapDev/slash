"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Form, getForms, deleteForm, cloneForm, getFormResponses } from "@/lib/form-store"
import FormBuilderEditor from "./form-builder-editor"
import FormPreview from "./form-preview"

type SortColumn = 'name' | 'type' | 'status' | 'questions' | 'submissions' | 'modified'
type SortDirection = 'asc' | 'desc'

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Form Builder</h1>
        <Button onClick={handleCreateNew} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          New Form
        </Button>
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
    </div>
  )
}
