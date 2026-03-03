"use client"

import { useState, useEffect } from "react"
import { useNavigation } from "@/lib/navigation-context"
import { odkStore, type OdkProject } from "@/lib/odk-store"
import ProjectFormsTab from "./project-forms-tab"
import ProjectAppUsersTab from "./project-app-users-tab"
import ProjectSettingsTab from "./project-settings-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ProjectDetailPage() {
  const { state, navigate, setProjectName } = useNavigation()
  const [project, setProject] = useState<OdkProject | null>(null)
  const [tab, setTab] = useState(state.tab || "Forms")

  useEffect(() => {
    if (!state.projectId) return
    odkStore.getProject(state.projectId).then((p) => {
      setProject(p)
      if (p) setProjectName(p.id, p.name)
    })
  }, [state.projectId, setProjectName])

  if (!project) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => navigate({ view: "projects" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="Forms">Forms</TabsTrigger>
          <TabsTrigger value="App Users">App Users</TabsTrigger>
          <TabsTrigger value="Settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="Forms" className="mt-4">
          <ProjectFormsTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="App Users" className="mt-4">
          <ProjectAppUsersTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="Settings" className="mt-4">
          <ProjectSettingsTab
            project={project}
            onUpdated={(p) => {
              setProject(p)
              setProjectName(p.id, p.name)
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
