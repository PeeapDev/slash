"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"
import {
  getSamples,
  addSample,
  updateSample,
  deleteSample,
  getHouseholds,
  getParticipants,
} from "@/lib/admin-data-store"

export default function SampleManagement() {
  const [samples, setSamples] = useState([])
  const [households, setHouseholds] = useState([])
  const [participants, setParticipants] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingSample, setEditingSample] = useState(null)
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    setSamples(getSamples())
    setHouseholds(getHouseholds())
    setParticipants(getParticipants())
  }, [])

  const handleAddSample = (formData) => {
    const newSample = {
      id: `SAM-${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addSample(newSample)
    setSamples(getSamples())
    setShowForm(false)
  }

  const handleUpdateSample = (id, formData) => {
    updateSample(id, formData)
    setSamples(getSamples())
    setEditingSample(null)
  }

  const handleDeleteSample = (id) => {
    if (confirm("Are you sure you want to delete this sample?")) {
      deleteSample(id)
      setSamples(getSamples())
    }
  }

  const filteredSamples = samples.filter((s) => {
    const typeMatch = filterType === "all" || s.type === filterType
    const statusMatch = filterStatus === "all" || s.collectionStatus === filterStatus
    return typeMatch && statusMatch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / Samples</div>
          <h1 className="text-2xl font-bold mt-1">Sample Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage biological samples</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add Sample
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-sm font-medium block mb-2">Sample Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="urine">Urine</option>
            <option value="blood">Blood</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="not_collected">Not Collected</option>
            <option value="collected">Collected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Samples Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-6 font-semibold">Sample ID</th>
                <th className="text-left py-3 px-6 font-semibold">Household</th>
                <th className="text-left py-3 px-6 font-semibold">Participant</th>
                <th className="text-left py-3 px-6 font-semibold">Type</th>
                <th className="text-left py-3 px-6 font-semibold">Collection Status</th>
                <th className="text-left py-3 px-6 font-semibold">Collection Date</th>
                <th className="text-left py-3 px-6 font-semibold">Collector</th>
                <th className="text-center py-3 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSamples.length > 0 ? (
                filteredSamples.map((sample) => (
                  <tr key={sample.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-6 font-mono text-xs font-medium">{sample.id}</td>
                    <td className="py-4 px-6 text-xs">{sample.householdId}</td>
                    <td className="py-4 px-6 text-xs">{sample.participantId}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          sample.type === "urine" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sample.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          sample.collectionStatus === "completed"
                            ? "bg-green-100 text-green-800"
                            : sample.collectionStatus === "collected"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {sample.collectionStatus.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      {sample.collectionDate ? new Date(sample.collectionDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-4 px-6 text-xs">{sample.collectorId}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingSample(sample)}
                          className="p-1 hover:bg-muted rounded"
                          title="Edit sample"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSample(sample.id)}
                          className="p-1 hover:bg-muted rounded"
                          title="Delete sample"
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
                    No samples found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sample Form Modal */}
      {(showForm || editingSample) && (
        <SampleFormModal
          sample={editingSample}
          households={households}
          participants={participants}
          onSave={(data) => {
            if (editingSample) {
              handleUpdateSample(editingSample.id, data)
            } else {
              handleAddSample(data)
            }
          }}
          onClose={() => {
            setShowForm(false)
            setEditingSample(null)
          }}
        />
      )}
    </div>
  )
}

function SampleFormModal({ sample, households, participants, onSave, onClose }) {
  const [formData, setFormData] = useState(
    sample || {
      householdId: "",
      participantId: "",
      projectId: "",
      type: "urine",
      collectionStatus: "not_collected",
      collectionDate: "",
      collectorId: "",
      notes: "",
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
          <h2 className="text-xl font-semibold">{sample ? "Edit Sample" : "Add New Sample"}</h2>

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
              <label className="block text-sm font-medium mb-2">Sample Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="urine">Urine</option>
                <option value="blood">Blood</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Collection Status</label>
              <select
                value={formData.collectionStatus}
                onChange={(e) => setFormData({ ...formData, collectionStatus: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="not_collected">Not Collected</option>
                <option value="collected">Collected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Collection Date</label>
            <input
              type="date"
              value={formData.collectionDate}
              onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg h-20 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Sample</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
