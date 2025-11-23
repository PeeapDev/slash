"use client"

import { useState } from "react"
import Sidebar from "./sidebar"
import FieldCollectorDashboard from "./field-collector-dashboard"
import HouseholdRegistrationForm from "./household-registration-form"
import ParticipantRegistrationForm from "./participant-registration-form"
import QuestionnaireForm from "./questionnaire-form"
import SampleCollectionForm from "./sample-collection-form"
import LabDashboard from "./lab-dashboard"
import SampleSearchPage from "./sample-search-page"
import LabResultsEntryForm from "./lab-results-entry-form"
import BatchEntryPage from "./batch-entry-page"
import SupervisorDashboard from "./supervisor-dashboard"
import IssueReviewPage from "./issue-review-page"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AppLayout({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard")

  const renderPage = () => {
    // Field Collector Pages
    if (user.role === "field_collector") {
      switch (currentPage) {
        case "dashboard":
          return <FieldCollectorDashboard user={user} />
        case "household_registration":
          return <HouseholdRegistrationForm />
        case "participant_registration":
          return <ParticipantRegistrationForm />
        case "questionnaire":
          return <QuestionnaireForm />
        case "sample_collection":
          return <SampleCollectionForm />
        default:
          return <FieldCollectorDashboard user={user} />
      }
    }

    // Lab Technician Pages
    if (user.role === "lab_technician") {
      switch (currentPage) {
        case "dashboard":
          return <LabDashboard />
        case "sample_search":
          return <SampleSearchPage />
        case "results_entry":
          return <LabResultsEntryForm />
        case "batch_entry":
          return <BatchEntryPage />
        default:
          return <LabDashboard />
      }
    }

    // Supervisor Pages
    if (user.role === "supervisor") {
      switch (currentPage) {
        case "dashboard":
          return <SupervisorDashboard />
        case "issue_review":
          return <IssueReviewPage />
        default:
          return <SupervisorDashboard />
      }
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar role={user.role} currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with logout */}
        <div className="bg-card border-b border-border flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">SLASH Data Capture Tool</h1>
            <p className="text-sm text-muted-foreground">
              {user.email} • {user.role.replace(/_/g, " ").toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={onLogout} className="flex items-center gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">{renderPage()}</div>
      </div>
    </div>
  )
}
