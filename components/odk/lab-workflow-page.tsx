"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LabDashboard from "@/components/lab-dashboard"
import LabResultsEntryForm from "@/components/lab-results-entry-form"
import LabReviewAnalytics from "@/components/lab-review-analytics"
import SampleManagementDashboard from "@/components/sample-management-dashboard"

const tabs = [
  { value: "queue", label: "Lab Queue" },
  { value: "results", label: "Results Entry" },
  { value: "review", label: "Review & QC" },
  { value: "samples", label: "Sample Management" },
] as const

export default function LabWorkflowPage() {
  const [activeTab, setActiveTab] = useState("queue")

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Lab Workflow</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="queue" className="mt-0">
          <LabDashboard />
        </TabsContent>

        <TabsContent value="results" className="mt-0">
          <LabResultsEntryForm />
        </TabsContent>

        <TabsContent value="review" className="mt-0">
          <LabReviewAnalytics />
        </TabsContent>

        <TabsContent value="samples" className="mt-0">
          <SampleManagementDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
