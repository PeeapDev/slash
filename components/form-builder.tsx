"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Edit3, 
  Copy, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  FileText,
  Beaker,
  Users
} from "lucide-react"
import { Form, getForms, deleteForm, cloneForm } from "@/lib/form-store"
import FormBuilderEditor from "./form-builder-editor"
import FormPreview from "./form-preview"

export default function FormBuilder() {
  const [forms, setForms] = useState<Form[]>([])
  const [filteredForms, setFilteredForms] = useState<Form[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [currentView, setCurrentView] = useState<'list' | 'editor' | 'preview'>('list')
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [previewForm, setPreviewForm] = useState<Form | null>(null)

  useEffect(() => {
    loadForms()
  }, [])

  useEffect(() => {
    filterForms()
  }, [forms, searchTerm, filterType])

  const loadForms = () => {
    const loadedForms = getForms()
    setForms(loadedForms)
  }

  const filterForms = () => {
    let filtered = forms

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(form =>
        form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(form => form.type === filterType)
    }

    setFilteredForms(filtered)
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

  const getFormTypeIcon = (type: string) => {
    return type === 'survey' ? <FileText className="w-4 h-4" /> : <Beaker className="w-4 h-4" />
  }

  const getFormTypeColor = (type: string) => {
    return type === 'survey' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Form Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage dynamic forms for field data collection
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Create New Form
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{forms.length}</p>
              <p className="text-sm text-muted-foreground">Total Forms</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{forms.filter(f => f.type === 'survey').length}</p>
              <p className="text-sm text-muted-foreground">Survey Forms</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Beaker className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{forms.filter(f => f.type === 'sample').length}</p>
              <p className="text-sm text-muted-foreground">Sample Forms</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{forms.filter(f => f.status === 'active').length}</p>
              <p className="text-sm text-muted-foreground">Active Forms</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search forms by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Tabs value={filterType} onValueChange={setFilterType} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All Forms</TabsTrigger>
              <TabsTrigger value="survey">Survey</TabsTrigger>
              <TabsTrigger value="sample">Sample</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredForms.map((form) => (
          <Card key={form.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{form.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={getFormTypeColor(form.type)}>
                      {getFormTypeIcon(form.type)}
                      <span className="ml-1 capitalize">{form.type}</span>
                    </Badge>
                    <Badge variant={form.status === 'active' ? 'default' : 'secondary'}>
                      {form.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>ID:</strong> {form.id}</p>
                <p><strong>Fields:</strong> {form.fields.length}</p>
                <p><strong>Target Role:</strong> {form.targetRole}</p>
                <p><strong>Projects:</strong> {form.assignedProjects.length}</p>
                <p><strong>Created:</strong> {new Date(form.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreview(form)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(form)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClone(form)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(form.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredForms.length === 0 && (
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
      )}
    </div>
  )
}
