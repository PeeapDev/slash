"use client"

import React, { createContext, useContext, useState, useCallback, useMemo } from "react"

export type OdkView =
  | "dashboard"
  | "projects"
  | "project-detail"
  | "form-detail"
  | "submission-detail"
  | "form-builder"
  | "submissions"
  | "lab-workflow"
  | "ai-analytics"
  | "users"
  | "system-settings"
  | "profile"

export interface NavigationState {
  view: OdkView
  projectId?: string
  formId?: string
  submissionId?: string
  tab?: string
}

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

interface NavigationContextType {
  state: NavigationState
  history: NavigationState[]
  navigate: (next: NavigationState) => void
  goBack: () => void
  breadcrumbs: BreadcrumbItem[]
  /** Helpers to set breadcrumb labels from loaded data */
  setProjectName: (id: string, name: string) => void
  setFormName: (id: string, name: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

const DEFAULT_STATE: NavigationState = { view: "dashboard" }

// Simple label map for standalone views
const VIEW_LABELS: Partial<Record<OdkView, string>> = {
  dashboard: "Dashboard",
  projects: "Projects",
  submissions: "Submissions",
  "lab-workflow": "Lab Workflow",
  "ai-analytics": "AI Analytics",
  users: "Users & Teams",
  "system-settings": "Settings",
  profile: "Profile",
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NavigationState>(DEFAULT_STATE)
  const [history, setHistory] = useState<NavigationState[]>([])
  const [projectNames, setProjectNames] = useState<Record<string, string>>({})
  const [formNames, setFormNames] = useState<Record<string, string>>({})

  const navigate = useCallback((next: NavigationState) => {
    setState((prev) => {
      setHistory((h) => [...h, prev])
      return next
    })
  }, [])

  const goBack = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setState(prev)
      return h.slice(0, -1)
    })
  }, [])

  const setProjectName = useCallback((id: string, name: string) => {
    setProjectNames((prev) => ({ ...prev, [id]: name }))
  }, [])

  const setFormName = useCallback((id: string, name: string) => {
    setFormNames((prev) => ({ ...prev, [id]: name }))
  }, [])

  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const crumbs: BreadcrumbItem[] = []

    // Standalone views — single breadcrumb
    const standaloneLabel = VIEW_LABELS[state.view]
    if (standaloneLabel && !["project-detail", "form-detail", "submission-detail", "form-builder"].includes(state.view)) {
      crumbs.push({ label: standaloneLabel })
      return crumbs
    }

    // For project-centric views
    crumbs.push({
      label: "Projects",
      onClick: () => navigate({ view: "projects" }),
    })

    if (state.projectId) {
      const projectLabel = projectNames[state.projectId] || "Project"

      if (state.view === "project-detail") {
        crumbs.push({ label: projectLabel })
        if (state.tab) crumbs.push({ label: state.tab })
        return crumbs
      }

      crumbs.push({
        label: projectLabel,
        onClick: () =>
          navigate({ view: "project-detail", projectId: state.projectId }),
      })
    }

    if (state.formId) {
      const formLabel = formNames[state.formId] || "Form"

      if (state.view === "form-detail") {
        crumbs.push({ label: formLabel })
        if (state.tab) crumbs.push({ label: state.tab })
        return crumbs
      }

      if (state.view === "form-builder") {
        crumbs.push({
          label: formLabel,
          onClick: () =>
            navigate({
              view: "form-detail",
              projectId: state.projectId,
              formId: state.formId,
            }),
        })
        crumbs.push({ label: "Edit" })
        return crumbs
      }

      crumbs.push({
        label: formLabel,
        onClick: () =>
          navigate({
            view: "form-detail",
            projectId: state.projectId,
            formId: state.formId,
          }),
      })
    }

    if (state.view === "submission-detail") {
      crumbs.push({ label: "Submission" })
    }

    if (state.view === "form-builder" && !state.formId) {
      crumbs.push({ label: "New Form" })
    }

    return crumbs
  }, [state, projectNames, formNames, navigate])

  const value = useMemo(
    () => ({ state, history, navigate, goBack, breadcrumbs, setProjectName, setFormName }),
    [state, history, navigate, goBack, breadcrumbs, setProjectName, setFormName]
  )

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider")
  return ctx
}
