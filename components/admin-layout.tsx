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
  const [sidebarOpen, setSidebarOpen] = useState(false) // Default closed on mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
    setIsMobileMenuOpen(false) // Close mobile menu after selection
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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile Slide-out */}
      <div
        className={`${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between">
          <h1 className="text-lg font-bold">SLASH</h1>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1 hover:bg-muted rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-1">
          {['Overview', 'Field Work', 'Laboratory', 'Administration', 'System'].map((section) => {
            const sectionItems = adminMenuItems.filter(item => item.section === section)
            return (
              <div key={section} className="mb-3">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section}
                </div>
                <div className="space-y-1">
                  {sectionItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => changePage(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 lg:py-2 rounded-lg text-left text-sm font-medium transition-colors touch-manipulation ${
                        page === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Header - Mobile Optimized */}
        <div className="h-14 lg:h-16 bg-card border-b border-border flex items-center justify-between px-3 lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg touch-manipulation"
          >
            <Menu size={24} />
          </button>

          {/* User Info - Hidden on mobile */}
          <div className="hidden lg:block">
            <h2 className="text-sm text-muted-foreground">Welcome back</h2>
            <p className="font-semibold">{user?.email || "SuperAdmin"}</p>
          </div>

          {/* Mobile Title */}
          <h1 className="lg:hidden font-bold text-lg">SLASH</h1>

          {/* Actions - Responsive */}
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden md:flex items-center gap-2">
              <SyncStatus compact />
              <NetworkStatus />
            </div>
            <ThemeToggle />
            <button className="hidden lg:block p-2 hover:bg-muted rounded-lg">
              <Bell size={20} />
            </button>
            <Button onClick={onLogout} variant="ghost" size="sm" className="gap-2">
              <LogOut size={18} />
              <span className="hidden lg:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Page Content - Mobile Optimized */}
        <div className="flex-1 overflow-auto">
          <div className="p-3 lg:p-6 pb-20 lg:pb-6">{renderPage()}</div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30">
          <div className="flex items-center justify-around py-2 px-2">
            <button
              onClick={() => changePage('dashboard')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg touch-manipulation ${
                page === 'dashboard' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span className="text-xl">📊</span>
              <span className="text-xs">Home</span>
            </button>
            <button
              onClick={() => changePage('households')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg touch-manipulation ${
                page === 'households' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span className="text-xl">🏠</span>
              <span className="text-xs">Data</span>
            </button>
            <button
              onClick={() => changePage('samples')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg touch-manipulation ${
                page === 'samples' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span className="text-xl">🧪</span>
              <span className="text-xs">Samples</span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg touch-manipulation text-muted-foreground"
            >
              <Menu size={20} />
              <span className="text-xs">Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
