"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { AlertTriangle, FileUp, Loader2, CheckCircle2 } from "lucide-react"
import { importXLSForm, previewXLSForm } from "@/lib/xlsform-importer"
import { createForm, type Form } from "@/lib/form-store"

interface XLSFormImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: (form: Form) => void
}

export default function XLSFormImportDialog({
  open,
  onOpenChange,
  onImported,
}: XLSFormImportDialogProps) {
  const [surveyText, setSurveyText] = useState("")
  const [choicesText, setChoicesText] = useState("")
  const [preview, setPreview] = useState<ReturnType<typeof previewXLSForm> | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleParse = useCallback(() => {
    setError(null)
    if (!surveyText.trim()) {
      setError("Paste the survey sheet data first.")
      return
    }
    const result = previewXLSForm(surveyText, choicesText)
    if (result.fieldCount === 0 && result.warnings.length > 0) {
      setError(result.warnings[0])
      setPreview(null)
    } else {
      setPreview(result)
    }
  }, [surveyText, choicesText])

  const handleImport = useCallback(() => {
    setImporting(true)
    setError(null)
    try {
      const { form: formData } = importXLSForm(surveyText, choicesText)
      const created = createForm(formData)
      onImported(created)
      // Reset
      setSurveyText("")
      setChoicesText("")
      setPreview(null)
      onOpenChange(false)
    } catch (e: any) {
      setError(e.message || "Import failed")
    } finally {
      setImporting(false)
    }
  }, [surveyText, choicesText, onImported, onOpenChange])

  const handleClose = () => {
    setSurveyText("")
    setChoicesText("")
    setPreview(null)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Import XLSForm
          </DialogTitle>
          <DialogDescription>
            Paste your XLSForm data below. Copy rows from the <strong>survey</strong> and{" "}
            <strong>choices</strong> sheets in your spreadsheet (including the header row).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Survey Sheet */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Survey Sheet <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full h-40 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              placeholder={"type\tname\tlabel\thint\trequired\ntext\trespondent_name\tRespondent Name\tEnter full name\tyes\nselect_one gender_list\tgender\tGender\t\tyes\ninteger\tage\tAge\tYears\tyes"}
              value={surveyText}
              onChange={(e) => {
                setSurveyText(e.target.value)
                setPreview(null)
              }}
            />
          </div>

          {/* Choices Sheet */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Choices Sheet{" "}
              <span className="text-muted-foreground text-xs">(optional if no select fields)</span>
            </label>
            <textarea
              className="w-full h-28 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              placeholder={"list_name\tname\tlabel\ngender_list\tmale\tMale\ngender_list\tfemale\tFemale\ngender_list\tother\tOther"}
              value={choicesText}
              onChange={(e) => {
                setChoicesText(e.target.value)
                setPreview(null)
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview */}
          {preview && preview.fieldCount > 0 && (
            <div className="rounded-md border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Parse Preview
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold">{preview.fieldCount}</div>
                  <div className="text-muted-foreground">Fields</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{preview.groupCount}</div>
                  <div className="text-muted-foreground">Groups</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{preview.repeatGroupCount}</div>
                  <div className="text-muted-foreground">Repeat Groups</div>
                </div>
              </div>

              {/* Field type breakdown */}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(preview.fieldTypes).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-xs font-mono">
                    {type}: {count}
                  </Badge>
                ))}
              </div>

              {/* Languages */}
              {preview.languages.length > 1 && (
                <div className="text-sm text-muted-foreground">
                  Languages: {preview.languages.join(", ")}
                </div>
              )}

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs font-medium text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {preview.warnings.length} warning{preview.warnings.length > 1 ? "s" : ""}
                  </div>
                  <ul className="text-xs text-amber-700 space-y-0.5 max-h-24 overflow-y-auto">
                    {preview.warnings.map((w, i) => (
                      <li key={i} className="pl-5">- {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {!preview || preview.fieldCount === 0 ? (
            <Button onClick={handleParse} disabled={!surveyText.trim()}>
              Parse
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4 mr-1.5" />
                  Import ({preview.fieldCount} fields)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
