"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { getHouseholdData, getLabAnalysis, getSyncStatus } from "@/lib/data-store"
import { Wifi, WifiOff, Clock } from "lucide-react"

export default function SupervisorDashboard() {
  const [view, setView] = useState("overview")

  const householdData = getHouseholdData()
  const labAnalysis = getLabAnalysis()
  const syncStatuses = getSyncStatus()

  const regionStats = {}
  householdData.forEach((d) => {
    const region = d.location?.split(",")[0] || "Unknown"
    if (!regionStats[region]) {
      regionStats[region] = {
        surveyCount: 0,
        sampleCount: 0,
        households: 0,
      }
    }
    regionStats[region].surveyCount += 1
    regionStats[region].households = 1
  })

  const stats = {
    total_entries: householdData.length,
    submitted: householdData.filter((d) => d.status === "submitted").length,
    reviewed: householdData.filter((d) => d.status === "reviewed").length,
    draft: householdData.filter((d) => d.status === "draft").length,
    flagged: labAnalysis.filter((a) => a.status === "flagged").length,
  }

  const collectors = [...new Set(householdData.map((d) => d.collectorName))].map((name) => ({
    name,
    entries: householdData.filter((d) => d.collectorName === name).length,
    submitted: householdData.filter((d) => d.collectorName === name && d.status === "submitted").length,
  }))

  const healthConcerns = {}
  householdData.forEach((d) => {
    d.healthIssues.forEach((issue) => {
      healthConcerns[issue] = (healthConcerns[issue] || 0) + 1
    })
  })

  const waterSourceStats = {}
  householdData.forEach((d) => {
    waterSourceStats[d.waterSource] = (waterSourceStats[d.waterSource] || 0) + 1
  })

  const sanitationStats = {}
  householdData.forEach((d) => {
    sanitationStats[d.sanitationFacility] = (sanitationStats[d.sanitationFacility] || 0) + 1
  })

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-slate-200">
        <button
          onClick={() => setView("overview")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            view === "overview"
              ? "text-blue-600 border-blue-600"
              : "text-slate-600 border-transparent hover:text-slate-900"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setView("regions")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            view === "regions"
              ? "text-blue-600 border-blue-600"
              : "text-slate-600 border-transparent hover:text-slate-900"
          }`}
        >
          Regions
        </button>
        <button
          onClick={() => setView("sync")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            view === "sync" ? "text-blue-600 border-blue-600" : "text-slate-600 border-transparent hover:text-slate-900"
          }`}
        >
          Sync Status
        </button>
        <button
          onClick={() => setView("collectors")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            view === "collectors"
              ? "text-blue-600 border-blue-600"
              : "text-slate-600 border-transparent hover:text-slate-900"
          }`}
        >
          Field Collectors
        </button>
        <button
          onClick={() => setView("analysis")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            view === "analysis"
              ? "text-blue-600 border-blue-600"
              : "text-slate-600 border-transparent hover:text-slate-900"
          }`}
        >
          Lab Analysis
        </button>
      </div>

      {/* Overview Tab */}
      {view === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-3xl font-bold text-blue-900">{stats.total_entries}</div>
              <p className="text-sm text-blue-700 mt-1">Total Surveys</p>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
              <div className="text-3xl font-bold text-yellow-900">{stats.draft}</div>
              <p className="text-sm text-yellow-700 mt-1">Drafts</p>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="text-3xl font-bold text-purple-900">{stats.submitted}</div>
              <p className="text-sm text-purple-700 mt-1">Submitted</p>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-3xl font-bold text-green-900">{stats.reviewed}</div>
              <p className="text-sm text-green-700 mt-1">Reviewed</p>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100">
              <div className="text-3xl font-bold text-red-900">{stats.flagged}</div>
              <p className="text-sm text-red-700 mt-1">Flagged Issues</p>
            </Card>
          </div>

          {/* Health Concerns */}
          {Object.keys(healthConcerns).length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Health Concerns Reported</h2>
              <div className="space-y-2">
                {Object.entries(healthConcerns)
                  .sort(([, a], [, b]) => b - a)
                  .map(([issue, count]) => (
                    <div key={issue} className="flex items-center justify-between">
                      <span className="text-slate-700">{issue.replace(/_/g, " ")}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-48 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${(count / stats.total_entries) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-slate-900 w-12">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Water Sources & Sanitation */}
          <div className="grid md:grid-cols-2 gap-6">
            {Object.keys(waterSourceStats).length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Water Sources</h2>
                <div className="space-y-2">
                  {Object.entries(waterSourceStats)
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, count]) => (
                      <div key={source} className="flex justify-between items-center">
                        <span className="text-slate-700">{source.replace(/_/g, " ")}</span>
                        <span className="font-semibold text-slate-900">{count}</span>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {Object.keys(sanitationStats).length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Sanitation Facilities</h2>
                <div className="space-y-2">
                  {Object.entries(sanitationStats)
                    .sort(([, a], [, b]) => b - a)
                    .map(([facility, count]) => (
                      <div key={facility} className="flex justify-between items-center">
                        <span className="text-slate-700">{facility.replace(/_/g, " ")}</span>
                        <span className="font-semibold text-slate-900">{count}</span>
                      </div>
                    ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {view === "regions" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Regional Statistics</h2>
          {Object.entries(regionStats).length === 0 ? (
            <Card className="p-6 text-center text-slate-600">No regional data yet</Card>
          ) : (
            Object.entries(regionStats).map(([region, data]) => (
              <Card key={region} className="p-6">
                <h3 className="text-base font-semibold text-slate-900">{region}</h3>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="border border-slate-200 rounded p-3">
                    <p className="text-sm text-slate-600">Surveys Completed</p>
                    <p className="text-2xl font-bold text-slate-900">{data.surveyCount}</p>
                  </div>
                  <div className="border border-slate-200 rounded p-3">
                    <p className="text-sm text-slate-600">Sample Collection</p>
                    <p className="text-2xl font-bold text-slate-900">{data.sampleCount}</p>
                  </div>
                  <div className="border border-slate-200 rounded p-3">
                    <p className="text-sm text-slate-600">Households Covered</p>
                    <p className="text-2xl font-bold text-slate-900">{data.households}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {view === "sync" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Sync Status</h2>
          {syncStatuses.length === 0 ? (
            <Card className="p-6 text-center text-slate-600">No sync data yet</Card>
          ) : (
            syncStatuses.map((sync) => (
              <Card key={sync.collectorId} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {sync.status === "synced" ? (
                        <Wifi className="w-5 h-5 text-green-600" />
                      ) : sync.status === "pending" ? (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-red-600" />
                      )}
                      <h3 className="text-base font-semibold text-slate-900">{sync.collectorName}</h3>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          sync.status === "synced"
                            ? "bg-green-100 text-green-800"
                            : sync.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sync.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">Last Sync: {sync.lastSync}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Pending Records</p>
                    <p className="text-2xl font-bold text-slate-900">{sync.pendingRecords}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Collectors Tab */}
      {view === "collectors" && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Field Collector Performance</h2>
          {collectors.length === 0 ? (
            <p className="text-slate-600 text-center py-8">No collectors yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Collector Name</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Total Entries</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Submitted</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Draft</th>
                  </tr>
                </thead>
                <tbody>
                  {collectors.map((collector) => (
                    <tr key={collector.name} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-900 font-medium">{collector.name}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{collector.entries}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                          {collector.submitted}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">{collector.entries - collector.submitted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Lab Analysis Tab */}
      {view === "analysis" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Lab Analysis Summary</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-slate-900">{labAnalysis.length}</div>
                <p className="text-sm text-slate-600 mt-1">Total Analyses</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {labAnalysis.filter((a) => a.status === "completed").length}
                </div>
                <p className="text-sm text-slate-600 mt-1">Completed</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{stats.flagged}</div>
                <p className="text-sm text-slate-600 mt-1">Flagged for Review</p>
              </div>
            </div>
          </Card>

          {labAnalysis.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Analyses</h2>
              <div className="space-y-3">
                {labAnalysis.slice(-10).map((analysis) => (
                  <div key={analysis.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{analysis.analysisType.replace(/_/g, " ")}</p>
                        <p className="text-sm text-slate-600 mt-1">Technician: {analysis.technician}</p>
                        <p className="text-sm text-slate-600">Date: {analysis.date}</p>
                      </div>
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded ${
                          analysis.status === "flagged" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {analysis.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
