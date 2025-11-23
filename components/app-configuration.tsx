"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Check } from "lucide-react"
import { getRoles, updateRole, deleteRole } from "@/lib/admin-data-store"
import AICredentials from "@/components/ai-credentials"
import AISettings from "@/components/ai-settings"
import SystemLogs from "@/components/system-logs"
import DatabaseSetup from "@/components/database-setup"
import DualDatabaseDemo from "@/components/dual-database-demo"
import PWAStatus from "@/components/pwa-status"

// Type definitions for roles
interface Role {
  id: string
  name: string
  description: string
  permissions: Record<string, boolean>
}

export default function AppConfiguration() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [activeTab, setActiveTab] = useState("roles")

  useEffect(() => {
    const loadedRoles = getRoles()
    setRoles(loadedRoles)
    if (loadedRoles.length > 0) {
      setSelectedRole(loadedRoles[0])
    }
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

  const handleTogglePermission = (roleId: string, permissionKey: string) => {
    const role = roles.find((r) => r.id === roleId)
    if (role) {
      const updatedRole: Role = {
        ...role,
        permissions: {
          ...role.permissions,
          [permissionKey]: !role.permissions[permissionKey],
        },
      }
      updateRole(roleId, updatedRole as any)
      setRoles(getRoles())
      setSelectedRole(updatedRole)
    }
  }

  const handleDeleteRole = (roleId: string) => {
    if (!["superadmin", "field_collector", "lab_technician"].includes(roleId)) {
      deleteRole(roleId)
      setRoles(getRoles())
      setSelectedRole(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">Admin / Configuration</div>
        <h1 className="text-2xl font-bold mt-1">System Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure roles, permissions, and system settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 border-b-2 transition-colors font-medium ${
            activeTab === "roles" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          Roles & Permissions
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2 border-b-2 transition-colors font-medium ${
            activeTab === "system" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          System Settings
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`px-4 py-2 border-b-2 transition-colors font-medium ${
            activeTab === "ai" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          AI Integration
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 border-b-2 transition-colors font-medium ${
            activeTab === "logs" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          System Logs
        </button>
        <button
          onClick={() => setActiveTab("database")}
          className={`px-4 py-2 border-b-2 transition-colors font-medium ${
            activeTab === "database" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          Database
        </button>
        <button
          onClick={() => setActiveTab("pwa")}
          className={`px-4 py-2 border-b-2 transition-colors font-medium ${
            activeTab === "pwa" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
          }`}
        >
          PWA Status
        </button>
      </div>

      {/* Roles & Permissions Tab */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role List */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <div className="p-4 bg-muted border-b">
                <h2 className="font-semibold">Available Roles</h2>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                      selectedRole?.id === role.id ? "bg-primary/10 border-l-4 border-primary" : ""
                    }`}
                  >
                    <div className="font-medium text-sm">{role.name}</div>
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
                  <strong>Note:</strong> Changes to role permissions are applied immediately to all users with this
                  role.
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Select a role to view and manage permissions</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === "system" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">General Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Application Name</label>
                <input
                  type="text"
                  defaultValue="SLASH Data Capture Tool"
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Organization</label>
                <input
                  type="text"
                  defaultValue="SLASH Initiative"
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Support Email</label>
                <input
                  type="email"
                  defaultValue="support@slash.org"
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
              </div>
            </div>
            <Button className="mt-6">Save Settings</Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Sync & Offline Settings</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Enable offline mode</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Auto-sync when connection available</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Require password for sync</span>
              </label>
            </div>
            <Button className="mt-6">Save Settings</Button>
          </Card>
        </div>
      )}

      {/* AI Integration Tab */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          {/* AI Credentials Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">AI Provider Credentials</h2>
            <p className="text-muted-foreground">
              Configure API keys for AI providers used in data analysis and automation.
            </p>
            <div className="pl-4">
              <AICredentials />
            </div>
          </div>

          <hr className="border-border" />

          {/* AI Settings Section */}  
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">AI Analysis & Automation</h2>
            <p className="text-muted-foreground">
              Configure AI analysis settings and run data quality checks.
            </p>
            <div className="pl-4">
              <AISettings />
            </div>
          </div>
        </div>
      )}

      {/* System Logs Tab */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">System Logs & Monitoring</h2>
            <p className="text-muted-foreground">
              View system activity logs, error reports, and monitoring data.
            </p>
            <SystemLogs />
          </div>
        </div>
      )}

      {/* Database Tab */}
      {activeTab === "database" && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Database Configuration</h2>
            <p className="text-muted-foreground">
              Manage database connections, initialize tables, and monitor database health.
            </p>
            <DatabaseSetup />
            <DualDatabaseDemo />
          </div>
        </div>
      )}

      {/* PWA Status Tab */}
      {activeTab === "pwa" && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">PWA Status & Offline Capabilities</h2>
            <p className="text-muted-foreground">
              Monitor Progressive Web App status, offline data storage, and synchronization.
            </p>
            <PWAStatus />
          </div>
        </div>
      )}
    </div>
  )
}
