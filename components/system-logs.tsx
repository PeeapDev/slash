"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"

export default function SystemLogs() {
  const [logs] = useState([
    {
      id: 1,
      timestamp: "2024-01-15 15:45",
      user: "admin@slash.org",
      action: "Login",
      resource: "System",
      details: "SuperAdmin logged in",
    },
    {
      id: 2,
      timestamp: "2024-01-15 15:42",
      user: "ahmed@slash.org",
      action: "Sync",
      resource: "Northern Region",
      details: "Data synced successfully",
    },
    {
      id: 3,
      timestamp: "2024-01-15 15:30",
      user: "maria@slash.org",
      action: "Update",
      resource: "Lab Results",
      details: "12 results entered",
    },
    {
      id: 4,
      timestamp: "2024-01-15 14:58",
      user: "grace@slash.org",
      action: "Submit",
      resource: "Surveys",
      details: "45 surveys submitted",
    },
    {
      id: 5,
      timestamp: "2024-01-15 14:32",
      user: "admin@slash.org",
      action: "Config",
      resource: "System",
      details: "AI audit settings updated",
    },
    {
      id: 6,
      timestamp: "2024-01-15 13:45",
      user: "john@slash.org",
      action: "Sync",
      resource: "Southern Region",
      details: "Data sync failed - network error",
    },
    {
      id: 7,
      timestamp: "2024-01-15 13:20",
      user: "admin@slash.org",
      action: "Staff Update",
      resource: "HR",
      details: "New enumerator added",
    },
    {
      id: 8,
      timestamp: "2024-01-15 12:15",
      user: "rebecca@slash.org",
      action: "Approve",
      resource: "Supervisor Account",
      details: "Account approval",
    },
  ])

  const [filterType, setFilterType] = useState("all")
  const [filterUser, setFilterUser] = useState("all")

  const actions = ["Login", "Sync", "Update", "Submit", "Config", "Staff Update", "Approve"]
  const users = ["all", "admin@slash.org", "ahmed@slash.org", "maria@slash.org", "grace@slash.org"]

  const filteredLogs = logs.filter((log) => {
    const typeMatch = filterType === "all" || log.action === filterType
    const userMatch = filterUser === "all" || log.user === filterUser
    return typeMatch && userMatch
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">Admin / System Logs</div>
        <h1 className="text-2xl font-bold mt-1">System Logs & Audit Trail</h1>
        <p className="text-sm text-muted-foreground mt-1">View all system activities and user actions</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Filter by Action</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2"
            >
              <option value="all">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filter by User</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2"
            >
              {users.map((user) => (
                <option key={user} value={user}>
                  {user === "all" ? "All Users" : user}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left py-3 px-6 font-semibold">Timestamp</th>
              <th className="text-left py-3 px-6 font-semibold">User</th>
              <th className="text-left py-3 px-6 font-semibold">Action</th>
              <th className="text-left py-3 px-6 font-semibold">Resource</th>
              <th className="text-left py-3 px-6 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-3 px-6 text-muted-foreground text-xs">{log.timestamp}</td>
                <td className="py-3 px-6 font-medium text-sm">{log.user}</td>
                <td className="py-3 px-6">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      log.action === "Sync" && log.details.includes("failed")
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-6">{log.resource}</td>
                <td className="py-3 px-6 text-muted-foreground">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
