"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function IssueReviewPage() {
  const [issues, setIssues] = useState([
    {
      id: 1,
      type: "missing_survey",
      description: "Household HH001 missing sanitation data",
      collector: "John Collector",
      priority: "high",
      status: "open",
    },
    {
      id: 2,
      type: "sample_mismatch",
      description: "Sample S045 has no corresponding lab result",
      collector: "Jane Doe",
      priority: "high",
      status: "open",
    },
    {
      id: 3,
      type: "data_quality",
      description: "Unusual hemoglobin reading for participant PT025",
      lab: "Lab Technician A",
      priority: "medium",
      status: "open",
    },
    {
      id: 4,
      type: "missing_survey",
      description: "Participant PT030 questionnaire incomplete",
      collector: "John Collector",
      priority: "low",
      status: "resolved",
    },
  ])

  const getIssueIcon = (type) => {
    switch (type) {
      case "missing_survey":
        return "📋"
      case "sample_mismatch":
        return "🧪"
      case "data_quality":
        return "⚠️"
      default:
        return "❓"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const markResolved = (id) => {
    setIssues(issues.map((issue) => (issue.id === id ? { ...issue, status: "resolved" } : issue)))
  }

  const notifyCollector = (issue) => {
    console.log(`Notifying ${issue.collector}: ${issue.description}`)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Issue Review & Audit</h2>
        <p className="text-muted-foreground">Review flagged data issues and AI audit findings</p>
      </div>

      {/* Issue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Open Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{issues.filter((i) => i.status === "open").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {issues.filter((i) => i.priority === "high").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {issues.filter((i) => i.status === "resolved").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issue List */}
      <Card>
        <CardHeader>
          <CardTitle>Flagged Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`p-4 border rounded-lg flex items-start justify-between ${
                issue.status === "resolved" ? "bg-slate-50 opacity-75" : "bg-white"
              }`}
            >
              <div className="flex gap-3 flex-1">
                <div className="text-2xl">{getIssueIcon(issue.type)}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{issue.description}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Assigned to: {issue.collector || issue.lab}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getPriorityColor(issue.priority)}>
                      {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)} Priority
                    </Badge>
                    <Badge variant={issue.status === "resolved" ? "secondary" : "destructive"}>
                      {issue.status === "resolved" ? "✓ Resolved" : "Open"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {issue.status === "open" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => notifyCollector(issue)}>
                      Notify
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => markResolved(issue.id)}
                    >
                      Resolve
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
