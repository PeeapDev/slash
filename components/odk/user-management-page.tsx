"use client"

import WebUsersTab from "./web-users-tab"

export default function UserManagementPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          System administrators and web users who manage the platform
        </p>
      </div>
      <WebUsersTab filterRoles={["superadmin", "regional_head", "ai_data_manager", "hr_manager", "guest"]} />
    </div>
  )
}
