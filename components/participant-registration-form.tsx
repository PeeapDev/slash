"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { generateId } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export default function ParticipantRegistrationForm() {
  const [participantId] = useState(generateId("PT"))
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    sex: "",
    relationship: "",
    consent: false,
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
          <CardTitle>Participant Registration</CardTitle>
          <CardDescription>Register a new participant in the study</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">Participant registered successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Participant ID (Auto-generated)</label>
              <Input value={participantId} disabled className="bg-slate-100" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                placeholder="Enter participant name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Age</label>
                <Input
                  type="number"
                  placeholder="Age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sex</label>
                <select
                  className="w-full p-2 border border-input rounded-lg"
                  value={formData.sex}
                  onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                  required
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Relationship to Household Head</label>
              <Input
                placeholder="e.g., Head, Spouse, Child, Other"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="consent"
                checked={formData.consent}
                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                className="w-4 h-4"
                required
              />
              <label htmlFor="consent" className="text-sm">
                I have obtained informed consent from the participant
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Register Participant
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
