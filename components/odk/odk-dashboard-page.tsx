"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FolderKanban,
  FileText,
  Inbox,
  AlertCircle,
  Clock,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { odkStore, type OdkProject, type OdkSubmission } from "@/lib/odk-store"
import { getForms } from "@/lib/form-store"
import { useNavigation } from "@/lib/navigation-context"
import AdminDashboard from "@/components/admin-dashboard"

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const REVIEW_COLORS: Record<string, string> = {
  received: "#3b82f6",
  approved: "#10b981",
  hasIssues: "#f59e0b",
  rejected: "#ef4444",
}

const REVIEW_LABELS: Record<string, string> = {
  received: "Received",
  approved: "Approved",
  hasIssues: "Has Issues",
  rejected: "Rejected",
}

export default function OdkDashboardPage() {
  const { navigate } = useNavigation()
  const [projects, setProjects] = useState<OdkProject[]>([])
  const [submissions, setSubmissions] = useState<OdkSubmission[]>([])
  const [formCount, setFormCount] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projs, subs] = await Promise.all([
          odkStore.getProjects(),
          odkStore.getSubmissions(),
        ])
        setProjects(projs)
        setSubmissions(subs)
        setFormCount(getForms().length)
      } catch (err) {
        console.error("Dashboard data load error:", err)
      }
    }
    loadData()
  }, [])

  // Derived stats
  const pendingReview = submissions.filter(
    (s) => s.reviewState !== "approved"
  ).length

  const reviewStateData = Object.entries(
    submissions.reduce<Record<string, number>>((acc, s) => {
      acc[s.reviewState] = (acc[s.reviewState] || 0) + 1
      return acc
    }, {})
  ).map(([state, count]) => ({
    name: REVIEW_LABELS[state] || state,
    value: count,
    color: REVIEW_COLORS[state] || "#6b7280",
  }))

  const recentSubmissions = [...submissions]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10)

  // Map formId → form name for display
  const allForms = getForms()
  const formNameMap: Record<string, string> = {}
  allForms.forEach((f) => {
    formNameMap[f.id] = f.title || f.id
  })

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* ODK Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Projects */}
        <Card
          className="p-3 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate({ view: "projects" })}
        >
          <div className="flex items-center gap-2 mb-1">
            <FolderKanban className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs lg:text-sm text-blue-700 dark:text-blue-300 font-medium">
              Projects
            </span>
          </div>
          <div className="text-xl lg:text-3xl font-bold text-blue-900 dark:text-blue-100">
            {projects.length}
          </div>
        </Card>

        {/* Forms */}
        <Card className="p-3 lg:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs lg:text-sm text-green-700 dark:text-green-300 font-medium">
              Forms
            </span>
          </div>
          <div className="text-xl lg:text-3xl font-bold text-green-900 dark:text-green-100">
            {formCount}
          </div>
        </Card>

        {/* Total Submissions */}
        <Card className="p-3 lg:p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs lg:text-sm text-purple-700 dark:text-purple-300 font-medium">
              Submissions
            </span>
          </div>
          <div className="text-xl lg:text-3xl font-bold text-purple-900 dark:text-purple-100">
            {submissions.length}
          </div>
        </Card>

        {/* Pending Review */}
        <Card className="p-3 lg:p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs lg:text-sm text-amber-700 dark:text-amber-300 font-medium">
              Pending Review
            </span>
          </div>
          <div className="text-xl lg:text-3xl font-bold text-amber-900 dark:text-amber-100">
            {pendingReview}
          </div>
        </Card>
      </div>

      {/* Submissions by Review State + Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">
            Submissions by Review State
          </h3>
          {reviewStateData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={reviewStateData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {reviewStateData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {reviewStateData.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-muted-foreground">
              No submissions yet
            </div>
          )}
        </Card>

        {/* Recent Submissions Table */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent Submissions</h3>
          {recentSubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                      Submitter
                    </th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                      Form
                    </th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 inline" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-border hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        navigate({
                          view: "submission-detail",
                          projectId: sub.projectId,
                          formId: sub.formId,
                          submissionId: sub.id,
                        })
                      }
                    >
                      <td className="py-2 px-2">{sub.submitter}</td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {formNameMap[sub.formId] || sub.formId}
                      </td>
                      <td className="py-2 px-2">
                        <Badge
                          variant="outline"
                          className={
                            sub.reviewState === "approved"
                              ? "border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-400 dark:bg-green-950"
                              : sub.reviewState === "hasIssues"
                                ? "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:bg-amber-950"
                                : sub.reviewState === "rejected"
                                  ? "border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-400 dark:bg-red-950"
                                  : "border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:bg-blue-950"
                          }
                        >
                          {REVIEW_LABELS[sub.reviewState]}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right text-muted-foreground text-xs whitespace-nowrap">
                        {timeAgo(sub.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-muted-foreground">
              No submissions yet
            </div>
          )}
        </Card>
      </div>

      {/* Field Data Statistics (AdminDashboard) */}
      <div>
        <h3 className="font-semibold text-lg mb-4">
          Field Data Statistics
        </h3>
        <AdminDashboard />
      </div>
    </div>
  )
}
