"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { addLabAnalysis, updateHouseholdData, getHouseholdData } from "@/lib/data-store"

const ANALYSIS_TYPES = ["water_quality", "pathogen_detection", "nutrient_analysis", "contamination_screening"]

export default function LabAnalysisForm({ entryId, technician, onClose }) {
  const [analysisType, setAnalysisType] = useState("water_quality")
  const [results, setResults] = useState({})
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("completed")

  const householdData = getHouseholdData()
  const entry = householdData.find((d) => d.id === entryId)

  if (!entry) return null

  const analysisFields = {
    water_quality: [
      { key: "ph_level", label: "pH Level" },
      { key: "turbidity", label: "Turbidity (NTU)" },
      { key: "bacterial_count", label: "Bacterial Count (CFU/mL)" },
      { key: "chemical_contaminants", label: "Chemical Contaminants" },
    ],
    pathogen_detection: [
      { key: "e_coli", label: "E. Coli" },
      { key: "salmonella", label: "Salmonella" },
      { key: "cholera", label: "Cholera" },
      { key: "malaria_parasites", label: "Malaria Parasites" },
    ],
    nutrient_analysis: [
      { key: "nitrogen", label: "Nitrogen (ppm)" },
      { key: "phosphorus", label: "Phosphorus (ppm)" },
      { key: "potassium", label: "Potassium (ppm)" },
    ],
    contamination_screening: [
      { key: "heavy_metals", label: "Heavy Metals Detected" },
      { key: "pesticides", label: "Pesticides Detected" },
      { key: "industrial_waste", label: "Industrial Waste Present" },
    ],
  }

  const handleFieldChange = (key, value) => {
    setResults((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    const analysis = {
      id: `lab_${Date.now()}`,
      dataSampleId: entryId,
      analysisType,
      results,
      technician: technician.name,
      date: new Date().toISOString().split("T")[0],
      notes,
      status,
    }

    addLabAnalysis(analysis)
    updateHouseholdData(entryId, { status: "reviewed" })
    onClose()
  }

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Lab Analysis</h2>
        <p className="text-slate-600">
          HH-{entry.householdId} from {entry.location}
        </p>
      </div>

      <form className="space-y-6">
        {/* Analysis Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Analysis Type</label>
          <select
            value={analysisType}
            onChange={(e) => {
              setAnalysisType(e.target.value)
              setResults({})
            }}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {ANALYSIS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Analysis Fields */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-semibold text-slate-900 mb-4">Test Results</h3>
          <div className="grid grid-cols-2 gap-4">
            {analysisFields[analysisType].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                <input
                  type="text"
                  value={results[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder="Enter result"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Analysis Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="completed">Completed - Normal</option>
            <option value="flagged">Flagged - Requires Attention</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Technical Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any observations or recommendations..."
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700">
            Submit Analysis
          </Button>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
