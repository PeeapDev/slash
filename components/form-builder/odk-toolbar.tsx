"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import OdkQuestionTypePicker from "./odk-question-type-picker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Eye,
  Save,
  Undo2,
  Redo2,
  FolderPlus,
  Repeat,
  Upload,
  Download,
} from "lucide-react"
import { FormField } from "@/lib/form-store"

interface OdkToolbarProps {
  formName: string
  onFormNameChange: (name: string) => void
  formType: "survey" | "sample"
  onFormTypeChange: (type: "survey" | "sample") => void
  formTargetRole: string
  onFormTargetRoleChange: (role: string) => void
  formStatus: "active" | "archived"
  onFormStatusChange: (status: "active" | "archived") => void
  onAddField: (type: FormField["type"]) => void
  onAddGroup: () => void
  onAddRepeatGroup: () => void
  onPreview: () => void
  onSave: () => void
  onClose: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  canSave: boolean
  canPreview: boolean
  isSaving: boolean
  isEditing: boolean
  fieldCount: number
  onPublish: () => void
  onExportXForm: () => void
  onExportXLSForm: () => void
  canPublish: boolean
  publishStatus: 'draft' | 'published'
}

export default function OdkToolbar({
  formName,
  onFormNameChange,
  formType,
  onFormTypeChange,
  formTargetRole,
  onFormTargetRoleChange,
  formStatus,
  onFormStatusChange,
  onAddField,
  onAddGroup,
  onAddRepeatGroup,
  onPreview,
  onSave,
  onClose,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  canSave,
  canPreview,
  isSaving,
  isEditing,
  fieldCount,
  onPublish,
  onExportXForm,
  onExportXLSForm,
  canPublish,
  publishStatus,
}: OdkToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-2 px-3 py-2 bg-background">
        {/* Back button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to Forms</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Form name */}
        <Input
          value={formName}
          onChange={(e) => onFormNameChange(e.target.value)}
          placeholder="Untitled Form"
          className="text-sm font-medium border-none shadow-none focus-visible:ring-1 h-8 max-w-[260px]"
        />

        {/* Form meta badges */}
        <div className="hidden md:flex items-center gap-1.5">
          <select
            value={formType}
            onChange={(e) => onFormTypeChange(e.target.value as "survey" | "sample")}
            className="text-xs bg-muted/50 border rounded-md px-2 py-1 h-7"
          >
            <option value="survey">Survey</option>
            <option value="sample">Sample</option>
          </select>
          <select
            value={formTargetRole}
            onChange={(e) => onFormTargetRoleChange(e.target.value)}
            className="text-xs bg-muted/50 border rounded-md px-2 py-1 h-7"
          >
            <option value="field-collector">Field Collector</option>
            <option value="supervisor">Supervisor</option>
            <option value="lab-technician">Lab Technician</option>
          </select>
          <select
            value={formStatus}
            onChange={(e) => onFormStatusChange(e.target.value as "active" | "archived")}
            className="text-xs bg-muted/50 border rounded-md px-2 py-1 h-7"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <Badge variant="outline" className="text-[10px] h-5 hidden sm:flex">
          {fieldCount} field{fieldCount !== 1 ? "s" : ""}
        </Badge>

        <Badge
          variant={publishStatus === 'published' ? 'default' : 'secondary'}
          className={`text-[10px] h-5 hidden sm:flex ${
            publishStatus === 'published'
              ? 'bg-green-100 text-green-700 border-green-300'
              : 'bg-amber-100 text-amber-700 border-amber-300'
          }`}
        >
          {publishStatus === 'published' ? 'Published' : 'Draft'}
        </Badge>

        <div className="flex-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onUndo} disabled={!canUndo}>
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onRedo} disabled={!canRedo}>
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Add Question (type picker popover) */}
        <OdkQuestionTypePicker onSelectType={onAddField} />

        {/* Add Group */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onAddGroup} className="gap-1.5 h-8">
              <FolderPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Group</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add a section/group</TooltipContent>
        </Tooltip>

        {/* Add Repeat Group */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onAddRepeatGroup} className="gap-1.5 h-8">
              <Repeat className="w-4 h-4" />
              <span className="hidden sm:inline">Repeat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add a repeat group</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Preview */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onPreview} disabled={!canPreview} className="gap-1.5 h-8">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Preview form</TooltipContent>
        </Tooltip>

        {/* Save */}
        <Button size="sm" variant="outline" onClick={onSave} disabled={!canSave || isSaving} className="gap-1.5 h-8">
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>

        {/* Publish */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" onClick={onPublish} disabled={!canPublish} className="gap-1.5 h-8 bg-green-600 hover:bg-green-700 text-white">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Publish</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Publish form (creates a new version)</TooltipContent>
        </Tooltip>

        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 h-8">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportXForm}>
              Export as XForm (XML)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportXLSForm}>
              Export as XLSForm (CSV)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  )
}
