"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigation } from "@/lib/navigation-context"
import { getFormsByProject, type Form } from "@/lib/form-store"
import { odkStore } from "@/lib/odk-store"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  closed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

interface FormRow extends Form {
  submissionCount: number
  lastSubmission?: string
}

export default function ProjectFormsTab({ projectId }: { projectId: string }) {
  const { navigate, setFormName } = useNavigation()
  const [forms, setForms] = useState<FormRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const raw = getFormsByProject(projectId)
    const rows: FormRow[] = await Promise.all(
      raw.map(async (f) => {
        const subs = await odkStore.getSubmissions(f.id)
        const sorted = subs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        setFormName(f.id, f.name)
        return {
          ...f,
          submissionCount: subs.length,
          lastSubmission: sorted[0]?.createdAt,
        }
      })
    )
    setForms(rows)
    setLoading(false)
  }, [projectId, setFormName])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Forms</h2>
        <Button
          size="sm"
          onClick={() => navigate({ view: "form-builder", projectId })}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Form
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            No forms yet. Create one to start collecting data.
          </p>
          <Button
            size="sm"
            onClick={() => navigate({ view: "form-builder", projectId })}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Form
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="text-center w-28">Submissions</TableHead>
                <TableHead className="hidden md:table-cell w-36">Last Submission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((f) => (
                <TableRow
                  key={f.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({
                      view: "form-detail",
                      projectId,
                      formId: f.id,
                    })
                  }
                >
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[f.odkStatus || "open"]
                      }`}
                    >
                      {(f.odkStatus || "open").charAt(0).toUpperCase() +
                        (f.odkStatus || "open").slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{f.submissionCount}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {f.lastSubmission
                      ? formatDistanceToNow(new Date(f.lastSubmission), {
                          addSuffix: true,
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
