"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigation } from "@/lib/navigation-context"
import { getFormById, type Form } from "@/lib/form-store"
import {
  odkStore,
  type OdkSubmission,
  type OdkComment,
  type OdkReviewState,
} from "@/lib/odk-store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, Pencil, Check, X } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

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

export default function SubmissionDetailPage() {
  const { state, navigate } = useNavigation()
  const [submission, setSubmission] = useState<OdkSubmission | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [comments, setComments] = useState<OdkComment[]>([])
  const [commentText, setCommentText] = useState("")
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const loadComments = useCallback(async (subId: string) => {
    const c = await odkStore.getComments(subId)
    setComments(c.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }, [])

  useEffect(() => {
    if (!state.submissionId) return
    setLoading(true)
    odkStore.getSubmission(state.submissionId).then((s) => {
      setSubmission(s)
      if (s) {
        setEditData(s.data)
        const f = getFormById(s.formId)
        setForm(f ?? null)
        loadComments(s.id)
      }
      setLoading(false)
    })
  }, [state.submissionId, loadComments])

  const handleReviewChange = async (reviewState: OdkReviewState) => {
    if (!submission) return
    const updated = await odkStore.updateSubmission(submission.id, { reviewState })
    if (updated) setSubmission(updated)
  }

  const handleAddComment = async () => {
    if (!submission || !commentText.trim()) return
    await odkStore.addComment(submission.id, commentText.trim(), "Admin User")
    setCommentText("")
    loadComments(submission.id)
  }

  const handleSaveEdit = async () => {
    if (!submission) return
    const updated = await odkStore.updateSubmission(submission.id, { data: editData })
    if (updated) setSubmission(updated)
    setEditing(false)
  }

  if (loading || !submission) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const fields = form?.fields.filter((f) => f.type !== "note") || []

  // Group fields by groupId
  const groups: { label: string; fields: typeof fields }[] = []
  const seenGroups = new Set<string>()
  fields.forEach((f) => {
    const gid = f.groupId || "__default"
    if (!seenGroups.has(gid)) {
      seenGroups.add(gid)
      groups.push({
        label: gid === "__default" ? "General" : gid,
        fields: fields.filter((ff) => (ff.groupId || "__default") === gid),
      })
    }
  })

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            navigate({
              view: "form-detail",
              projectId: state.projectId,
              formId: state.formId,
              tab: "Submissions",
            })
          }
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Submission</h1>
          <p className="text-sm text-muted-foreground">
            by {submission.submitter} &middot;{" "}
            {format(new Date(submission.createdAt), "MMM d, yyyy HH:mm")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: Field data */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Response Data</h2>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditData(submission.data)
                    setEditing(false)
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {groups.map((g) => (
            <Card key={g.label}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {g.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {g.fields.map((field) => (
                  <div key={field.id} className="grid grid-cols-[140px_1fr] gap-2 items-start">
                    <Label className="text-sm text-muted-foreground pt-1 truncate">
                      {field.label}
                    </Label>
                    {editing ? (
                      <input
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        value={editData[field.id] ?? ""}
                        onChange={(e) =>
                          setEditData((d) => ({ ...d, [field.id]: e.target.value }))
                        }
                      />
                    ) : (
                      <span className="text-sm py-1">
                        {submission.data[field.id] != null
                          ? String(submission.data[field.id])
                          : "—"}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Activity panel */}
        <div className="space-y-4">
          {/* Review state */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Review State</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={submission.reviewState}
                onValueChange={(v) => handleReviewChange(v as OdkReviewState)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(reviewLabels) as OdkReviewState[]).map((rs) => (
                    <SelectItem key={rs} value={rs}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            reviewColors[rs].split(" ")[0]
                          }`}
                        />
                        {reviewLabels[rs]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Comment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                  className="min-h-0"
                />
                <Button
                  size="icon"
                  className="shrink-0"
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {comments.length > 0 && <Separator />}

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.author}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{c.body}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
