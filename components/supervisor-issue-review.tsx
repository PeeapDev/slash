"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getAuditFlags, resolveAuditFlag } from "@/lib/data-store"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

export default function SupervisorIssueReview() {
  const [auditFlags, setAuditFlags] = useState(getAuditFlags())

  const unresolved = auditFlags.filter((f) => !f.resolved)
  const highPriority = unresolved.filter((f) => f.priority === "high")
  const mediumPriority = unresolved.filter((f) => f.priority === "medium")
  const lowPriority = unresolved.filter((f) => f.priority === "low")

  const handleResolve = (flagId: string) => {
    resolveAuditFlag(flagId)
    setAuditFlags(auditFlags.map((f) => (f.id === flagId ? { ...f, resolved: true } : f)))
  }

  const handleNotifyCollector = (flagId: string) => {
    console.log("[v0] Notifying collector about flag:", flagId)
    // In a real app, this would send a notification to the field data collector
    alert("Notification sent to field data collector")
    handleResolve(flagId)
  }

  const priorityColor = {
    high: "border-l-4 border-l-red-500 bg-red-50",
    medium: "border-l-4 border-l-yellow-500 bg-yellow-50",
    low: "border-l-4 border-l-blue-500 bg-blue-50",
  }

  const priorityBadge = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-blue-100 text-blue-800",
  }

  const typeLabel = {
    missing_survey: "Missing Survey Data",
    sample_no_results: "Sample with No Lab Result",
    results_no_sample: "Lab Result with No Sample",
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Data Quality Issues</h1>
        <p className="text-slate-600 mt-2">Review and resolve flagged audit items</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" />
            <div>
              <p className="text-sm text-slate-600">High Priority</p>
              <p className="text-2xl font-bold text-slate-900">{highPriority.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-500" />
            <div>
              <p className="text-sm text-slate-600">Medium Priority</p>
              <p className="text-2xl font-bold text-slate-900">{mediumPriority.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-blue-500" />
            <div>
              <p className="text-sm text-slate-600">Low Priority</p>
              <p className="text-2xl font-bold text-slate-900">{lowPriority.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {unresolved.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-slate-600">No unresolved issues found</p>
          </Card>
        ) : (
          unresolved.map((flag) => (
            <Card key={flag.id} className={`p-6 ${priorityColor[flag.priority]}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{typeLabel[flag.type]}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${priorityBadge[flag.priority]}`}>
                      {flag.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-700 mb-3">{flag.description}</p>
                  <p className="text-xs text-slate-500">ID: {flag.dataId}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNotifyCollector(flag.id)}
                    className="whitespace-nowrap"
                  >
                    Notify Collector
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolve(flag.id)}
                    className="whitespace-nowrap"
                  >
                    Mark Resolved
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
