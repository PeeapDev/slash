"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function QuestionnaireForm() {
  const [activeTab, setActiveTab] = useState("household")
  const [formData, setFormData] = useState({
    householdSize: "",
    waterSource: "",
    sanitationFacility: "",
    recentIllness: false,
    illnessType: "",
    medicationUse: false,
    otherIssues: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
  }

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Structured Questionnaire</CardTitle>
          <CardDescription>Multi-section questionnaire with skip logic support</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="household">Household</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="household" className="space-y-4">
                <h3 className="font-semibold mt-4 mb-3">Household Information</h3>

                <div>
                  <label className="block text-sm font-medium mb-2">Household Size</label>
                  <input
                    type="number"
                    className="w-full p-2 border border-input rounded-lg"
                    placeholder="Number of people"
                    value={formData.householdSize}
                    onChange={(e) => setFormData({ ...formData, householdSize: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Primary Water Source</label>
                  <select
                    className="w-full p-2 border border-input rounded-lg"
                    value={formData.waterSource}
                    onChange={(e) => setFormData({ ...formData, waterSource: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="piped">Piped water</option>
                    <option value="borehole">Borehole</option>
                    <option value="well">Well</option>
                    <option value="surface">Surface water</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sanitation Facility</label>
                  <select
                    className="w-full p-2 border border-input rounded-lg"
                    value={formData.sanitationFacility}
                    onChange={(e) => setFormData({ ...formData, sanitationFacility: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="flush">Flush toilet</option>
                    <option value="pit">Pit latrine</option>
                    <option value="bucket">Bucket system</option>
                    <option value="none">No facility</option>
                  </select>
                </div>
              </TabsContent>

              <TabsContent value="health" className="space-y-4">
                <h3 className="font-semibold mt-4 mb-3">Health Information</h3>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="illness"
                    checked={formData.recentIllness}
                    onChange={(e) => setFormData({ ...formData, recentIllness: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="illness" className="text-sm">
                    Has household member had recent illness?
                  </label>
                </div>

                {formData.recentIllness && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Type of Illness</label>
                    <textarea
                      className="w-full p-2 border border-input rounded-lg"
                      placeholder="Describe the illness..."
                      value={formData.illnessType}
                      onChange={(e) => setFormData({ ...formData, illnessType: e.target.value })}
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="medication"
                    checked={formData.medicationUse}
                    onChange={(e) => setFormData({ ...formData, medicationUse: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="medication" className="text-sm">
                    Currently taking medication?
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="additional" className="space-y-4">
                <h3 className="font-semibold mt-4 mb-3">Additional Information</h3>

                <div>
                  <label className="block text-sm font-medium mb-2">Other Issues or Comments</label>
                  <textarea
                    className="w-full p-2 border border-input rounded-lg"
                    placeholder="Any other relevant information..."
                    value={formData.otherIssues}
                    onChange={(e) => setFormData({ ...formData, otherIssues: e.target.value })}
                    rows={4}
                  />
                </div>
              </TabsContent>

              <div className="mt-6 flex gap-3">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Submit Questionnaire
                </Button>
                <Button type="button" variant="outline">
                  Save as Draft
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
