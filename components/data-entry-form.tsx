"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { addHouseholdData, updateHouseholdData, getHouseholdData } from "@/lib/data-store"

export default function DataEntryForm({ collector, editingId, onClose }) {
  const [formData, setFormData] = useState({
    householdId: "",
    location: "",
    familySize: "",
    waterSource: "borehole",
    sanitationFacility: "flush_toilet",
    healthIssues: [],
    notes: "",
  })

  useEffect(() => {
    if (editingId) {
      const data = getHouseholdData()
      const existing = data.find((d) => d.id === editingId)
      if (existing) {
        setFormData({
          householdId: existing.householdId,
          location: existing.location,
          familySize: existing.familySize.toString(),
          waterSource: existing.waterSource,
          sanitationFacility: existing.sanitationFacility,
          healthIssues: existing.healthIssues,
          notes: existing.notes,
        })
      }
    }
  }, [editingId])

  const waterSources = ["borehole", "well", "tap_water", "surface_water", "rainwater"]
  const sanitationOptions = ["flush_toilet", "pit_latrine", "open_defecation", "other"]
  const healthIssueOptions = ["diarrhea", "malaria", "typhoid", "cholera", "malnutrition", "other"]

  const handleHealthIssueChange = (issue) => {
    setFormData((prev) => ({
      ...prev,
      healthIssues: prev.healthIssues.includes(issue)
        ? prev.healthIssues.filter((h) => h !== issue)
        : [...prev.healthIssues, issue],
    }))
  }

  const handleSubmit = (status) => {
    const newEntry = {
      id: editingId || `data_${Date.now()}`,
      householdId: formData.householdId,
      collectorName: collector.name,
      date: new Date().toISOString().split("T")[0],
      location: formData.location,
      familySize: Number.parseInt(formData.familySize) || 0,
      waterSource: formData.waterSource,
      sanitationFacility: formData.sanitationFacility,
      healthIssues: formData.healthIssues,
      notes: formData.notes,
      status,
    }

    if (editingId) {
      updateHouseholdData(editingId, newEntry)
    } else {
      addHouseholdData(newEntry)
    }

    onClose()
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingId ? "Edit" : "New"} Data Entry</h2>

      <form className="space-y-6">
        {/* Household ID */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Household ID</label>
          <input
            type="text"
            value={formData.householdId}
            onChange={(e) => setFormData({ ...formData, householdId: e.target.value })}
            placeholder="Enter household identifier"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Village, Region, GPS coordinates"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Family Size */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Family Size</label>
          <input
            type="number"
            value={formData.familySize}
            onChange={(e) => setFormData({ ...formData, familySize: e.target.value })}
            placeholder="Number of people"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Water Source */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Primary Water Source</label>
          <select
            value={formData.waterSource}
            onChange={(e) => setFormData({ ...formData, waterSource: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {waterSources.map((source) => (
              <option key={source} value={source}>
                {source.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Sanitation Facility */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Sanitation Facility</label>
          <select
            value={formData.sanitationFacility}
            onChange={(e) => setFormData({ ...formData, sanitationFacility: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {sanitationOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Health Issues */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Health Issues Reported</label>
          <div className="grid grid-cols-2 gap-3">
            {healthIssueOptions.map((issue) => (
              <label key={issue} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.healthIssues.includes(issue)}
                  onChange={() => handleHealthIssueChange(issue)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">{issue.replace(/_/g, " ").toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Additional Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional observations or concerns..."
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={() => handleSubmit("draft")} variant="outline" className="flex-1">
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit("submitted")} className="flex-1 bg-blue-600 hover:bg-blue-700">
            Submit for Review
          </Button>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
