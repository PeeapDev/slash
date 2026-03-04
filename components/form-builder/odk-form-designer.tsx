"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import OdkToolbar from "./odk-toolbar"
import OdkStructureTree from "./odk-structure-tree"
import OdkQuestionCanvas from "./odk-question-canvas"
import OdkPropertiesPanel from "./odk-properties-panel"
import FormPreview from "../form-preview"
import { Form, FormField, FormGroupMeta, RepeatGroupMeta, createForm, updateForm, publishForm } from "@/lib/form-store"
import { formToXForm, formToXLSForm, exportXLSFormAsCSV, downloadAsFile } from "@/lib/form-serializer"

// Re-export so downstream components don't break
export type { FormGroupMeta, RepeatGroupMeta }

export interface DesignerState {
  fields: FormField[]
  groups: FormGroupMeta[]
  repeatGroups: RepeatGroupMeta[]
  selectedFieldId: string | null
  expandedCardIds: Set<string>
}

interface UndoEntry {
  fields: FormField[]
  groups: FormGroupMeta[]
  repeatGroups: RepeatGroupMeta[]
}

interface OdkFormDesignerProps {
  form?: Form | null
  onClose: () => void
  /** When creating a new form from a project context, set the projectId */
  projectId?: string
}

export default function OdkFormDesigner({ form, onClose, projectId }: OdkFormDesignerProps) {
  const [formName, setFormName] = useState(form?.name || "")
  const [formType, setFormType] = useState<"survey" | "sample">(form?.type || "survey")
  const [formTargetRole, setFormTargetRole] = useState(form?.targetRole || "field-collector")
  const [formStatus, setFormStatus] = useState<"active" | "archived">(form?.status || "active")
  const [fields, setFields] = useState<FormField[]>(form?.fields || [])
  const [groups, setGroups] = useState<FormGroupMeta[]>([])
  const [repeatGroups, setRepeatGroups] = useState<RepeatGroupMeta[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>(form?.publishStatus || 'draft')
  const [savedFormId, setSavedFormId] = useState<string | null>(form?.id || null)

  // Undo/Redo
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([])
  const [redoStack, setRedoStack] = useState<UndoEntry[]>([])
  const skipNextSnapshot = useRef(false)

  // Initialize groups + repeat groups: prefer persisted form.groups, fall back to inferring from fields
  useEffect(() => {
    if (!form) return
    if (form.groups && form.groups.length > 0) {
      setGroups(form.groups.map(g => ({ ...g, collapsed: false })))
    } else if (form.fields) {
      const groupIds = new Set<string>()
      form.fields.forEach(f => { if (f.groupId) groupIds.add(f.groupId) })
      setGroups(
        Array.from(groupIds).map(id => ({
          id,
          label: id.replace("group-", "Group "),
          collapsed: false,
        }))
      )
    }
    if (form.repeatGroups && form.repeatGroups.length > 0) {
      setRepeatGroups(form.repeatGroups.map(g => ({ ...g, collapsed: false })))
    } else if (form.fields) {
      const repeatIds = new Set<string>()
      form.fields.forEach(f => { if (f.repeatGroupId) repeatIds.add(f.repeatGroupId) })
      setRepeatGroups(
        Array.from(repeatIds).map(id => {
          const firstField = form.fields.find(f => f.repeatGroupId === id)
          return {
            id,
            label: id.replace("repeat-", "Repeat "),
            collapsed: false,
            repeatMin: firstField?.repeatMin,
            repeatMax: firstField?.repeatMax,
          }
        })
      )
    }
  }, [form])

  const pushUndo = useCallback(() => {
    if (skipNextSnapshot.current) {
      skipNextSnapshot.current = false
      return
    }
    setUndoStack(prev => [...prev.slice(-49), {
      fields: JSON.parse(JSON.stringify(fields)),
      groups: JSON.parse(JSON.stringify(groups)),
      repeatGroups: JSON.parse(JSON.stringify(repeatGroups)),
    }])
    setRedoStack([])
  }, [fields, groups, repeatGroups])

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setRedoStack(r => [...r, {
        fields: JSON.parse(JSON.stringify(fields)),
        groups: JSON.parse(JSON.stringify(groups)),
        repeatGroups: JSON.parse(JSON.stringify(repeatGroups)),
      }])
      skipNextSnapshot.current = true
      setFields(last.fields)
      setGroups(last.groups)
      setRepeatGroups(last.repeatGroups)
      return prev.slice(0, -1)
    })
  }, [fields, groups, repeatGroups])

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setUndoStack(u => [...u, {
        fields: JSON.parse(JSON.stringify(fields)),
        groups: JSON.parse(JSON.stringify(groups)),
        repeatGroups: JSON.parse(JSON.stringify(repeatGroups)),
      }])
      skipNextSnapshot.current = true
      setFields(last.fields)
      setGroups(last.groups)
      setRepeatGroups(last.repeatGroups)
      return prev.slice(0, -1)
    })
  }, [fields, groups, repeatGroups])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo() }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo() }
      if (ctrl && e.key === "s") { e.preventDefault(); handleSave() }
      if (e.key === "Delete" && selectedFieldId && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLSelectElement)) {
        e.preventDefault()
        removeField(selectedFieldId)
      }
      if (ctrl && e.key === "d" && selectedFieldId) { e.preventDefault(); duplicateField(selectedFieldId) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo, selectedFieldId, fields, groups, repeatGroups])

  const addField = useCallback((type: FormField["type"], insertAfterId?: string) => {
    pushUndo()
    const needsOptions = ["select", "radio", "checkbox"].includes(type)
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `New ${type} question`,
      required: false,
      ...(needsOptions ? { options: ["Option 1", "Option 2"] } : {}),
      ...(type === "rating" ? { ratingMax: 5 } : {}),
      ...(type === "range" ? { rangeMin: 0, rangeMax: 100, rangeStep: 1 } : {}),
      ...(type === "likert" ? { options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] } : {}),
    }

    setFields(prev => {
      if (insertAfterId) {
        const idx = prev.findIndex(f => f.id === insertAfterId)
        if (idx !== -1) {
          const copy = [...prev]
          const afterField = prev[idx]
          if (afterField.groupId) newField.groupId = afterField.groupId
          if (afterField.repeatGroupId) newField.repeatGroupId = afterField.repeatGroupId
          copy.splice(idx + 1, 0, newField)
          return copy
        }
      }
      return [...prev, newField]
    })
    setSelectedFieldId(newField.id)
    setExpandedCardIds(prev => new Set(prev).add(newField.id))
  }, [pushUndo])

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    pushUndo()
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f))
  }, [pushUndo])

  const removeField = useCallback((fieldId: string) => {
    pushUndo()
    setFields(prev => prev.filter(f => f.id !== fieldId))
    if (selectedFieldId === fieldId) setSelectedFieldId(null)
    setExpandedCardIds(prev => {
      const n = new Set(prev)
      n.delete(fieldId)
      return n
    })
  }, [pushUndo, selectedFieldId])

  const duplicateField = useCallback((fieldId: string) => {
    pushUndo()
    setFields(prev => {
      const idx = prev.findIndex(f => f.id === fieldId)
      if (idx === -1) return prev
      const clone: FormField = { ...JSON.parse(JSON.stringify(prev[idx])), id: `field-${Date.now()}`, label: `${prev[idx].label} (copy)` }
      const copy = [...prev]
      copy.splice(idx + 1, 0, clone)
      return copy
    })
  }, [pushUndo])

  const moveField = useCallback((fieldId: string, direction: "up" | "down") => {
    pushUndo()
    setFields(prev => {
      const idx = prev.findIndex(f => f.id === fieldId)
      if (idx === -1) return prev
      if (direction === "up" && idx === 0) return prev
      if (direction === "down" && idx === prev.length - 1) return prev
      const copy = [...prev]
      const target = direction === "up" ? idx - 1 : idx + 1
      ;[copy[idx], copy[target]] = [copy[target], copy[idx]]
      return copy
    })
  }, [pushUndo])

  // Drag-and-drop reorder: move field from oldIndex to newIndex
  const reorderFields = useCallback((oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return
    pushUndo()
    setFields(prev => {
      const copy = [...prev]
      const [moved] = copy.splice(oldIndex, 1)
      copy.splice(newIndex, 0, moved)
      return copy
    })
  }, [pushUndo])

  // ─── Section Groups ───
  const addGroup = useCallback(() => {
    pushUndo()
    const groupId = `group-${Date.now()}`
    setGroups(prev => [...prev, { id: groupId, label: "New Section", collapsed: false }])
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: "note",
      label: "New section — add questions here",
      required: false,
      groupId,
    }
    setFields(prev => [...prev, newField])
    setSelectedFieldId(newField.id)
  }, [pushUndo])

  const removeGroup = useCallback((groupId: string) => {
    pushUndo()
    setGroups(prev => prev.filter(g => g.id !== groupId))
    setFields(prev => prev.map(f => f.groupId === groupId ? { ...f, groupId: undefined } : f))
  }, [pushUndo])

  const updateGroup = useCallback((groupId: string, updates: Partial<FormGroupMeta>) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g))
  }, [])

  // ─── Repeat Groups ───
  const addRepeatGroup = useCallback(() => {
    pushUndo()
    const repeatId = `repeat-${Date.now()}`
    setRepeatGroups(prev => [...prev, { id: repeatId, label: "New Repeat Group", collapsed: false, repeatMin: 1, repeatMax: undefined }])
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: "note",
      label: "Repeat group — add repeatable questions here",
      required: false,
      repeatGroupId: repeatId,
      repeatMin: 1,
    }
    setFields(prev => [...prev, newField])
    setSelectedFieldId(newField.id)
  }, [pushUndo])

  const removeRepeatGroup = useCallback((repeatGroupId: string) => {
    pushUndo()
    setRepeatGroups(prev => prev.filter(g => g.id !== repeatGroupId))
    setFields(prev => prev.map(f => f.repeatGroupId === repeatGroupId ? { ...f, repeatGroupId: undefined, repeatMin: undefined, repeatMax: undefined } : f))
  }, [pushUndo])

  const updateRepeatGroup = useCallback((repeatGroupId: string, updates: Partial<RepeatGroupMeta>) => {
    setRepeatGroups(prev => prev.map(g => g.id === repeatGroupId ? { ...g, ...updates } : g))
    // Sync repeatMin/repeatMax to fields in this group
    if (updates.repeatMin !== undefined || updates.repeatMax !== undefined) {
      setFields(prev => prev.map(f => {
        if (f.repeatGroupId !== repeatGroupId) return f
        return {
          ...f,
          ...(updates.repeatMin !== undefined ? { repeatMin: updates.repeatMin } : {}),
          ...(updates.repeatMax !== undefined ? { repeatMax: updates.repeatMax } : {}),
        }
      }))
    }
  }, [])

  const selectField = useCallback((fieldId: string | null) => {
    setSelectedFieldId(fieldId)
  }, [])

  const toggleCardExpanded = useCallback((fieldId: string) => {
    setExpandedCardIds(prev => {
      const n = new Set(prev)
      if (n.has(fieldId)) n.delete(fieldId)
      else n.add(fieldId)
      return n
    })
  }, [])

  const saveForm = useCallback((): string | null => {
    if (!formName.trim() || fields.length === 0) return null
    const resolvedProjectId = form?.projectId || projectId
    const data = {
      name: formName,
      type: formType,
      targetRole: formTargetRole,
      status: formStatus,
      publishStatus,
      assignedProjects: form?.assignedProjects || [],
      assignedRegions: form?.assignedRegions || [],
      fields,
      groups,
      repeatGroups,
      createdBy: form?.createdBy || "current-user",
      ...(resolvedProjectId ? { projectId: resolvedProjectId } : {}),
      odkStatus: form?.odkStatus || ("open" as const),
    }
    if (form || savedFormId) {
      const id = form?.id || savedFormId!
      updateForm(id, data)
      return id
    } else {
      const created = createForm(data)
      setSavedFormId(created.id)
      return created.id
    }
  }, [formName, formType, formTargetRole, formStatus, publishStatus, fields, groups, repeatGroups, form, savedFormId, projectId])

  const handleSave = useCallback(async () => {
    if (!formName.trim() || fields.length === 0) return
    setIsSaving(true)
    try {
      saveForm()
      onClose()
    } catch (err) {
      console.error("Error saving form:", err)
    } finally {
      setIsSaving(false)
    }
  }, [formName, fields, saveForm, onClose])

  const handlePublish = useCallback(() => {
    if (!formName.trim() || fields.length === 0) return
    const id = saveForm()
    if (!id) return
    const published = publishForm(id)
    if (published) {
      setPublishStatus('published')
      // Push to server so shared form links work
      fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: published }),
      })
        .then(res => res.json())
        .then(data => {
          if (!data.success) console.warn('Server publish failed:', data.error)
        })
        .catch(err => console.warn('Server publish error:', err))
    }
  }, [formName, fields, saveForm])

  const buildCurrentForm = useCallback((): Form => {
    return {
      id: form?.id || savedFormId || "preview-form",
      name: formName,
      type: formType,
      targetRole: formTargetRole,
      assignedProjects: form?.assignedProjects || [],
      assignedRegions: form?.assignedRegions || [],
      fields,
      groups,
      repeatGroups,
      createdBy: form?.createdBy || "current-user",
      createdAt: form?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: formStatus,
      publishStatus,
      versions: form?.versions,
    }
  }, [form, savedFormId, formName, formType, formTargetRole, fields, groups, repeatGroups, formStatus, publishStatus])

  const handleExportXForm = useCallback(() => {
    const currentForm = buildCurrentForm()
    const xml = formToXForm(currentForm)
    const filename = `${formName.replace(/[^a-zA-Z0-9]/g, '_')}.xml`
    downloadAsFile(xml, filename, 'application/xml')
  }, [buildCurrentForm, formName])

  const handleExportXLSForm = useCallback(() => {
    const currentForm = buildCurrentForm()
    const sheets = formToXLSForm(currentForm)
    const csv = exportXLSFormAsCSV(sheets)
    const filename = `${formName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`
    downloadAsFile(csv, filename, 'text/csv')
  }, [buildCurrentForm, formName])

  // Preview
  if (showPreview && formName && fields.length > 0) {
    const previewForm: Form = {
      id: form?.id || "preview-form",
      name: formName,
      type: formType,
      targetRole: formTargetRole,
      assignedProjects: form?.assignedProjects || [],
      assignedRegions: form?.assignedRegions || [],
      fields,
      createdBy: form?.createdBy || "current-user",
      createdAt: form?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: formStatus,
    }
    return <FormPreview form={previewForm} onClose={() => setShowPreview(false)} />
  }

  const canSave = formName.trim().length > 0 && fields.length > 0
  const canPreview = canSave

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <OdkToolbar
        formName={formName}
        onFormNameChange={setFormName}
        formType={formType}
        onFormTypeChange={setFormType}
        formTargetRole={formTargetRole}
        onFormTargetRoleChange={setFormTargetRole}
        formStatus={formStatus}
        onFormStatusChange={setFormStatus}
        onAddField={addField}
        onAddGroup={addGroup}
        onAddRepeatGroup={addRepeatGroup}
        onPreview={() => setShowPreview(true)}
        onSave={handleSave}
        onClose={onClose}
        onUndo={undo}
        onRedo={redo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        canSave={canSave}
        canPreview={canPreview}
        isSaving={isSaving}
        isEditing={!!form}
        fieldCount={fields.length}
        onPublish={handlePublish}
        onExportXForm={handleExportXForm}
        onExportXLSForm={handleExportXLSForm}
        canPublish={canSave}
        publishStatus={publishStatus}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1 border-t">
        {/* Structure Tree */}
        <ResizablePanel defaultSize={18} minSize={12} maxSize={30} className="bg-muted/30">
          <OdkStructureTree
            fields={fields}
            groups={groups}
            repeatGroups={repeatGroups}
            selectedFieldId={selectedFieldId}
            onSelectField={selectField}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Question Canvas */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <OdkQuestionCanvas
            fields={fields}
            groups={groups}
            repeatGroups={repeatGroups}
            selectedFieldId={selectedFieldId}
            expandedCardIds={expandedCardIds}
            onSelectField={selectField}
            onToggleExpanded={toggleCardExpanded}
            onUpdateField={updateField}
            onRemoveField={removeField}
            onDuplicateField={duplicateField}
            onMoveField={moveField}
            onReorderFields={reorderFields}
            onAddField={addField}
            onRemoveGroup={removeGroup}
            onUpdateGroup={updateGroup}
            onRemoveRepeatGroup={removeRepeatGroup}
            onUpdateRepeatGroup={updateRepeatGroup}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Properties Panel */}
        <ResizablePanel defaultSize={32} minSize={20} maxSize={45} className="bg-muted/20">
          <OdkPropertiesPanel
            field={fields.find(f => f.id === selectedFieldId) || null}
            allFields={fields}
            groups={groups}
            repeatGroups={repeatGroups}
            onUpdateField={updateField}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
