"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { generateId } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export default function SampleCollectionForm() {
  const [sampleId] = useState(generateId("S"))
  const [formData, setFormData] = useState({
    participantId: "",
    sampleType: "urine",
    collectionTime: "",
    condition: "",
    collectorId: "COL001",
    notes: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Sample Collection Form</CardTitle>
          <CardDescription>Record sample collection details and generate Sample ID</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">Sample collected and recorded successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sample ID (Auto-generated)</label>
                <Input value={sampleId} disabled className="bg-slate-100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Participant ID</label>
                <Input
                  placeholder="Enter participant ID"
                  value={formData.participantId}
                  onChange={(e) => setFormData({ ...formData, participantId: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sample Type</label>
                <select
                  className="w-full p-2 border border-input rounded-lg"
                  value={formData.sampleType}
                  onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                >
                  <option value="urine">Urine</option>
                  <option value="blood">Blood</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Collection Time</label>
                <Input
                  type="time"
                  value={formData.collectionTime}
                  onChange={(e) => setFormData({ ...formData, collectionTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sample Condition</label>
              <select
                className="w-full p-2 border border-input rounded-lg"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              >
                <option value="">Select...</option>
                <option value="good">Good</option>
                <option value="acceptable">Acceptable</option>
                <option value="compromised">Compromised</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Collector ID</label>
              <Input
                value={formData.collectorId}
                onChange={(e) => setFormData({ ...formData, collectorId: e.target.value })}
                disabled
                className="bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                className="w-full p-3 border border-input rounded-lg"
                rows={3}
                placeholder="Any special notes about the sample..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Record Sample Collection
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
