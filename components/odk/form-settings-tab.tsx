"use client"

import { useState } from "react"
import { useNavigation } from "@/lib/navigation-context"
import { type Form, updateForm, deleteForm, publishForm } from "@/lib/form-store"
import { formToXForm, formToXLSForm, exportXLSFormAsCSV, downloadAsFile } from "@/lib/form-serializer"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Pencil, Upload, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Props {
  form: Form
  projectId: string
  onUpdated: (f: Form) => void
}

export default function FormSettingsTab({ form, projectId, onUpdated }: Props) {
  const { navigate } = useNavigation()
  const [odkStatus, setOdkStatus] = useState<"open" | "closing" | "closed">(
    form.odkStatus || "open"
  )
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSaveStatus = async () => {
    setSaving(true)
    const updated = updateForm(form.id, { odkStatus })
    if (updated) onUpdated(updated)
    setSaving(false)
  }

  const handleDelete = () => {
    deleteForm(form.id)
    setDeleteOpen(false)
    navigate({ view: "project-detail", projectId, tab: "Forms" })
  }

  const dirty = odkStatus !== (form.odkStatus || "open")

  return (
    <div className="space-y-6 max-w-lg">
      {/* State */}
      <Card>
        <CardHeader>
          <CardTitle>Form State</CardTitle>
          <CardDescription>
            Control whether this form accepts new submissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={odkStatus}
              onValueChange={(v) => setOdkStatus(v as any)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closing">Closing</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveStatus} disabled={!dirty || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      {/* Export & Deploy */}
      <Card>
        <CardHeader>
          <CardTitle>Export & Deploy</CardTitle>
          <CardDescription>
            Publish this form or export it in ODK-compatible formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            {form.publishStatus === 'published' ? (
              <>
                <Badge className="bg-green-100 text-green-700 border-green-300">Published</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const updated = publishForm(form.id)
                    if (updated) onUpdated(updated)
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Re-publish
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  const updated = publishForm(form.id)
                  if (updated) onUpdated(updated)
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Publish Form
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const xml = formToXForm(form)
                const filename = `${form.name.replace(/[^a-zA-Z0-9]/g, '_')}.xml`
                downloadAsFile(xml, filename, 'application/xml')
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export XForm (XML)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const sheets = formToXLSForm(form)
                const csv = exportXLSFormAsCSV(sheets)
                const filename = `${form.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`
                downloadAsFile(csv, filename, 'text/csv')
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export XLSForm (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Form</CardTitle>
          <CardDescription>
            Open the form builder to modify fields and logic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() =>
              navigate({ view: "form-builder", projectId, formId: form.id })
            }
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Form
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this form and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete Form
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{form.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this form and all its submissions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
