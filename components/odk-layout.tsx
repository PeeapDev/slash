"use client"

import { useState } from "react"
import { NavigationProvider, useNavigation, type OdkView } from "@/lib/navigation-context"
import OdkTopNav from "@/components/odk-top-nav"
import OdkBreadcrumbs from "@/components/odk-breadcrumbs"
import { getFormById } from "@/lib/form-store"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  FolderKanban,
  Target,
  Inbox,
  FlaskConical,
  Brain,
  Users2,
  Settings,
  X,
  Menu,
} from "lucide-react"

// Page components
import OdkDashboardPage from "@/components/odk/odk-dashboard-page"
import ProjectsListPage from "@/components/odk/projects-list-page"
import ProjectDetailPage from "@/components/odk/project-detail-page"
import FormDetailPage from "@/components/odk/form-detail-page"
import SubmissionDetailPage from "@/components/odk/submission-detail-page"
import UserManagementPage from "@/components/odk/user-management-page"
import SystemSettingsPage from "@/components/odk/system-settings-page"
import OdkFormDesigner from "@/components/form-builder/odk-form-designer"
import FormBuilder from "@/components/form-builder"
import UserProfile from "@/components/user-profile"

// New pages
import AllSubmissionsPage from "@/components/odk/all-submissions-page"
import LabWorkflowPage from "@/components/odk/lab-workflow-page"
import AIAnalyticsPage from "@/components/odk/ai-analytics-page"

interface OdkLayoutProps {
  user: { name: string; role: string }
  onLogout: () => void
}

// ─── Sidebar menu definition ───

interface SidebarItem {
  id: OdkView
  label: string
  icon: React.ElementType
  section: string
}

const sidebarItems: SidebarItem[] = [
  // Overview
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Overview" },

  // Data Collection
  { id: "projects", label: "Projects", icon: FolderKanban, section: "Data Collection" },
  { id: "form-builder", label: "Form Builder", icon: Target, section: "Data Collection" },

  // Review & Analysis
  { id: "submissions", label: "Submissions", icon: Inbox, section: "Review & Analysis" },
  { id: "lab-workflow", label: "Lab Workflow", icon: FlaskConical, section: "Review & Analysis" },
  { id: "ai-analytics", label: "AI Analytics", icon: Brain, section: "Review & Analysis" },

  // Administration
  { id: "users", label: "Users & Teams", icon: Users2, section: "Administration" },
  { id: "system-settings", label: "Settings", icon: Settings, section: "Administration" },
]

const sections = ["Overview", "Data Collection", "Review & Analysis", "Administration"]

// ─── Page Router ───

function PageRouter({ user }: { user: { name: string; role: string } }) {
  const { state, navigate } = useNavigation()

  switch (state.view) {
    case "dashboard":
      return <OdkDashboardPage />
    case "projects":
      return <ProjectsListPage />
    case "project-detail":
      return <ProjectDetailPage />
    case "form-detail":
      return <FormDetailPage />
    case "submission-detail":
      return <SubmissionDetailPage />
    case "form-builder": {
      if (state.formId) {
        const editForm = getFormById(state.formId)
        return (
          <div className="p-4">
            <OdkFormDesigner
              form={editForm || null}
              projectId={state.projectId}
              onClose={() => {
                if (state.projectId) {
                  navigate({ view: "project-detail", projectId: state.projectId, tab: "Forms" })
                } else {
                  navigate({ view: "projects" })
                }
              }}
            />
          </div>
        )
      }
      return <FormBuilder />
    }
    case "submissions":
      return <AllSubmissionsPage />
    case "lab-workflow":
      return <LabWorkflowPage />
    case "ai-analytics":
      return <AIAnalyticsPage />
    case "users":
      return <UserManagementPage />
    case "system-settings":
      return <SystemSettingsPage />
    case "profile":
      return <UserProfile user={user} />
    default:
      return <OdkDashboardPage />
  }
}

// ─── Sidebar Component ───

function AppSidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { state, navigate } = useNavigation()

  const isActive = (id: OdkView) => {
    if (id === "projects") {
      return ["projects", "project-detail", "form-detail"].includes(state.view)
    }
    if (id === "submissions") {
      return ["submissions", "submission-detail"].includes(state.view)
    }
    return state.view === id
  }

  const handleNav = (id: OdkView) => {
    navigate({ view: id })
    onClose()
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 flex flex-col`}
      >
        {/* Brand */}
        <div className="p-4 lg:p-5 border-b border-border flex items-center justify-between">
          <button
            onClick={() => handleNav("dashboard")}
            className="text-lg font-bold hover:opacity-80 transition-opacity"
          >
            SLASH
          </button>
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-muted rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {sections.map((section) => {
            const items = sidebarItems.filter((i) => i.section === section)
            return (
              <div key={section} className="mb-3">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNav(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 lg:py-2 rounded-lg text-left text-sm font-medium transition-colors touch-manipulation ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

// ─── Mobile Bottom Nav ───

function MobileBottomNav() {
  const { state, navigate } = useNavigation()

  const items = [
    { label: "Home", icon: LayoutDashboard, view: "dashboard" as const },
    { label: "Projects", icon: FolderKanban, view: "projects" as const },
    { label: "Submissions", icon: Inbox, view: "submissions" as const },
    { label: "Settings", icon: Settings, view: "system-settings" as const },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const active =
            state.view === item.view ||
            (item.view === "projects" &&
              ["project-detail", "form-detail"].includes(state.view)) ||
            (item.view === "submissions" &&
              ["submission-detail"].includes(state.view))
          return (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              className={`flex-col gap-0.5 h-auto py-1 px-3 ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => navigate({ view: item.view })}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}

// ─── Main Layout ───

export default function OdkLayout({ user, onLogout }: OdkLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <NavigationProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <AppSidebar
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Top header bar */}
          <OdkTopNav user={user} onLogout={onLogout} />

          {/* Breadcrumbs */}
          <OdkBreadcrumbs />

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <div className="pb-20 lg:pb-0">
              <PageRouter user={user} />
            </div>
          </main>

          {/* Mobile hamburger button */}
          {!mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden fixed top-3 left-3 z-40 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-95"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Mobile bottom nav */}
          <MobileBottomNav />
        </div>
      </div>
    </NavigationProvider>
  )
}
