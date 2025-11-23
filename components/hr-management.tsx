"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Eye } from "lucide-react"
import { getStaff, addStaff, updateStaff, deleteStaff, getRoles } from "@/lib/admin-data-store"
import { generateId } from "@/lib/utils"
import { SIERRA_LEONE_REGIONS } from "@/lib/sierra-leone-regions"

export default function HRManagement() {
  const [staff, setStaff] = useState([])
  const [roles, setRoles] = useState([])
  const [regions, setRegions] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    region: "",
    employmentType: "full-time",
  })

  useEffect(() => {
    setStaff(getStaff())
    setRoles(getRoles())
    setRegions(SIERRA_LEONE_REGIONS)
  }, [])

  const handleAddStaff = () => {
    if (formData.name && formData.email && formData.role) {
      if (formData.role === "supervisor" && !formData.region) {
        alert("Supervisors must be assigned to a region")
        return
      }

      const newStaff = {
        id: generateId("STF"),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        region: formData.region || null,
        district: null,
        status: "active",
        employmentType: formData.employmentType,
        joinDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      }
      addStaff(newStaff)
      setStaff(getStaff())
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        region: "",
        employmentType: "full-time",
      })
      setShowForm(false)
    }
  }

  const handleDeleteStaff = (id) => {
    deleteStaff(id)
    setStaff(getStaff())
    setSelectedStaff(null)
  }

  const handleUpdateStatus = (id, status) => {
    updateStaff(id, { status })
    setStaff(getStaff())
    setSelectedStaff(getStaff().find((s) => s.id === id))
  }

  const supervisors = staff.filter((s) => s.role === "supervisor")
  const fieldCollectors = staff.filter((s) => s.role === "field_collector")
  const labTechs = staff.filter((s) => s.role === "lab_technician")
  const regionalHeads = staff.filter((s) => s.role === "regional_head")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / HR</div>
          <h1 className="text-2xl font-bold mt-1">HR & Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage staff, roles, and assignments</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add Staff Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Staff</div>
          <div className="text-2xl font-bold mt-1">{staff.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="text-2xl font-bold mt-1">{staff.filter((s) => s.status === "active").length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Supervisors</div>
          <div className="text-2xl font-bold mt-1">{supervisors.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Field Collectors</div>
          <div className="text-2xl font-bold mt-1">{fieldCollectors.length}</div>
        </Card>
      </div>

      {/* Add Staff Form */}
      {showForm && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="font-semibold mb-4">Add New Staff Member</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-white"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-white"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-white"
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value, region: "" })}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>

            {formData.role === "supervisor" && (
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="px-3 py-2 border rounded-lg bg-white border-red-300"
              >
                <option value="">Select Region (Required for Supervisors)</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="full-time">Full-time</option>
              <option value="contract">Contract</option>
              <option value="part-time">Part-time</option>
            </select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddStaff} className="bg-green-600 hover:bg-green-700">
              Add Staff
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  role: "",
                  region: "",
                  employmentType: "full-time",
                })
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Staff Table */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left py-3 px-6 font-semibold">Name</th>
              <th className="text-left py-3 px-6 font-semibold">Email</th>
              <th className="text-left py-3 px-6 font-semibold">Role</th>
              <th className="text-left py-3 px-6 font-semibold">Region</th>
              <th className="text-left py-3 px-6 font-semibold">Employment</th>
              <th className="text-center py-3 px-6 font-semibold">Status</th>
              <th className="text-center py-3 px-6 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-4 px-6 font-medium">{member.name}</td>
                <td className="py-4 px-6 text-muted-foreground text-xs">{member.email}</td>
                <td className="py-4 px-6">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {roles.find((r) => r.id === member.role)?.name || member.role}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm">
                  {member.region ? regions.find((r) => r.id === member.region)?.name : "-"}
                </td>
                <td className="py-4 px-6 text-sm capitalize">{member.employmentType}</td>
                <td className="py-4 px-6 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1 hover:bg-muted rounded" onClick={() => setSelectedStaff(member)}>
                      <Eye size={16} />
                    </button>
                    <button className="p-1 hover:bg-muted rounded" onClick={() => handleDeleteStaff(member.id)}>
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Staff Profile */}
      {selectedStaff && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Staff Profile: {selectedStaff.name}</h2>
            <Button variant="outline" onClick={() => setSelectedStaff(null)}>
              Close
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Email</label>
                <p className="font-medium">{selectedStaff.email}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Phone</label>
                <p className="font-medium">{selectedStaff.phone || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Role</label>
                <p className="font-medium">{roles.find((r) => r.id === selectedStaff.role)?.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Region</label>
                <p className="font-medium">
                  {selectedStaff.region ? regions.find((r) => r.id === selectedStaff.region)?.name : "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Employment Type</label>
                <p className="font-medium capitalize">{selectedStaff.employmentType}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Join Date</label>
                <p className="font-medium">{selectedStaff.joinDate}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Status</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedStaff.status === "active" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus(selectedStaff.id, "active")}
                  >
                    Active
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedStaff.status === "inactive" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus(selectedStaff.id, "inactive")}
                  >
                    Inactive
                  </Button>
                </div>
              </div>
              <div>
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  Reset Password
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
