"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

export default function LabResultsEntryForm() {
  const [sampleId, setSampleId] = useState("")
  const [sampleType, setSampleType] = useState("")
  const [results, setResults] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState("draft")

  const urinalysisParams = ["Glucose", "Protein", "Ketones", "Nitrites", "Leukocytes", "RBC", "WBC"]
  const bloodParams = ["Hemoglobin", "Hematocrit", "RBC Count", "WBC Count", "Platelets"]

  const currentParams = sampleType === "urine" ? urinalysisParams : bloodParams

  const handleParamChange = (param, value) => {
    setResults({ ...results, [param]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Lab Results Entry</CardTitle>
          <CardDescription>Enter test results for urine or blood samples</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">Results saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sample Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sample ID</label>
                <Input
                  placeholder="Enter Sample ID"
                  value={sampleId}
                  onChange={(e) => setSampleId(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sample Type</label>
                <select
                  className="w-full p-2 border border-input rounded-lg"
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  required
                >
                  <option value="">Select...</option>
                  <option value="urine">Urinalysis</option>
                  <option value="blood">Blood Assays</option>
                </select>
              </div>
            </div>

            {/* Test Parameters */}
            {sampleType && (
              <div className="space-y-3">
                <h3 className="font-semibold">
                  {sampleType === "urine" ? "Urinalysis Parameters" : "Blood Assay Results"}
                </h3>
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                  {currentParams.map((param) => (
                    <div key={param} className="grid grid-cols-2 gap-4">
                      <label className="text-sm font-medium pt-2">{param}</label>
                      <Input
                        placeholder="Enter value"
                        value={results[param] || ""}
                        onChange={(e) => handleParamChange(param, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes / Observations</label>
              <textarea
                className="w-full p-3 border border-input rounded-lg"
                rows={4}
                placeholder="Any additional notes or observations..."
              />
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  className="p-2 border border-input rounded-lg"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="completed">Mark as Completed</option>
                  <option value="flagged">Flag for Review</option>
                </select>
              </div>
              <div className="mt-6">
                <Badge
                  className={status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Save Results
              </Button>
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
