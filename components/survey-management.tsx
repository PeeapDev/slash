"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"
// Removed admin-data-store - now using IndexedDB-first approach

export default function SurveyManagement() {
  const [surveys, setSurveys] = useState([])
  const [households, setHouseholds] = useState([])
  const [participants, setParticipants] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingSurvey, setEditingSurvey] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    // TODO: Load surveys, households, and participants from IndexedDB
    setSurveys([])
    setHouseholds([])
    setParticipants([])
  }, [])

  const handleAddSurvey = (formData) => {
    const newSurvey = {
      id: `SUR-${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addSurvey(newSurvey)
    setSurveys(getSurveys())
    setShowForm(false)
  }

  const handleUpdateSurvey = (id, formData) => {
    updateSurvey(id, formData)
    setSurveys(getSurveys())
    setEditingSurvey(null)
  }

  const handleDeleteSurvey = (id) => {
    if (confirm("Are you sure you want to delete this survey?")) {
      deleteSurvey(id)
      setSurveys(getSurveys())
    }
  }

  const filteredSurveys = surveys.filter((s) => {
    const statusMatch = filterStatus === "all" || s.status === filterStatus
    return statusMatch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / Surveys</div>
          <h1 className="text-2xl font-bold mt-1">Survey Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage survey completions</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add Survey
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-sm font-medium block mb-2">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Surveys Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-6 font-semibold">Survey ID</th>
                <th className="text-left py-3 px-6 font-semibold">Household</th>
                <th className="text-left py-3 px-6 font-semibold">Participant</th>
                <th className="text-left py-3 px-6 font-semibold">Status</th>
                <th className="text-left py-3 px-6 font-semibold">Collector</th>
                <th className="text-left py-3 px-6 font-semibold">Completed Date</th>
                <th className="text-center py-3 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSurveys.length > 0 ? (
                filteredSurveys.map((survey) => (
                  <tr key={survey.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-6 font-mono text-xs font-medium">{survey.id}</td>
                    <td className="py-4 px-6 text-xs">{survey.householdId}</td>
                    <td className="py-4 px-6 text-xs">{survey.participantId}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          survey.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : survey.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {survey.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">{survey.collectorId}</td>
                    <td className="py-4 px-6 text-xs">
                      {survey.completedDate ? new Date(survey.completedDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingSurvey(survey)}
                          className="p-1 hover:bg-muted rounded"
                          title="Edit survey"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSurvey(survey.id)}
                          className="p-1 hover:bg-muted rounded"
                          title="Delete survey"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 px-6 text-center text-muted-foreground">
                    No surveys found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Survey Form Modal */}
      {(showForm || editingSurvey) && (
        <SurveyFormModal
          survey={editingSurvey}
          households={households}
          participants={participants}
          onSave={(data) => {
            if (editingSurvey) {
              handleUpdateSurvey(editingSurvey.id, data)
            } else {
              handleAddSurvey(data)
            }
          }}
          onClose={() => {
            setShowForm(false)
            setEditingSurvey(null)
          }}
        />
      )}
    </div>
  )
}

function SurveyFormModal({ survey, households, participants, onSave, onClose }) {
  const [formData, setFormData] = useState(
    survey || {
      householdId: "",
      participantId: "",
      projectId: "",
      status: "not_started",
      collectorId: "",
      completedDate: "",
      data: {},
    },
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">{survey ? "Edit Survey" : "Add New Survey"}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Household</label>
              <select
                required
                value={formData.householdId}
                onChange={(e) => setFormData({ ...formData, householdId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="">Select Household</option>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.id} - {h.headName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Participant</label>
              <select
                required
                value={formData.participantId}
                onChange={(e) => setFormData({ ...formData, participantId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="">Select Participant</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Completed Date</label>
              <input
                type="date"
                value={formData.completedDate}
                onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Survey</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
