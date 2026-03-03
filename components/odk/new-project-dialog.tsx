"use client"

import { useState } from "react"
import { odkStore } from "@/lib/odk-store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export default function NewProjectDialog({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    await odkStore.createProject(name.trim(), description.trim())
    setSaving(false)
    setName("")
    setDescription("")
    onOpenChange(false)
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="project-name">Name *</Label>
            <Input
              id="project-name"
              placeholder="e.g. Community Health Assessment 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-desc">Description</Label>
            <Textarea
              id="project-desc"
              placeholder="Optional project description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || saving}>
            {saving ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
