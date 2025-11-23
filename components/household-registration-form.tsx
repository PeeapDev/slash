"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { addHouseholdData } from "@/lib/data-store"
import { generateId } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import { SIERRA_LEONE_REGIONS, getDistrictsByRegion } from "@/lib/sierra-leone-regions"

export default function HouseholdRegistrationForm() {
  const [householdId] = useState(generateId("HH"))
  const [formData, setFormData] = useState({
    region: "",
    district: "",
    community: "",
    gps: "",
    notes: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const districts = formData.region ? getDistrictsByRegion(formData.region) : []

  const handleSubmit = (e) => {
    e.preventDefault()
    addHouseholdData({
      id: generateId("HD"),
      householdId,
      collectorName: "Current User",
      date: new Date().toISOString().split("T")[0],
      location: formData.community,
      familySize: 0,
      waterSource: "",
      sanitationFacility: "",
      healthIssues: [],
      notes: formData.notes,
      status: "draft",
    })
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Household Registration</CardTitle>
          <CardDescription>Register a new household for data collection</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">Household registered successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Household ID (Auto-generated)</label>
              <Input value={householdId} disabled className="bg-slate-100" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Region</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value, district: "" })}
                required
                className="w-full px-3 py-2 border border-input rounded-lg"
              >
                <option value="">Select Region</option>
                {SIERRA_LEONE_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.region && (
              <div>
                <label className="block text-sm font-medium mb-2">District</label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg"
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Community</label>
              <Input
                placeholder="Enter community name"
                value={formData.community}
                onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">GPS Coordinates (Optional)</label>
              <Input
                placeholder="e.g., -1.2345, 36.7890"
                value={formData.gps}
                onChange={(e) => setFormData({ ...formData, gps: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                className="w-full p-3 border border-input rounded-lg"
                rows={4}
                placeholder="Any additional notes about the household..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Register Household
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
