"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Check } from "lucide-react"
// Removed admin-data-store - now using IndexedDB-first approach

export default function RoleManagement() {
  const [roles, setRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState(null)

  useEffect(() => {
    // TODO: Load roles from IndexedDB
    setRoles([])
  }, [])

  const permissionGroups = [
    { label: "Dashboard", key: "dashboard" },
    { label: "Regional Management", keys: ["view_regions", "edit_regions"] },
    { label: "District Management", keys: ["view_districts", "edit_districts"] },
    { label: "Staff Management", keys: ["view_staff", "edit_staff"] },
    { label: "Survey Data", keys: ["view_surveys", "edit_surveys"] },
    { label: "Sample Management", keys: ["view_samples", "edit_samples"] },
    { label: "Lab Results", keys: ["view_lab_results", "edit_lab_results"] },
    { label: "Analytics", key: "view_analytics" },
    { label: "Administration", keys: ["manage_roles", "manage_ai", "manage_sync", "view_logs"] },
  ]

  const handleDeleteRole = (roleId) => {
    if (roleId !== "superadmin" && roleId !== "field_collector" && roleId !== "lab_technician") {
      deleteRole(roleId)
      setRoles(getRoles())
      setSelectedRole(null)
    }
  }

  const handleTogglePermission = (roleId, permissionKey) => {
    const role = roles.find((r) => r.id === roleId)
    if (role) {
      const updatedRole = {
        ...role,
        permissions: {
          ...role.permissions,
          [permissionKey]: !role.permissions[permissionKey],
        },
      }
      updateRole(roleId, updatedRole)
      setRoles(getRoles())
      setSelectedRole(updatedRole)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / Settings</div>
          <h1 className="text-2xl font-bold mt-1">Role Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Define roles and permissions</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role List */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <div className="p-4 bg-muted border-b">
              <h2 className="font-semibold">Available Roles</h2>
            </div>
            <div className="divide-y">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                    selectedRole?.id === role.id ? "bg-primary/10 border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="font-medium">{role.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{role.description}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Role Details */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedRole.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
                </div>
                {!["superadmin", "field_collector", "lab_technician"].includes(selectedRole.id) && (
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteRole(selectedRole.id)}>
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Permissions</h3>
                {permissionGroups.map((group, idx) => {
                  const keys = group.keys || [group.key]
                  return (
                    <div key={idx} className="border border-border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{group.label}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {keys.map((key) => (
                          <button
                            key={key}
                            onClick={() => handleTogglePermission(selectedRole.id, key)}
                            className={`flex items-center gap-3 p-2 rounded border transition-colors ${
                              selectedRole.permissions[key]
                                ? "bg-green-50 border-green-300"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedRole.permissions[key] ? "bg-green-500 border-green-500" : "border-gray-300"
                              }`}
                            >
                              {selectedRole.permissions[key] && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-sm capitalize">{key.replace("_", " ")}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <strong>Note:</strong> Changes to role permissions are applied immediately to all users with this role.
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Select a role to view and manage permissions</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
