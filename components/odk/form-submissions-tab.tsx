"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigation } from "@/lib/navigation-context"
import { type Form } from "@/lib/form-store"
import { odkStore, type OdkSubmission, type OdkReviewState } from "@/lib/odk-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, ClipboardList } from "lucide-react"
import { format } from "date-fns"

const reviewColors: Record<OdkReviewState, string> = {
  received: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  hasIssues: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const reviewLabels: Record<OdkReviewState, string> = {
  received: "Received",
  hasIssues: "Has Issues",
  approved: "Approved",
  rejected: "Rejected",
}

interface Props {
  form: Form
  projectId: string
}

export default function FormSubmissionsTab({ form, projectId }: Props) {
  const { navigate } = useNavigation()
  const [submissions, setSubmissions] = useState<OdkSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [submitterFilter, setSubmitterFilter] = useState("all")
  const [reviewFilter, setReviewFilter] = useState("all")

  const load = useCallback(async () => {
    setLoading(true)
    const subs = await odkStore.getSubmissions(form.id)
    setSubmissions(subs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    setLoading(false)
  }, [form.id])

  useEffect(() => {
    load()
  }, [load])

  // Compute dynamic columns from form fields (first 6)
  const columns = useMemo(() => {
    return form.fields
      .filter((f) => f.type !== "note" && f.type !== "calculate")
      .slice(0, 6)
  }, [form.fields])

  // Unique submitters for filter
  const submitters = useMemo(
    () => Array.from(new Set(submissions.map((s) => s.submitter))).sort(),
    [submissions]
  )

  // Filtered submissions
  const filtered = useMemo(() => {
    let result = submissions
    if (submitterFilter !== "all") {
      result = result.filter((s) => s.submitter === submitterFilter)
    }
    if (reviewFilter !== "all") {
      result = result.filter((s) => s.reviewState === reviewFilter)
    }
    return result
  }, [submissions, submitterFilter, reviewFilter])

  const handleExport = async (fmt: "csv" | "json") => {
    const content = await odkStore.exportSubmissions(form.id, fmt)
    const blob = new Blob([content], {
      type: fmt === "csv" ? "text/csv" : "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${form.name.replace(/\s+/g, "_")}_submissions.${fmt}`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={submitterFilter} onValueChange={setSubmitterFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Submitter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Submitters</SelectItem>
            {submitters.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={reviewFilter} onValueChange={setReviewFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Review State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="hasIssues">Has Issues</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
            <Download className="h-4 w-4 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No submissions found.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.id} className="whitespace-nowrap">
                    {col.label}
                  </TableHead>
                ))}
                <TableHead>Submitter</TableHead>
                <TableHead className="w-28">Review</TableHead>
                <TableHead className="hidden md:table-cell w-36">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub) => (
                <TableRow
                  key={sub.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({
                      view: "submission-detail",
                      projectId,
                      formId: form.id,
                      submissionId: sub.id,
                    })
                  }
                >
                  {columns.map((col) => (
                    <TableCell key={col.id} className="whitespace-nowrap max-w-[160px] truncate">
                      {sub.data[col.id] != null ? String(sub.data[col.id]) : "—"}
                    </TableCell>
                  ))}
                  <TableCell className="whitespace-nowrap">{sub.submitter}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        reviewColors[sub.reviewState]
                      }`}
                    >
                      {reviewLabels[sub.reviewState]}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {format(new Date(sub.createdAt), "MMM d, yyyy HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {submissions.length} submissions
      </p>
    </div>
  )
}
