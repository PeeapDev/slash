"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Check } from "lucide-react"

interface Role {
  id: string
  name: string
  description: string
  permissions: Record<string, boolean>
}

const permissionGroups = [
  { label: "Dashboard", keys: ["dashboard"] },
  { label: "Regional Management", keys: ["view_regions", "edit_regions"] },
  { label: "District Management", keys: ["view_districts", "edit_districts"] },
  { label: "Staff Management", keys: ["view_staff", "edit_staff"] },
  { label: "Survey Data", keys: ["view_surveys", "edit_surveys"] },
  { label: "Sample Management", keys: ["view_samples", "edit_samples"] },
  { label: "Lab Results", keys: ["view_lab_results", "edit_lab_results"] },
  { label: "Analytics", keys: ["view_analytics"] },
  { label: "Administration", keys: ["manage_roles", "manage_ai", "manage_sync", "view_logs"] },
]

const defaultRoles: Role[] = [
  {
    id: "superadmin",
    name: "Super Admin",
    description: "Full system access",
    permissions: {
      dashboard: true, view_regions: true, edit_regions: true,
      view_districts: true, edit_districts: true, view_staff: true,
      edit_staff: true, view_surveys: true, edit_surveys: true,
      view_samples: true, edit_samples: true, view_lab_results: true,
      edit_lab_results: true, view_analytics: true, manage_roles: true,
      manage_ai: true, manage_sync: true, view_logs: true,
    },
  },
  {
    id: "field_collector",
    name: "Field Collector",
    description: "Data collection in the field",
    permissions: {
      dashboard: true, view_regions: true, edit_regions: false,
      view_districts: true, edit_districts: false, view_staff: false,
      edit_staff: false, view_surveys: true, edit_surveys: true,
      view_samples: true, edit_samples: true, view_lab_results: false,
      edit_lab_results: false, view_analytics: false, manage_roles: false,
      manage_ai: false, manage_sync: false, view_logs: false,
    },
  },
]

const PROTECTED = ["superadmin", "field_collector", "lab_technician"]

export default function RolesPermissions() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  useEffect(() => {
    setRoles(defaultRoles)
    setSelectedRole(defaultRoles[0])
  }, [])

  const togglePermission = (roleId: string, key: string) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId
          ? { ...r, permissions: { ...r.permissions, [key]: !r.permissions[key] } }
          : r
      )
    )
    if (selectedRole?.id === roleId) {
      setSelectedRole((prev) =>
        prev ? { ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } } : prev
      )
    }
  }

  const deleteRole = (roleId: string) => {
    if (PROTECTED.includes(roleId)) return
    setRoles((prev) => prev.filter((r) => r.id !== roleId))
    if (selectedRole?.id === roleId) setSelectedRole(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Roles & Permissions</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage user roles and their access levels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Role list */}
        <Card className="overflow-hidden lg:col-span-1">
          <div className="p-3 bg-muted border-b">
            <h3 className="font-semibold text-sm">Roles</h3>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left p-3 hover:bg-muted transition-colors ${
                  selectedRole?.id === role.id ? "bg-primary/10 border-l-2 border-primary" : ""
                }`}
              >
                <div className="font-medium text-sm">{role.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{role.description}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Permissions */}
        <Card className="p-5 lg:col-span-2">
          {selectedRole ? (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold">{selectedRole.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
                </div>
                {!PROTECTED.includes(selectedRole.id) && (
                  <Button variant="destructive" size="sm" onClick={() => deleteRole(selectedRole.id)}>
                    <Trash2 size={14} className="mr-1" /> Delete
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {permissionGroups.map((group, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-2">{group.label}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.keys.map((key) => (
                        <button
                          key={key}
                          onClick={() => togglePermission(selectedRole.id, key)}
                          className={`flex items-center gap-2 p-2 rounded border text-sm transition-colors ${
                            selectedRole.permissions[key]
                              ? "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-800"
                              : "bg-muted/30 border-border hover:bg-muted"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                              selectedRole.permissions[key]
                                ? "bg-green-500 border-green-500"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {selectedRole.permissions[key] && <Check size={12} className="text-white" />}
                          </div>
                          <span className="capitalize">{key.replace(/_/g, " ")}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> Permission changes are applied immediately to all users with this role.
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Select a role to view and manage permissions
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
