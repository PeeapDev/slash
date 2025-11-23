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
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "form-builder", label: "Form Builder", icon: "🎯" },
    { id: "projects", label: "Projects", icon: "📋" },
    { id: "households", label: "Households", icon: "🏠" },
    { id: "participants", label: "Participants", icon: "👨" },
    { id: "surveys", label: "Surveys", icon: "📝" },
    { id: "samples", label: "Samples", icon: "🧪" },
    { id: "regions", label: "Regional Management", icon: "🗺️" },
    { id: "districts", label: "District Management", icon: "📍" },
    { id: "hr", label: "HR Management", icon: "👥" },
    { id: "config", label: "Configuration", icon: "⚙️" },
    { id: "sync", label: "Sync & Offline", icon: "📡" },
    { id: "profile", label: "User Profile", icon: "👤" },
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
      case "regions":
        return <RegionalManagement />
      case "districts":
        return <DistrictManagement />
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
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {adminMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => changePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                page === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
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
