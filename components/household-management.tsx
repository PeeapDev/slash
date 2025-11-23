"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, Eye } from "lucide-react"
import { getHouseholds, addHousehold, updateHousehold, deleteHousehold, getProjects } from "@/lib/admin-data-store"
import { SIERRA_LEONE_REGIONS, getDistrictsByRegion } from "@/lib/sierra-leone-regions"

export default function HouseholdManagement() {
  const [households, setHouseholds] = useState([])
  const [projects, setProjects] = useState([])
  const [regions, setRegions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingHousehold, setEditingHousehold] = useState(null)
  const [filterProject, setFilterProject] = useState("all")
  const [filterRegion, setFilterRegion] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [userRole, setUserRole] = useState("superadmin")

  useEffect(() => {
    setHouseholds(getHouseholds())
    setProjects(getProjects())
    setRegions(SIERRA_LEONE_REGIONS)
    const user = JSON.parse(localStorage.getItem("current_user") || '{"role":"superadmin"}')
    setUserRole(user.role)
  }, [])

  const handleAddHousehold = (formData) => {
    const newHousehold = {
      id: `HH-${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addHousehold(newHousehold)
    setHouseholds(getHouseholds())
    setShowForm(false)
  }

  const handleUpdateHousehold = (id, formData) => {
    updateHousehold(id, formData)
    setHouseholds(getHouseholds())
    setEditingHousehold(null)
  }

  const handleDeleteHousehold = (id) => {
    if (confirm("Are you sure you want to delete this household?")) {
      deleteHousehold(id)
      setHouseholds(getHouseholds())
    }
  }

  const filteredHouseholds = households.filter((h) => {
    const projectMatch = filterProject === "all" || h.projectId === filterProject
    const regionMatch = filterRegion === "all" || h.region === filterRegion
    const statusMatch = filterStatus === "all" || h.status === filterStatus
    return projectMatch && regionMatch && statusMatch
  })

  const canEdit = ["superadmin", "regional_head", "supervisor"].includes(userRole)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / Households</div>
          <h1 className="text-2xl font-bold mt-1">Household Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage survey households and participant data</p>
        </div>
        {canEdit && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            Add Household
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-sm font-medium block mb-2">Project</label>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Region</label>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="all">All Regions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Households Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-6 font-semibold">Household ID</th>
                <th className="text-left py-3 px-6 font-semibold">Head Name</th>
                <th className="text-left py-3 px-6 font-semibold">Region / District</th>
                <th className="text-center py-3 px-6 font-semibold">Participants</th>
                <th className="text-center py-3 px-6 font-semibold">Samples</th>
                <th className="text-left py-3 px-6 font-semibold">Status</th>
                <th className="text-left py-3 px-6 font-semibold">Project</th>
                <th className="text-center py-3 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHouseholds.length > 0 ? (
                filteredHouseholds.map((household) => (
                  <tr key={household.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-6 font-mono text-xs font-medium">{household.id}</td>
                    <td className="py-4 px-6 font-medium">{household.headName}</td>
                    <td className="py-4 px-6 text-sm">
                      {household.region} / {household.district}
                    </td>
                    <td className="py-4 px-6 text-center font-medium">{household.numParticipants}</td>
                    <td className="py-4 px-6 text-center text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        U: {household.numSamplesUrine} B: {household.numSamplesBlood}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          household.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {household.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      {projects.find((p) => p.id === household.projectId)?.name || household.projectId}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <>
                            <button
                              onClick={() => setEditingHousehold(household)}
                              className="p-1 hover:bg-muted rounded"
                              title="Edit household"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteHousehold(household.id)}
                              className="p-1 hover:bg-muted rounded"
                              title="Delete household"
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </button>
                          </>
                        )}
                        <button className="p-1 hover:bg-muted rounded" title="View details">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 px-6 text-center text-muted-foreground">
                    No households found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Household Form Modal */}
      {(showForm || editingHousehold) && (
        <HouseholdFormModal
          household={editingHousehold}
          projects={projects}
          regions={regions}
          onSave={(data) => {
            if (editingHousehold) {
              handleUpdateHousehold(editingHousehold.id, data)
            } else {
              handleAddHousehold(data)
            }
          }}
          onClose={() => {
            setShowForm(false)
            setEditingHousehold(null)
          }}
        />
      )}
    </div>
  )
}

function HouseholdFormModal({ household, projects, regions, onSave, onClose }) {
  const [formData, setFormData] = useState(
    household || {
      headName: "",
      region: "",
      district: "",
      address: "",
      gps: "",
      projectId: "",
      numParticipants: 0,
      numSamplesUrine: 0,
      numSamplesBlood: 0,
      status: "active",
      assignedCollector: "",
      supervisorId: "",
      notes: "",
    },
  )

  const districts = formData.region ? getDistrictsByRegion(formData.region) : []

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">{household ? "Edit Household" : "Add New Household"}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Head of Household Name</label>
              <input
                type="text"
                required
                value={formData.headName}
                onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Project</label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Region</label>
              <select
                required
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value, district: "" })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="">Select Region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">District</label>
              <select
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
                disabled={!formData.region}
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address / GPS Coordinates</label>
            <input
              type="text"
              placeholder="e.g., 12.345, -67.890"
              value={formData.gps}
              onChange={(e) => setFormData({ ...formData, gps: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Participants</label>
              <input
                type="number"
                min="0"
                value={formData.numParticipants}
                onChange={(e) => setFormData({ ...formData, numParticipants: Number.parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Urine Samples</label>
              <input
                type="number"
                min="0"
                value={formData.numSamplesUrine}
                onChange={(e) => setFormData({ ...formData, numSamplesUrine: Number.parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Blood Samples</label>
              <input
                type="number"
                min="0"
                value={formData.numSamplesBlood}
                onChange={(e) => setFormData({ ...formData, numSamplesBlood: Number.parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
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
            <Button type="submit">Save Household</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
