"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"

export default function RBACManagement() {
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: "SuperAdmin",
      permissions: {
        view: ["all_regions", "all_data", "staff_profiles", "audit_logs"],
        edit: ["all_data", "staff_roles", "system_config"],
        approve: ["supervisor_accounts", "lab_results"],
        sync: ["all_regions"],
      },
    },
    {
      id: 2,
      name: "Regional Head",
      permissions: {
        view: ["region_data", "district_data", "supervisor_reports"],
        edit: ["region_config", "district_assignments"],
        approve: ["supervisor_accounts"],
        sync: ["own_region"],
      },
    },
    {
      id: 3,
      name: "Supervisor",
      permissions: {
        view: ["field_data", "lab_results", "enumerator_performance"],
        edit: ["field_data", "survey_forms"],
        approve: [],
        sync: ["assigned_area"],
      },
    },
    {
      id: 4,
      name: "Enumerator",
      permissions: {
        view: ["own_surveys", "own_samples"],
        edit: ["own_surveys", "own_samples"],
        approve: [],
        sync: ["own_data"],
      },
    },
    {
      id: 5,
      name: "Lab Technician",
      permissions: {
        view: ["all_samples", "lab_results"],
        edit: ["lab_results"],
        approve: [],
        sync: ["lab_data"],
      },
    },
    {
      id: 6,
      name: "AI System",
      permissions: {
        view: ["all_data"],
        edit: [],
        approve: ["data_flags", "audit_items"],
        sync: [],
      },
    },
  ])

  const [activeTab, setActiveTab] = useState("matrix")
  const [selectedRole, setSelectedRole] = useState(roles[0])

  const permissionCategories = ["view", "edit", "approve", "sync"]
  const availablePermissions = {
    view: [
      "all_regions",
      "all_data",
      "field_data",
      "lab_results",
      "staff_profiles",
      "audit_logs",
      "region_data",
      "own_surveys",
    ],
    edit: ["all_data", "staff_roles", "system_config", "field_data", "survey_forms", "lab_results"],
    approve: ["supervisor_accounts", "lab_results", "data_flags", "audit_items"],
    sync: ["all_regions", "own_region", "assigned_area", "own_data", "lab_data"],
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / RBAC Management</div>
          <h1 className="text-2xl font-bold mt-1">Role-Based Access Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage roles and permissions</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          Create Role
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === "matrix" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          Permission Matrix
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === "roles" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          Manage Roles
        </button>
      </div>

      {/* Permission Matrix Tab */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          <Card className="overflow-x-auto p-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-2 px-4 font-semibold">Role / Permission</th>
                  {permissionCategories.map((cat) => (
                    <th key={cat} className="text-center py-2 px-4 font-semibold capitalize">
                      {cat}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{role.name}</td>
                    {permissionCategories.map((cat) => (
                      <td key={cat} className="text-center py-3 px-4">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {role.permissions[cat]?.length > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                              {role.permissions[cat].length}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Edit Permissions for: {selectedRole.name}</h3>
            <div className="space-y-4">
              {permissionCategories.map((cat) => (
                <div key={cat}>
                  <label className="block text-sm font-medium mb-2 capitalize">{cat} Permissions</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availablePermissions[cat]?.map((perm) => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRole.permissions[cat]?.includes(perm) || false}
                          onChange={() => {}}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-6">Save Changes</Button>
          </Card>
        </div>
      )}

      {/* Manage Roles Tab */}
      {activeTab === "roles" && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-6 font-semibold">Role Name</th>
                <th className="text-center py-3 px-6 font-semibold">Permissions</th>
                <th className="text-center py-3 px-6 font-semibold">Users Assigned</th>
                <th className="text-center py-3 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => {
                const totalPerms = Object.values(role.permissions).flat().length
                return (
                  <tr key={role.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-6 font-medium">{role.name}</td>
                    <td className="py-4 px-6 text-center">{totalPerms}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                        {Math.floor(Math.random() * 20)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1 hover:bg-muted rounded" onClick={() => setSelectedRole(role)}>
                          <Edit2 size={16} />
                        </button>
                        {role.id > 3 && (
                          <button className="p-1 hover:bg-muted rounded">
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
