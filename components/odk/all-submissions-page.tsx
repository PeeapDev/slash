"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigation } from "@/lib/navigation-context"
import { odkStore, type OdkProject, type OdkSubmission, type OdkReviewState } from "@/lib/odk-store"
import { getForms, type Form } from "@/lib/form-store"
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
import { Inbox, Search } from "lucide-react"
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

export default function AllSubmissionsPage() {
  const { navigate } = useNavigation()
  const [submissions, setSubmissions] = useState<OdkSubmission[]>([])
  const [projects, setProjects] = useState<OdkProject[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [projectFilter, setProjectFilter] = useState("all")
  const [formFilter, setFormFilter] = useState("all")
  const [reviewFilter, setReviewFilter] = useState("all")
  const [submitterFilter, setSubmitterFilter] = useState("all")
  const [searchText, setSearchText] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const [subs, projs] = await Promise.all([
          odkStore.getSubmissions(),
          odkStore.getProjects(),
        ])
        setSubmissions(subs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
        setProjects(projs)
        setForms(getForms())
      } catch (err) {
        console.error("Failed to load submissions:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Lookup maps
  const projectMap = useMemo(() => {
    const m: Record<string, string> = {}
    projects.forEach((p) => { m[p.id] = p.name })
    return m
  }, [projects])

  const formMap = useMemo(() => {
    const m: Record<string, string> = {}
    forms.forEach((f) => { m[f.id] = f.title || f.name || f.id })
    return m
  }, [forms])

  // Unique submitters
  const submitters = useMemo(
    () => Array.from(new Set(submissions.map((s) => s.submitter))).sort(),
    [submissions]
  )

  // Filtered submissions
  const filtered = useMemo(() => {
    let result = submissions
    if (projectFilter !== "all") {
      result = result.filter((s) => s.projectId === projectFilter)
    }
    if (formFilter !== "all") {
      result = result.filter((s) => s.formId === formFilter)
    }
    if (reviewFilter !== "all") {
      result = result.filter((s) => s.reviewState === reviewFilter)
    }
    if (submitterFilter !== "all") {
      result = result.filter((s) => s.submitter === submitterFilter)
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      result = result.filter(
        (s) =>
          s.submitter.toLowerCase().includes(q) ||
          (formMap[s.formId] || s.formId).toLowerCase().includes(q) ||
          (projectMap[s.projectId] || "").toLowerCase().includes(q)
      )
    }
    return result
  }, [submissions, projectFilter, formFilter, reviewFilter, submitterFilter, searchText, formMap, projectMap])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-semibold">All Submissions</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9 w-[200px]"
          />
        </div>

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={formFilter} onValueChange={setFormFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Form" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Forms</SelectItem>
            {forms.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.title || f.name || f.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={reviewFilter} onValueChange={setReviewFilter}>
          <SelectTrigger className="w-[150px]">
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

        <Select value={submitterFilter} onValueChange={setSubmitterFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Submitter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Submitters</SelectItem>
            {submitters.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No submissions found.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitter</TableHead>
                <TableHead>Form</TableHead>
                <TableHead className="hidden md:table-cell">Project</TableHead>
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
                      projectId: sub.projectId,
                      formId: sub.formId,
                      submissionId: sub.id,
                    })
                  }
                >
                  <TableCell className="whitespace-nowrap">{sub.submitter}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formMap[sub.formId] || sub.formId}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {projectMap[sub.projectId] || sub.projectId}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${reviewColors[sub.reviewState]}`}
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
