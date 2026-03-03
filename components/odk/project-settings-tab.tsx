"use client"

import { useState } from "react"
import { odkStore, type OdkProject } from "@/lib/odk-store"
import { useNavigation } from "@/lib/navigation-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Props {
  project: OdkProject
  onUpdated: (p: OdkProject) => void
}

export default function ProjectSettingsTab({ project, onUpdated }: Props) {
  const { navigate } = useNavigation()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [saving, setSaving] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const updated = await odkStore.updateProject(project.id, {
      name: name.trim(),
      description: description.trim(),
    })
    if (updated) onUpdated(updated)
    setSaving(false)
  }

  const handleArchive = async () => {
    await odkStore.updateProject(project.id, { archived: true })
    setArchiveOpen(false)
    navigate({ view: "projects" })
  }

  const dirty = name !== project.name || description !== project.description

  return (
    <div className="space-y-6 max-w-lg">
      {/* General settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pname">Project Name</Label>
            <Input
              id="pname"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdesc">Description</Label>
            <Textarea
              id="pdesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleSave} disabled={!dirty || !name.trim() || saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Archiving a project hides it from the projects list. Data is preserved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setArchiveOpen(true)}>
            Archive Project
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive &quot;{project.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the project from the projects list. All data will be
              preserved but no new submissions will be accepted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
