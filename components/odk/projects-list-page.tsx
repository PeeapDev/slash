"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigation } from "@/lib/navigation-context"
import { odkStore, type OdkProject } from "@/lib/odk-store"
import NewProjectDialog from "./new-project-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, FolderKanban } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ProjectRow extends OdkProject {
  formCount: number
  submissionCount: number
  lastSubmission?: string
}

export default function ProjectsListPage() {
  const { navigate, setProjectName } = useNavigation()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const all = await odkStore.getProjects()
    const rows: ProjectRow[] = await Promise.all(
      all
        .filter((p) => !p.archived)
        .map(async (p) => {
          const stats = await odkStore.getProjectStats(p.id)
          return { ...p, ...stats }
        })
    )
    rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    setProjects(rows)
    // Cache names for breadcrumbs
    rows.forEach((p) => setProjectName(p.id, p.name))
    setLoading(false)
  }, [setProjectName])

  useEffect(() => {
    load()
  }, [load])

  const filtered = search
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
      )
    : projects

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">
            {search ? "No matching projects" : "No projects yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search
              ? "Try a different search term."
              : "Create your first project to start collecting data."}
          </p>
          {!search && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Description</TableHead>
                <TableHead className="text-center w-20">Forms</TableHead>
                <TableHead className="text-center w-28">Submissions</TableHead>
                <TableHead className="hidden md:table-cell w-36">Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({ view: "project-detail", projectId: p.id })
                  }
                >
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground truncate max-w-[200px]">
                    {p.description || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{p.formCount}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{p.submissionCount}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {p.lastSubmission
                      ? formatDistanceToNow(new Date(p.lastSubmission), { addSuffix: true })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <NewProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={load}
      />
    </div>
  )
}
