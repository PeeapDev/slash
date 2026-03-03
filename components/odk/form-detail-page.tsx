"use client"

import { useState, useEffect } from "react"
import { useNavigation } from "@/lib/navigation-context"
import { getFormById, type Form } from "@/lib/form-store"
import FormOverviewTab from "./form-overview-tab"
import FormSubmissionsTab from "./form-submissions-tab"
import FormVersionsTab from "./form-versions-tab"
import FormSettingsTab from "./form-settings-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  closed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function FormDetailPage() {
  const { state, navigate, setFormName } = useNavigation()
  const [form, setForm] = useState<Form | null>(null)
  const [tab, setTab] = useState(state.tab || "Overview")

  useEffect(() => {
    if (!state.formId) return
    const f = getFormById(state.formId)
    setForm(f ?? null)
    if (f) setFormName(f.id, f.name)
  }, [state.formId, setFormName])

  if (!form) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const odkStatus = form.odkStatus || "open"

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() =>
            navigate({ view: "project-detail", projectId: state.projectId })
          }
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{form.name}</h1>
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[odkStatus]}`}
          >
            {odkStatus.charAt(0).toUpperCase() + odkStatus.slice(1)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="Overview">Overview</TabsTrigger>
          <TabsTrigger value="Submissions">Submissions</TabsTrigger>
          <TabsTrigger value="Versions">Versions</TabsTrigger>
          <TabsTrigger value="Settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="Overview" className="mt-4">
          <FormOverviewTab form={form} />
        </TabsContent>
        <TabsContent value="Submissions" className="mt-4">
          <FormSubmissionsTab form={form} projectId={state.projectId!} />
        </TabsContent>
        <TabsContent value="Versions" className="mt-4">
          <FormVersionsTab form={form} />
        </TabsContent>
        <TabsContent value="Settings" className="mt-4">
          <FormSettingsTab
            form={form}
            projectId={state.projectId!}
            onUpdated={(f) => {
              setForm(f)
              setFormName(f.id, f.name)
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
