"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import DataEntryForm from "./data-entry-form"
import DataList from "./data-list"
import DynamicFormRenderer from "./dynamic-form-renderer"
import { getHouseholdData, getSampleCollectionData } from "@/lib/data-store"
import { getForms, Form } from "@/lib/form-store"
import { AlertCircle, CheckCircle2, FileText, Droplet, Beaker, Clock } from "lucide-react"

export default function FieldCollectorDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [view, setView] = useState<"list" | "form" | "dynamic-form">("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)
  const [assignedForms, setAssignedForms] = useState<Form[]>([])
  const [stats, setStats] = useState({
    surveysToday: 0,
    samplesCollected: 0,
    pendingSync: false,
  })

  useEffect(() => {
    const households = getHouseholdData()
    const samples = getSampleCollectionData()
    const today = new Date().toISOString().split("T")[0]

    const surveysToday = households.filter((h) => h.date === today).length
    const samplesCollected = samples.filter((s) => s.date === today).length

    setStats({
      surveysToday,
      samplesCollected,
      pendingSync: households.some((h) => h.status === "draft"),
    })

    // Load assigned forms for this field collector
    const allForms = getForms()
    const userForms = allForms.filter(form => 
      form.status === 'active' && 
      form.targetRole === 'field-collector'
    )
    setAssignedForms(userForms)
  }, [])

  const handleEdit = (id: string) => {
    setEditingId(id)
    setView("form")
  }

  const handleFormClose = () => {
    setEditingId(null)
    setSelectedForm(null)
    setView("list")
  }

  const handleDynamicFormSelect = (form: Form) => {
    setSelectedForm(form)
    setView("dynamic-form")
  }

  const handleDynamicFormSubmit = (responses: Record<string, any>) => {
    // Here you would normally process the form submission
    // For now, we'll just log it and close the form
    console.log('Form submitted:', selectedForm?.name, responses)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Field Data Collector</h1>
            <p className="text-sm text-slate-600">Logged in as {user.name}</p>
          </div>
          <Button onClick={onLogout} variant="outline">
            Log Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Surveys Today</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{stats.surveysToday}</p>
              </div>
              <FileText className="w-12 h-12 text-blue-300" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Samples Collected</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{stats.samplesCollected}</p>
              </div>
              <Droplet className="w-12 h-12 text-green-300" />
            </div>
          </Card>

          <Card
            className={`p-6 bg-gradient-to-br ${stats.pendingSync ? "from-yellow-50 to-yellow-100 border-yellow-200" : "from-gray-50 to-gray-100 border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${stats.pendingSync ? "text-yellow-600" : "text-gray-600"}`}>
                  Sync Status
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {stats.pendingSync ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-700">Pending Sync</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">All Synced</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {view === "list" && (
          <div className="space-y-6">
            {/* Dynamic Forms Section */}
            {assignedForms.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Assigned Forms ({assignedForms.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedForms.map((form) => (
                    <Card key={form.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleDynamicFormSelect(form)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {form.type === 'survey' ? (
                            <FileText className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Beaker className="w-5 h-5 text-purple-600" />
                          )}
                          <Badge className={form.type === 'survey' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                            {form.type}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {form.fields.length} fields
                        </Badge>
                      </div>
                      
                      <h3 className="font-medium text-sm mb-2">{form.name}</h3>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Est. {Math.ceil(form.fields.length * 0.5)} min</span>
                        </div>
                        <div>ID: {form.id}</div>
                      </div>
                      
                      <Button size="sm" className="w-full mt-3" onClick={(e) => {
                        e.stopPropagation()
                        handleDynamicFormSelect(form)
                      }}>
                        Fill Form
                      </Button>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setEditingId(null)
                  setView("form")
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                + New Data Entry (Legacy)
              </Button>
            </div>

            <div className="grid gap-4">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Data Entries ({getHouseholdData().length})
                </h2>
                <DataList data={getHouseholdData()} onEdit={handleEdit} />
              </Card>
            </div>
          </div>
        )}

        {view === "form" && <DataEntryForm collector={user} editingId={editingId} onClose={handleFormClose} />}
        
        {view === "dynamic-form" && selectedForm && (
          <DynamicFormRenderer
            form={selectedForm}
            onClose={handleFormClose}
            onSubmit={handleDynamicFormSubmit}
            collector={user}
          />
        )}
      </main>
    </div>
  )
}
