"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"
import {
  getParticipants,
  addParticipant,
  updateParticipant,
  deleteParticipant,
  getHouseholds,
} from "@/lib/admin-data-store"

export default function ParticipantManagement() {
  const [participants, setParticipants] = useState([])
  const [households, setHouseholds] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState(null)
  const [filterHousehold, setFilterHousehold] = useState("all")

  useEffect(() => {
    setParticipants(getParticipants())
    setHouseholds(getHouseholds())
  }, [])

  const handleAddParticipant = (formData) => {
    const newParticipant = {
      id: `PART-${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addParticipant(newParticipant)
    setParticipants(getParticipants())
    setShowForm(false)
  }

  const handleUpdateParticipant = (id, formData) => {
    updateParticipant(id, formData)
    setParticipants(getParticipants())
    setEditingParticipant(null)
  }

  const handleDeleteParticipant = (id) => {
    if (confirm("Are you sure you want to delete this participant?")) {
      deleteParticipant(id)
      setParticipants(getParticipants())
    }
  }

  const filteredParticipants = participants.filter((p) => {
    const householdMatch = filterHousehold === "all" || p.householdId === filterHousehold
    return householdMatch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / Participants</div>
          <h1 className="text-2xl font-bold mt-1">Participant Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage survey participants and consent tracking</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add Participant
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-sm font-medium block mb-2">Household</label>
          <select
            value={filterHousehold}
            onChange={(e) => setFilterHousehold(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="all">All Households</option>
            {households.map((h) => (
              <option key={h.id} value={h.id}>
                {h.id} - {h.headName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-6 font-semibold">Participant ID</th>
                <th className="text-left py-3 px-6 font-semibold">Name</th>
                <th className="text-left py-3 px-6 font-semibold">Age</th>
                <th className="text-left py-3 px-6 font-semibold">Sex</th>
                <th className="text-left py-3 px-6 font-semibold">Relationship</th>
                <th className="text-left py-3 px-6 font-semibold">Consent</th>
                <th className="text-left py-3 px-6 font-semibold">Household</th>
                <th className="text-center py-3 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((participant) => (
                  <tr key={participant.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-6 font-mono text-xs font-medium">{participant.id}</td>
                    <td className="py-4 px-6 font-medium">{participant.name}</td>
                    <td className="py-4 px-6">{participant.age}</td>
                    <td className="py-4 px-6 capitalize">{participant.sex}</td>
                    <td className="py-4 px-6">{participant.relationship}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          participant.consent ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {participant.consent ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">{participant.householdId}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingParticipant(participant)}
                          className="p-1 hover:bg-muted rounded"
                          title="Edit participant"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteParticipant(participant.id)}
                          className="p-1 hover:bg-muted rounded"
                          title="Delete participant"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 px-6 text-center text-muted-foreground">
                    No participants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Participant Form Modal */}
      {(showForm || editingParticipant) && (
        <ParticipantFormModal
          participant={editingParticipant}
          households={households}
          onSave={(data) => {
            if (editingParticipant) {
              handleUpdateParticipant(editingParticipant.id, data)
            } else {
              handleAddParticipant(data)
            }
          }}
          onClose={() => {
            setShowForm(false)
            setEditingParticipant(null)
          }}
        />
      )}
    </div>
  )
}

function ParticipantFormModal({ participant, households, onSave, onClose }) {
  const [formData, setFormData] = useState(
    participant || {
      householdId: "",
      name: "",
      age: 0,
      sex: "male",
      relationship: "",
      consent: true,
      projectId: "",
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
          <h2 className="text-xl font-semibold">{participant ? "Edit Participant" : "Add New Participant"}</h2>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Age</label>
              <input
                type="number"
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number.parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sex</label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Relationship to Head</label>
              <input
                type="text"
                placeholder="e.g., Child, Spouse, Parent"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="consent"
              checked={formData.consent}
              onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
              className="w-4 h-4 border border-border rounded"
            />
            <label htmlFor="consent" className="text-sm font-medium">
              Participant consent obtained
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Participant</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
