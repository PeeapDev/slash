"use client"

import WebUsersTab from "./web-users-tab"

export default function StaffManagementPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Staff</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Field data collectors, supervisors, and lab technicians
        </p>
      </div>
      <WebUsersTab filterRoles={["supervisor", "field_collector", "lab_technician"]} />
    </div>
  )
}
