"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Shield } from "lucide-react"
import {
  type TeamRole,
  type RolePermissions,
  ROLE_DEFINITIONS,
  getRoleColor,
} from "@/lib/team-roles"

const permissionGroups: { label: string; keys: (keyof RolePermissions)[] }[] = [
  { label: "Data Access", keys: ["viewAllData", "viewRegionalData", "viewDistrictData", "viewOwnData"] },
  { label: "Data Management", keys: ["createRecords", "editRecords", "deleteRecords", "approveRecords"] },
  { label: "User Management", keys: ["manageUsers", "assignRoles", "viewStaffPerformance"] },
  { label: "Lab Operations", keys: ["enterLabResults", "approveLabResults", "flagLabIssues"] },
  { label: "AI & Analytics", keys: ["runAIAudits", "viewAIReports", "configureAI"] },
  { label: "System", keys: ["manageConfiguration", "viewSystemLogs", "manageIntegrations"] },
  { label: "Region/District", keys: ["manageRegions", "manageDistricts", "assignEnumerators"] },
]

const allRoles = Object.keys(ROLE_DEFINITIONS) as TeamRole[]

export default function RolesPermissions() {
  const [selectedRole, setSelectedRole] = useState<TeamRole>("superadmin")

  const roleDef = ROLE_DEFINITIONS[selectedRole]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Roles & Permissions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          8 roles with 23 fine-grained permissions. Roles are defined in code (read-only).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Role list */}
        <Card className="overflow-hidden lg:col-span-1">
          <div className="p-3 bg-muted border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Roles ({allRoles.length})
            </h3>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {allRoles.map((roleKey) => {
              const def = ROLE_DEFINITIONS[roleKey]
              const permCount = Object.values(def.permissions).filter(Boolean).length
              return (
                <button
                  key={roleKey}
                  onClick={() => setSelectedRole(roleKey)}
                  className={`w-full text-left p-3 hover:bg-muted transition-colors ${
                    selectedRole === roleKey ? "bg-primary/10 border-l-2 border-primary" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{def.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{def.description}</div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 ml-2">
                      {permCount} perms
                    </Badge>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Permissions */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getRoleColor(selectedRole)}`} />
                <h3 className="text-base font-semibold">{roleDef.title}</h3>
                <Badge variant="outline" className="text-xs">Hierarchy: {roleDef.hierarchy}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{roleDef.description}</p>
            </div>
          </div>

          <div className="space-y-3">
            {permissionGroups.map((group) => (
              <div key={group.label} className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">{group.label}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.keys.map((key) => {
                    const enabled = roleDef.permissions[key]
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 p-2 rounded border text-sm ${
                          enabled
                            ? "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-800"
                            : "bg-muted/30 border-border"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                            enabled
                              ? "bg-green-500 border-green-500"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {enabled ? <Check size={12} className="text-white" /> : <X size={10} className="text-muted-foreground/30" />}
                        </div>
                        <span className="text-xs">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> Roles and permissions are defined in code (<code>lib/team-roles.ts</code>).
            This matches ODK Central's approach — roles are not editable at runtime.
          </div>
        </Card>
      </div>
    </div>
  )
}
