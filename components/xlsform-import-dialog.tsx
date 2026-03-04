"use client"

import { useState, useCallback, useRef } from "react"
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
import { AlertTriangle, Upload, Loader2, CheckCircle2, FileSpreadsheet, X } from "lucide-react"
import { importXLSForm, importXLSFormFromFile, previewXLSForm, previewXLSFormFromFile } from "@/lib/xlsform-importer"
import { createForm, type Form } from "@/lib/form-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [file, setFile] = useState<File | null>(null)
  const [surveyText, setSurveyText] = useState("")
  const [choicesText, setChoicesText] = useState("")
  const [preview, setPreview] = useState<ReturnType<typeof previewXLSForm> | null>(null)
  const [importing, setImporting] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("file")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile)
      setError(null)
      setPreview(null)
    } else {
      setError("Please upload an .xlsx or .xls file")
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setPreview(null)
    }
  }, [])

  const handleParseFile = useCallback(async () => {
    if (!file) return
    setParsing(true)
    setError(null)
    try {
      const result = await previewXLSFormFromFile(file)
      if (result.fieldCount === 0 && result.warnings.length > 0) {
        setError(result.warnings[0])
        setPreview(null)
      } else {
        setPreview(result)
      }
    } catch (e: any) {
      setError(e.message || "Failed to parse file")
    } finally {
      setParsing(false)
    }
  }, [file])

  const handleParseText = useCallback(() => {
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

  const handleImport = useCallback(async () => {
    setImporting(true)
    setError(null)
    try {
      let formData: any

      if (activeTab === "file" && file) {
        const result = await importXLSFormFromFile(file)
        formData = result.form
      } else {
        const result = importXLSForm(surveyText, choicesText)
        formData = result.form
      }

      const created = createForm(formData)
      onImported(created)
      handleClose()
    } catch (e: any) {
      setError(e.message || "Import failed")
    } finally {
      setImporting(false)
    }
  }, [activeTab, file, surveyText, choicesText, onImported])

  const handleClose = () => {
    setFile(null)
    setSurveyText("")
    setChoicesText("")
    setPreview(null)
    setError(null)
    setActiveTab("file")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Form
          </DialogTitle>
          <DialogDescription>
            Upload an XLSForm (.xlsx) file or paste spreadsheet data to import your ODK form with all logic and validation.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPreview(null); setError(null) }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="paste">Paste Data</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4 mt-4">
            {/* File Drop Zone */}
            {!file ? (
              <div
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-10 cursor-pointer hover:border-primary hover:bg-primary/10 transition-all"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileSpreadsheet className="h-7 w-7" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Drop your XLSForm here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">Supports .xlsx and .xls files</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setPreview(null) }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="paste" className="space-y-4 mt-4">
            {/* Survey Sheet */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Survey Sheet <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full h-36 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                placeholder={"type\tname\tlabel\thint\trequired\ntext\trespondent_name\tRespondent Name\tEnter full name\tyes\nselect_one gender_list\tgender\tGender\t\tyes"}
                value={surveyText}
                onChange={(e) => { setSurveyText(e.target.value); setPreview(null) }}
              />
            </div>

            {/* Choices Sheet */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Choices Sheet <span className="text-muted-foreground text-xs">(for select fields)</span>
              </label>
              <textarea
                className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                placeholder={"list_name\tname\tlabel\ngender_list\tmale\tMale\ngender_list\tfemale\tFemale"}
                value={choicesText}
                onChange={(e) => { setChoicesText(e.target.value); setPreview(null) }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview */}
        {preview && preview.fieldCount > 0 && (
          <div className="rounded-md border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Ready to Import
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

            <div className="flex flex-wrap gap-1.5">
              {Object.entries(preview.fieldTypes).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs font-mono">
                  {type}: {count}
                </Badge>
              ))}
            </div>

            {preview.languages.length > 1 && (
              <div className="text-sm text-muted-foreground">
                Languages: {preview.languages.join(", ")}
              </div>
            )}

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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {!preview || preview.fieldCount === 0 ? (
            <Button
              onClick={activeTab === "file" ? handleParseFile : handleParseText}
              disabled={activeTab === "file" ? !file || parsing : !surveyText.trim()}
            >
              {parsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Parsing...
                </>
              ) : (
                "Parse"
              )}
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
                  <Upload className="w-4 h-4 mr-1.5" />
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
