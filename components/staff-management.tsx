"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, Eye } from "lucide-react"

export default function StaffManagement() {
  const [staffMembers, setStaffMembers] = useState([
    {
      id: 1,
      name: "Ahmed Hassan",
      email: "ahmed@slash.org",
      role: "Regional Head",
      region: "Northern",
      status: "active",
      joinDate: "2023-01-15",
      employment: "Full-time",
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria@slash.org",
      role: "Supervisor",
      region: "Southern",
      status: "active",
      joinDate: "2023-03-10",
      employment: "Full-time",
    },
    {
      id: 3,
      name: "Grace Okoye",
      email: "grace@slash.org",
      role: "Enumerator",
      region: "Eastern",
      status: "active",
      joinDate: "2023-06-20",
      employment: "Contract",
    },
    {
      id: 4,
      name: "John Mwangi",
      email: "john@slash.org",
      role: "Lab Technician",
      region: "Western",
      status: "active",
      joinDate: "2023-02-05",
      employment: "Full-time",
    },
    {
      id: 5,
      name: "Fatima Ahmed",
      email: "fatima@slash.org",
      role: "Enumerator",
      region: "Northern",
      status: "inactive",
      joinDate: "2022-11-12",
      employment: "Contract",
    },
  ])

  const [selectedStaff, setSelectedStaff] = useState(null)

  const roleOptions = ["National Admin", "Regional Head", "Supervisor", "Enumerator", "Lab Technician"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / HR & Staff Management</div>
          <h1 className="text-2xl font-bold mt-1">Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage staff, roles, and assignments</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          Add Staff Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Staff</div>
          <div className="text-2xl font-bold mt-1">{staffMembers.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="text-2xl font-bold mt-1">{staffMembers.filter((s) => s.status === "active").length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Full-time</div>
          <div className="text-2xl font-bold mt-1">
            {staffMembers.filter((s) => s.employment === "Full-time").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Contract</div>
          <div className="text-2xl font-bold mt-1">
            {staffMembers.filter((s) => s.employment === "Contract").length}
          </div>
        </Card>
      </div>

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
            {staffMembers.map((staff) => (
              <tr key={staff.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-4 px-6 font-medium">{staff.name}</td>
                <td className="py-4 px-6 text-muted-foreground text-xs">{staff.email}</td>
                <td className="py-4 px-6">{staff.role}</td>
                <td className="py-4 px-6 text-muted-foreground">{staff.region}</td>
                <td className="py-4 px-6 text-sm">{staff.employment}</td>
                <td className="py-4 px-6 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      staff.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {staff.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1 hover:bg-muted rounded" onClick={() => setSelectedStaff(staff)}>
                      <Eye size={16} />
                    </button>
                    <button className="p-1 hover:bg-muted rounded">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-1 hover:bg-muted rounded">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {selectedStaff && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Staff Profile: {selectedStaff.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Email</label>
                <p className="font-medium">{selectedStaff.email}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Role</label>
                <p className="font-medium">{selectedStaff.role}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Region Assignment</label>
                <p className="font-medium">{selectedStaff.region}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Employment Type</label>
                <p className="font-medium">{selectedStaff.employment}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Join Date</label>
                <p className="font-medium">{selectedStaff.joinDate}</p>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline">Reset Password</Button>
                <Button variant="outline">Deactivate Account</Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
