"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { 
  getHouseholdData, 
  getParticipantData, 
  getSampleCollectionData, 
  getLabAnalysis,
  getAuditFlags,
  type HouseholdData,
  type ParticipantData,
  type SampleCollectionData,
  type LabAnalysis,
  type AuditFlag
} from "@/lib/offline-data-store"
import { getProjects, type Project } from "@/lib/admin-data-store"
import { indexedDBService } from "@/lib/indexdb-service"

const regionActivityData = [
  { region: "North", households: 245, participants: 1280, samples: 892 },
  { region: "South", households: 198, participants: 1045, samples: 756 },
  { region: "East", households: 312, participants: 1620, samples: 1204 },
  { region: "West", households: 267, participants: 1389, samples: 998 },
]

const weeklySyncData = [
  { day: "Mon", synced: 145, pending: 32 },
  { day: "Tue", synced: 210, pending: 18 },
  { day: "Wed", synced: 185, pending: 24 },
  { day: "Thu", synced: 298, pending: 12 },
  { day: "Fri", synced: 267, pending: 15 },
  { day: "Sat", synced: 189, pending: 28 },
  { day: "Sun", synced: 156, pending: 8 },
]

const labResultsData = [
  { name: "Completed", value: 3245, color: "#10b981" },
  { name: "Pending", value: 1456, color: "#f59e0b" },
  { name: "In Review", value: 678, color: "#3b82f6" },
]

const enumeratorPerformance = [
  { name: "John Mwangi", surveys: 245, samples: 189, accuracy: 98 },
  { name: "Maria Santos", surveys: 238, samples: 201, accuracy: 96 },
  { name: "Ahmed Hassan", surveys: 221, samples: 178, accuracy: 95 },
  { name: "Grace Okoye", surveys: 267, samples: 215, accuracy: 99 },
  { name: "Kwame Asante", surveys: 198, samples: 162, accuracy: 92 },
]

const projectsData = [
  { 
    id: "PROJ-001", 
    name: "Urban Health Study", 
    status: "active", 
    progress: 75, 
    startDate: "2024-01-15", 
    endDate: "2024-12-31",
    region: "North",
    participants: 1250
  },
  { 
    id: "PROJ-002", 
    name: "Rural Water Quality", 
    status: "active", 
    progress: 45, 
    startDate: "2024-03-01", 
    endDate: "2025-02-28",
    region: "South",
    participants: 890
  },
  { 
    id: "PROJ-003", 
    name: "Child Nutrition Survey", 
    status: "planning", 
    progress: 15, 
    startDate: "2024-06-01", 
    endDate: "2024-11-30",
    region: "East",
    participants: 650
  },
  { 
    id: "PROJ-004", 
    name: "Environmental Health", 
    status: "completed", 
    progress: 100, 
    startDate: "2023-09-01", 
    endDate: "2024-08-31",
    region: "West",
    participants: 1100
  },
  { 
    id: "PROJ-005", 
    name: "Mental Health Initiative", 
    status: "active", 
    progress: 60, 
    startDate: "2024-02-15", 
    endDate: "2024-10-15",
    region: "Central",
    participants: 750
  }
]

const aiFlags = [
  { id: 1, issue: "Missing survey data", count: 34, priority: "high", region: "North" },
  { id: 2, issue: "Sample with no lab result", count: 12, priority: "high", region: "South" },
  { id: 3, issue: "Lab result with no sample", count: 8, priority: "medium", region: "East" },
  { id: 4, issue: "Out-of-range values detected", count: 5, priority: "medium", region: "West" },
  { id: 5, issue: "Unlinked samples", count: 3, priority: "low", region: "North" },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <span>Dashboard</span> / <span>Overview</span>
      </div>

      {/* Key Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Total Households</div>
          <div className="text-3xl font-bold mt-2">1,022</div>
          <div className="text-xs text-green-600 mt-2">+12% from last month</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Total Participants</div>
          <div className="text-3xl font-bold mt-2">5,334</div>
          <div className="text-xs text-green-600 mt-2">+8% from last month</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Samples Collected</div>
          <div className="text-3xl font-bold mt-2">3,850</div>
          <div className="text-xs text-green-600 mt-2">+15% from last month</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Lab Results</div>
          <div className="text-3xl font-bold mt-2">3,245</div>
          <div className="text-xs text-blue-600 mt-2">84% completion rate</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Active Projects</div>
          <div className="text-3xl font-bold mt-2">{projectsData.filter(p => p.status === 'active').length}</div>
          <div className="text-xs text-blue-600 mt-2">{projectsData.length} total projects</div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Activity */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Regional Activity Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="households" fill="#3b82f6" />
              <Bar dataKey="participants" fill="#10b981" />
              <Bar dataKey="samples" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Weekly Sync Activity */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Weekly Sync Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklySyncData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="synced" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lab Results Status */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Lab Results Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={labResultsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {labResultsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* AI Flagged Issues */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">AI Flagged Issues</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {aiFlags.map((flag) => (
              <div key={flag.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{flag.issue}</div>
                  <div className="text-xs text-muted-foreground">
                    {flag.region} • {flag.count} items
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    flag.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : flag.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                  }`}
                >
                  {flag.priority}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Project Timeline */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Project Timeline & Status</h3>
        <div className="space-y-4">
          {projectsData.map((project) => (
            <div key={project.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-sm">{project.name}</h4>
                    <p className="text-xs text-muted-foreground">{project.id} • {project.region} Region</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === "active"
                        ? "bg-green-100 text-green-800"
                        : project.status === "planning"
                          ? "bg-yellow-100 text-yellow-800"
                          : project.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">{project.participants} participants</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress: {project.progress}%</span>
                  <span>{project.startDate} - {project.endDate}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      project.progress === 100 ? "bg-green-500" : 
                      project.progress >= 75 ? "bg-blue-500" :
                      project.progress >= 50 ? "bg-yellow-500" : "bg-gray-400"
                    }`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Enumerator Performance */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Enumerator Performance Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4">Enumerator</th>
                <th className="text-center py-3 px-4">Surveys Completed</th>
                <th className="text-center py-3 px-4">Samples Collected</th>
                <th className="text-center py-3 px-4">Accuracy Rate</th>
              </tr>
            </thead>
            <tbody>
              {enumeratorPerformance.map((enum_, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-muted">
                  <td className="py-3 px-4">{enum_.name}</td>
                  <td className="text-center py-3 px-4">{enum_.surveys}</td>
                  <td className="text-center py-3 px-4">{enum_.samples}</td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        enum_.accuracy >= 97 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {enum_.accuracy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
