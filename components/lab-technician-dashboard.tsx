"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import LabAnalysisForm from "./lab-analysis-form"
import { getHouseholdData, getLabAnalysis } from "@/lib/data-store"

export default function LabTechnicianDashboard({ user, onLogout }) {
  const [view, setView] = useState("pending")
  const [selectedEntryId, setSelectedEntryId] = useState(null)
  const [quickSearch, setQuickSearch] = useState("")
  const [searchResults, setSearchResults] = useState([])

  const householdData = getHouseholdData()
  const labAnalysis = getLabAnalysis()

  const pendingEntries = householdData.filter((d) => d.status === "submitted")
  const analyzedEntries = householdData.filter((d) =>
    labAnalysis.some((a) => a.dataSampleId === d.id && a.status === "completed"),
  )

  const handleQuickSearch = () => {
    if (!quickSearch.trim()) {
      setSearchResults([])
      return
    }
    const results = householdData.filter(
      (d) =>
        d.id.includes(quickSearch) ||
        d.householdId.includes(quickSearch) ||
        d.location.toLowerCase().includes(quickSearch.toLowerCase()),
    )
    setSearchResults(results)
  }

  const handleStartAnalysis = (entryId) => {
    setSelectedEntryId(entryId)
    setView("analysis")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lab Technician</h1>
            <p className="text-sm text-slate-600">Logged in as {user.name}</p>
          </div>
          <Button onClick={onLogout} variant="outline">
            Log Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === "pending" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="text-3xl font-bold text-blue-900">{pendingEntries.length}</div>
                <p className="text-sm text-blue-700">Pending Review</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
                <div className="text-3xl font-bold text-green-900">{analyzedEntries.length}</div>
                <p className="text-sm text-green-700">Completed</p>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Quick search by Household ID, Sample ID, or Location..."
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleQuickSearch()}
                  className="flex-1"
                />
                <Button onClick={handleQuickSearch} className="bg-blue-600 hover:bg-blue-700">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* Pending Entries */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Data for Analysis</h2>
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((entry) => (
                    <div key={entry.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">HH-{entry.householdId}</h3>
                          <p className="text-sm text-slate-600 mt-1">{entry.location}</p>
                          <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-slate-600">Collector:</span>
                              <span className="font-medium block">{entry.collectorName}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Date:</span>
                              <span className="font-medium block">{entry.date}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Family Size:</span>
                              <span className="font-medium block">{entry.familySize}</span>
                            </div>
                          </div>
                          {entry.healthIssues.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {entry.healthIssues.map((issue) => (
                                <span key={issue} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                  {issue}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleStartAnalysis(entry.id)}
                          className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                        >
                          Start Analysis
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingEntries.length === 0 ? (
                    <p className="text-slate-600 text-center py-8">No pending entries</p>
                  ) : (
                    pendingEntries.map((entry) => (
                      <div key={entry.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">HH-{entry.householdId}</h3>
                            <p className="text-sm text-slate-600 mt-1">{entry.location}</p>
                            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                              <div>
                                <span className="text-slate-600">Collector:</span>
                                <span className="font-medium block">{entry.collectorName}</span>
                              </div>
                              <div>
                                <span className="text-slate-600">Date:</span>
                                <span className="font-medium block">{entry.date}</span>
                              </div>
                              <div>
                                <span className="text-slate-600">Family Size:</span>
                                <span className="font-medium block">{entry.familySize}</span>
                              </div>
                            </div>
                            {entry.healthIssues.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {entry.healthIssues.map((issue) => (
                                  <span key={issue} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                    {issue}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => handleStartAnalysis(entry.id)}
                            className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                          >
                            Start Analysis
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {view === "analysis" && selectedEntryId && (
          <LabAnalysisForm
            entryId={selectedEntryId}
            technician={user}
            onClose={() => {
              setSelectedEntryId(null)
              setView("pending")
            }}
          />
        )}
      </main>
    </div>
  )
}
