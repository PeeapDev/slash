"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"

export default function LabBatchEntry() {
  const [samples, setSamples] = useState([{ id: 1, sampleId: "", type: "urine", results: {} }])
  const [nextId, setNextId] = useState(2)
  const [submitted, setSubmitted] = useState(false)

  const urinalysisParams = ["Glucose", "Protein", "Ketones", "Nitrites", "Leukocytes"]
  const bloodParams = ["Hemoglobin", "Hematocrit", "RBC Count", "WBC Count", "Platelets"]

  const handleAddSample = () => {
    setSamples([...samples, { id: nextId, sampleId: "", type: "urine", results: {} }])
    setNextId(nextId + 1)
  }

  const handleRemoveSample = (id) => {
    if (samples.length > 1) {
      setSamples(samples.filter((s) => s.id !== id))
    }
  }

  const handleSampleChange = (id, field, value) => {
    setSamples(samples.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const handleResultChange = (id, param, value) => {
    setSamples(samples.map((s) => (s.id === id ? { ...s, results: { ...s.results, [param]: value } } : s)))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Batch Lab Results Entry</CardTitle>
          <CardDescription>Quickly enter results for multiple samples</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm text-green-700">Batch results saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Table-like Input for Multiple Samples */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Sample ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Glucose/Hgb</th>
                    <th className="px-4 py-3 text-left font-semibold">Protein/Hct</th>
                    <th className="px-4 py-3 text-left font-semibold">Ketones/RBC</th>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map((sample) => (
                    <tr key={sample.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Input
                          placeholder="S001"
                          value={sample.sampleId}
                          onChange={(e) => handleSampleChange(sample.id, "sampleId", e.target.value)}
                          className="w-full"
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={sample.type}
                          onChange={(e) => handleSampleChange(sample.id, "type", e.target.value)}
                          className="w-full p-1 border border-input rounded text-xs"
                        >
                          <option value="urine">Urine</option>
                          <option value="blood">Blood</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          placeholder={sample.type === "urine" ? "Glucose" : "Hemoglobin"}
                          value={sample.results[sample.type === "urine" ? "Glucose" : "Hemoglobin"] || ""}
                          onChange={(e) =>
                            handleResultChange(
                              sample.id,
                              sample.type === "urine" ? "Glucose" : "Hemoglobin",
                              e.target.value,
                            )
                          }
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          placeholder={sample.type === "urine" ? "Protein" : "Hematocrit"}
                          value={sample.results[sample.type === "urine" ? "Protein" : "Hematocrit"] || ""}
                          onChange={(e) =>
                            handleResultChange(
                              sample.id,
                              sample.type === "urine" ? "Protein" : "Hematocrit",
                              e.target.value,
                            )
                          }
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          placeholder={sample.type === "urine" ? "Ketones" : "RBC"}
                          value={sample.results[sample.type === "urine" ? "Ketones" : "RBC Count"] || ""}
                          onChange={(e) =>
                            handleResultChange(
                              sample.id,
                              sample.type === "urine" ? "Ketones" : "RBC Count",
                              e.target.value,
                            )
                          }
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSample(sample.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Sample Button */}
            <div className="flex justify-center">
              <Button type="button" variant="outline" onClick={handleAddSample} className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                Add Another Sample
              </Button>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Submit All Results
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
