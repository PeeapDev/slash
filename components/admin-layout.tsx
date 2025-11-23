"use client"

import type React from "react"
import { useState } from "react"
import { Menu, X, LogOut, Settings, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

// Import page components
import AdminDashboard from "@/components/admin-dashboard"
import RegionalManagement from "@/components/regional-management"
import DistrictManagement from "@/components/district-management"
import HRManagement from "@/components/hr-management"
import AISettings from "@/components/ai-settings"
import SyncSettings from "@/components/sync-settings"
import SystemLogs from "@/components/system-logs"
import AppConfiguration from "@/components/app-configuration"
import UserProfile from "@/components/user-profile"
import ProjectManagement from "@/components/project-management"

import HouseholdManagement from "@/components/household-management"
import ParticipantManagement from "@/components/participant-management"
import SurveyManagement from "@/components/survey-management"
import SampleManagement from "@/components/sample-management"
import SampleManagementDashboard from "@/components/sample-management-dashboard"
import FormBuilder from "@/components/form-builder"
import UnifiedDashboard from "@/components/unified-dashboard"
import NetworkStatus from "@/components/network-status"
import SyncStatus from "@/components/sync-status"
import SampleTypeConfiguration from "@/components/sample-type-configuration"
import LabDashboard from "@/components/lab-dashboard"
import LabResultsEntryForm from "@/components/lab-results-entry-form"
import LabReviewAnalytics from "@/components/lab-review-analytics"
import TeamManagement from "@/components/team-management"
import Teams from "@/components/teams"

interface AdminLayoutProps {
  user: any
  onLogout: () => void
  currentPage?: string
  onPageChange?: (page: string) => void
  children?: React.ReactNode
}

export default function AdminLayout({ user, onLogout, currentPage, onPageChange }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Internal page state fallback when onPageChange/currentPage are not provided
  const [internalPage, setInternalPage] = useState<string>(currentPage || "dashboard")
  const page = currentPage ?? internalPage
  console.log('🧭 AdminLayout props:', { hasOnPageChange: typeof onPageChange, currentPage, internalPage, page })
  const changePage = (pageId: string) => {
    if (typeof onPageChange === 'function') {
      onPageChange(pageId)
    } else {
      setInternalPage(pageId)
    }
  }

  const adminMenuItems = [
    // Overview
    { id: "dashboard", label: "Dashboard", icon: "📊", section: "Overview" },
    
    // Field Work
    { id: "form-builder", label: "Form Builder", icon: "🎯", section: "Field Work" },
    { id: "households", label: "Households", icon: "🏠", section: "Field Work" },
    { id: "participants", label: "Participants", icon: "👨", section: "Field Work" },
    { id: "surveys", label: "Surveys", icon: "📝", section: "Field Work" },
    
    // Laboratory
    { id: "samples", label: "Sample Management", icon: "🧪", section: "Laboratory" },
    { id: "sample-types", label: "Sample Types", icon: "🔬", section: "Laboratory" },
    { id: "lab-queue", label: "Lab Queue", icon: "📋", section: "Laboratory" },
    { id: "lab-results", label: "Lab Results", icon: "📊", section: "Laboratory" },
    { id: "lab-review", label: "Lab Review", icon: "👁️", section: "Laboratory" },
    
    // Administration
    { id: "projects", label: "Projects", icon: "📋", section: "Administration" },
    { id: "regions", label: "Regions", icon: "🗺️", section: "Administration" },
    { id: "districts", label: "Districts", icon: "📍", section: "Administration" },
    { id: "teams", label: "Teams", icon: "👥", section: "Administration" },
    { id: "hr", label: "HR & Staff Directory", icon: "💼", section: "Administration" },
    { id: "team", label: "Role Management", icon: "🔐", section: "Administration" },
    
    // System
    { id: "sync", label: "Sync & Offline", icon: "📡", section: "System" },
    { id: "config", label: "Settings", icon: "⚙️", section: "System" },
    { id: "profile", label: "Profile", icon: "👤", section: "System" },
  ]

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <UnifiedDashboard />
      case "form-builder":
        return <FormBuilder />
      case "projects":
        return <ProjectManagement />
      case "households":
        return <HouseholdManagement />
      case "participants":
        return <ParticipantManagement />
      case "surveys":
        return <SurveyManagement />
      case "samples":
        return <SampleManagementDashboard />
      case "sample-types":
        return <SampleTypeConfiguration />
      case "lab-queue":
        return <LabDashboard />
      case "lab-results":
        return <LabResultsEntryForm />
      case "lab-review":
        return <LabReviewAnalytics />
      case "regions":
        return <RegionalManagement />
      case "districts":
        return <DistrictManagement />
      case "teams":
        return <Teams />
      case "team":
        return <TeamManagement />
      case "hr":
        return <HRManagement />
      case "sync":
        return <SyncSettings />
      case "config":
        return <AppConfiguration />
      case "profile":
        return <UserProfile user={user} />
      default:
        return <UnifiedDashboard />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          {sidebarOpen && <h1 className="text-lg font-bold">SLASH Admin</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-muted rounded">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {['Overview', 'Field Work', 'Laboratory', 'Administration', 'System'].map((section) => {
            const sectionItems = adminMenuItems.filter(item => item.section === section)
            return (
              <div key={section} className="mb-4">
                {sidebarOpen && (
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section}
                  </div>
                )}
                <div className="space-y-1">
                  {sectionItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => changePage(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                        page === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                      }`}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {sidebarOpen && <span>{item.label}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div>
            <h2 className="text-sm text-muted-foreground">Welcome back</h2>
            <p className="font-semibold">{user?.email || "SuperAdmin"}</p>
          </div>

          <div className="flex items-center gap-4">
            <SyncStatus compact />
            <NetworkStatus />
            <ThemeToggle />
            <button className="p-2 hover:bg-muted rounded-lg">
              <Bell size={20} />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg">
              <Settings size={20} />
            </button>
            <Button onClick={onLogout} variant="ghost" size="sm" className="gap-2">
              <LogOut size={18} />
              Logout
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">{renderPage()}</div>
        </div>
      </div>
    </div>
  )
}
