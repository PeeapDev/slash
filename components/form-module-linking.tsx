"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Link, 
  FileText, 
  Beaker, 
  Home, 
  Users, 
  FolderOpen,
  ArrowRight,
  Plus
} from "lucide-react"
import { getForms, Form } from "@/lib/form-store"

interface ModuleLinkingProps {
  moduleType: 'household' | 'participant' | 'sample' | 'project'
  moduleId: string
  onClose: () => void
}

// This component demonstrates how forms can be linked to specific modules
export default function FormModuleLinking({ moduleType, moduleId, onClose }: ModuleLinkingProps) {
  const [availableForms, setAvailableForms] = useState<Form[]>([])
  const [linkedForms, setLinkedForms] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Load available forms based on module type
    const allForms = getForms()
    const relevantForms = allForms.filter(form => {
      // Filter forms based on module type
      switch (moduleType) {
        case 'household':
          return form.type === 'survey' // Household forms are typically surveys
        case 'participant':
          return true // Participants can have both survey and sample forms
        case 'sample':
          return form.type === 'sample' // Sample collection forms
        case 'project':
          return true // Projects can have any type of form
        default:
          return true
      }
    })
    setAvailableForms(relevantForms)

    // Mock: Load existing linked forms (in real implementation, this would come from API)
    setLinkedForms(['FORM-001']) // Example: FORM-001 is already linked
  }, [moduleType])

  const getModuleIcon = () => {
    switch (moduleType) {
      case 'household': return <Home className="w-5 h-5" />
      case 'participant': return <Users className="w-5 h-5" />
      case 'sample': return <Beaker className="w-5 h-5" />
      case 'project': return <FolderOpen className="w-5 h-5" />
    }
  }

  const getModuleLabel = () => {
    return moduleType.charAt(0).toUpperCase() + moduleType.slice(1)
  }

  const handleLinkForm = (formId: string) => {
    if (!linkedForms.includes(formId)) {
      setLinkedForms(prev => [...prev, formId])
      console.log(`Linking form ${formId} to ${moduleType} ${moduleId}`)
    }
  }

  const handleUnlinkForm = (formId: string) => {
    setLinkedForms(prev => prev.filter(id => id !== formId))
    console.log(`Unlinking form ${formId} from ${moduleType} ${moduleId}`)
  }

  const filteredForms = availableForms.filter(form => 
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const linkedFormObjects = availableForms.filter(form => linkedForms.includes(form.id))
  const unlinkedForms = filteredForms.filter(form => !linkedForms.includes(form.id))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {getModuleIcon()}
            <div>
              <h2 className="text-xl font-bold">Link Forms to {getModuleLabel()}</h2>
              <p className="text-muted-foreground">
                {getModuleLabel()} ID: {moduleId}
              </p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost">✕</Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Linked Forms */}
        {linkedFormObjects.length > 0 && (
          <Card className="p-4 mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Link className="w-4 h-4" />
              Linked Forms ({linkedFormObjects.length})
            </h3>
            <div className="space-y-2">
              {linkedFormObjects.map(form => (
                <div key={form.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {form.type === 'survey' ? (
                      <FileText className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Beaker className="w-4 h-4 text-purple-600" />
                    )}
                    <div>
                      <p className="font-medium">{form.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{form.id}</Badge>
                        <Badge className={form.type === 'survey' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                          {form.type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{form.fields.length} fields</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnlinkForm(form.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Unlink
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Available Forms */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Available Forms ({unlinkedForms.length})
          </h3>
          
          {unlinkedForms.length > 0 ? (
            <div className="space-y-2">
              {unlinkedForms.map(form => (
                <div key={form.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted">
                  <div className="flex items-center gap-3">
                    {form.type === 'survey' ? (
                      <FileText className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Beaker className="w-4 h-4 text-purple-600" />
                    )}
                    <div>
                      <p className="font-medium">{form.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{form.id}</Badge>
                        <Badge className={form.type === 'survey' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                          {form.type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{form.fields.length} fields</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleLinkForm(form.id)}
                    className="gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Link Form
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No available forms to link</p>
              <p className="text-sm">All compatible forms are already linked or try adjusting your search</p>
            </div>
          )}
        </Card>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How Form Linking Works:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Household:</strong> Survey forms for demographic and household-level data</li>
            <li>• <strong>Participant:</strong> Both survey and sample forms for individual data collection</li>
            <li>• <strong>Sample:</strong> Sample collection forms for laboratory specimens</li>
            <li>• <strong>Project:</strong> Any forms assigned to project participants</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <Button onClick={onClose} className="flex-1">
            Save Changes
          </Button>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
