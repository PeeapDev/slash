"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Bot, CheckCircle, AlertCircle, Settings } from "lucide-react"
import { getAIStatus, validateDataQuality, detectMissingData, detectAnomalies } from "@/lib/ai-integration"
import { getHouseholdData, getSampleCollectionData } from "@/lib/data-store"

export default function AISettings() {
  const [aiConfig, setAiConfig] = useState({
    auditingEnabled: true,
    auditSchedule: "weekly",
    detectionFlags: {
      missingData: true,
      labFieldMismatch: true,
      outOfRangeValues: true,
      unlinkedSamples: true,
    },
    modelSelection: "gpt-4",
  })

  const [expandedSection, setExpandedSection] = useState("config")
  const [aiStatus, setAiStatus] = useState<any>(null)
  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  useEffect(() => {
    const status = getAIStatus()
    setAiStatus(status)
  }, [])
  const [flaggedIssues, setFlaggedIssues] = useState([
    {
      id: 1,
      type: "missing_data",
      region: "North",
      count: 34,
      priority: "high",
      status: "unresolved",
      resolved: false,
    },
    {
      id: 2,
      type: "lab_field_mismatch",
      region: "South",
      count: 12,
      priority: "high",
      status: "unresolved",
      resolved: false,
    },
    {
      id: 3,
      type: "out_of_range",
      region: "East",
      count: 8,
      priority: "medium",
      status: "unresolved",
      resolved: false,
    },
    { id: 4, type: "unlinked_samples", region: "West", count: 5, priority: "low", status: "resolved", resolved: true },
  ])

  const toggleDetectionFlag = (flag: keyof typeof aiConfig.detectionFlags) => {
    setAiConfig((prev) => ({
      ...prev,
      detectionFlags: {
        ...prev.detectionFlags,
        [flag]: !prev.detectionFlags[flag],
      },
    }))
  }

  const runAIAnalysis = async (type: 'validation' | 'missing' | 'anomalies') => {
    if (!aiStatus?.hasActiveProviders) {
      alert('No active AI providers configured. Please set up API credentials in AI Settings.')
      return
    }

    setAnalysisRunning(true)
    try {
      const householdData = getHouseholdData()
      const sampleData = getSampleCollectionData()
      const combinedData = { households: householdData, samples: sampleData }

      let result
      switch (type) {
        case 'validation':
          result = await validateDataQuality(combinedData, 'Health research data validation')
          break
        case 'missing':
          result = await detectMissingData(combinedData, 'Missing data analysis')
          break
        case 'anomalies':
          result = await detectAnomalies(combinedData, 'Anomaly detection')
          break
      }

      setAnalysisResults({ type, ...result })
    } catch (error) {
      console.error('AI Analysis failed:', error)
      setAnalysisResults({ 
        type, 
        success: false, 
        error: error instanceof Error ? error.message : 'Analysis failed' 
      })
    } finally {
      setAnalysisRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">Admin / AI & Automation</div>
        <h1 className="text-2xl font-bold mt-1">AI Integration & Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure AI auditing, detection rules, and reviews</p>
      </div>

      {/* AI Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Provider Status
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure API keys in the credentials section above
          </p>
        </div>
        
        {aiStatus ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {aiStatus.hasActiveProviders ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">
                  {aiStatus.hasActiveProviders 
                    ? `${aiStatus.activeCount} active provider(s)` 
                    : 'No active providers'
                  }
                </span>
              </div>
              
              {aiStatus.defaultProvider !== 'None' && (
                <Badge variant="secondary">
                  Default: {aiStatus.defaultProvider}
                </Badge>
              )}
            </div>
            
            {aiStatus.hasActiveProviders && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => runAIAnalysis('validation')}
                  disabled={analysisRunning}
                >
                  {analysisRunning ? 'Running...' : 'Run Data Validation'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => runAIAnalysis('missing')}
                  disabled={analysisRunning}
                >
                  Check Missing Data
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => runAIAnalysis('anomalies')}
                  disabled={analysisRunning}
                >
                  Detect Anomalies
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Loading AI status...</p>
        )}
      </Card>

      {/* Analysis Results */}
      {analysisResults && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">
            AI Analysis Results - {analysisResults.type}
          </h3>
          
          {analysisResults.success ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Analysis completed successfully</span>
                {analysisResults.provider && (
                  <Badge variant="outline">via {analysisResults.provider}</Badge>
                )}
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">
                  {analysisResults.data}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Analysis failed</span>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg text-red-800">
                <p className="text-sm">{analysisResults.error}</p>
              </div>
            </div>
          )}
          
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-4"
            onClick={() => setAnalysisResults(null)}
          >
            Clear Results
          </Button>
        </Card>
      )}

      {/* AI Configuration */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === "config" ? "" : "config")}
          className="w-full p-6 flex items-center justify-between hover:bg-muted transition-colors"
        >
          <h2 className="font-semibold">AI Audit Configuration</h2>
          <ChevronDown
            size={20}
            className={`transition-transform ${expandedSection === "config" ? "rotate-180" : ""}`}
          />
        </button>

        {expandedSection === "config" && (
          <div className="border-t border-border p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Enable AI Auditing</label>
                  <p className="text-sm text-muted-foreground">Enable automated data quality checks</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiConfig.auditingEnabled}
                  onChange={(e) => setAiConfig((prev) => ({ ...prev, auditingEnabled: e.target.checked }))}
                  className="w-5 h-5"
                />
              </div>

              {aiConfig.auditingEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Audit Schedule</label>
                    <select
                      value={aiConfig.auditSchedule}
                      onChange={(e) => setAiConfig((prev) => ({ ...prev, auditSchedule: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2"
                    >
                      <option>daily</option>
                      <option>weekly</option>
                      <option>bi-weekly</option>
                      <option>monthly</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium">Detection Rules</label>
                    <div className="space-y-2">
                      {Object.entries(aiConfig.detectionFlags).map(([key, enabled]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => toggleDetectionFlag(key as keyof typeof aiConfig.detectionFlags)}
                            className="rounded border-border"
                          />
                          <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">AI Model</label>
                    <select
                      value={aiConfig.modelSelection}
                      onChange={(e) => setAiConfig((prev) => ({ ...prev, modelSelection: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2"
                    >
                      <option>gpt-4</option>
                      <option>gpt-3.5-turbo</option>
                      <option>claude-2</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <Button className="w-full">Save Configuration</Button>
          </div>
        )}
      </Card>

      {/* AI Review Center */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === "review" ? "" : "review")}
          className="w-full p-6 flex items-center justify-between hover:bg-muted transition-colors"
        >
          <h2 className="font-semibold">AI Review Center</h2>
          <ChevronDown
            size={20}
            className={`transition-transform ${expandedSection === "review" ? "rotate-180" : ""}`}
          />
        </button>

        {expandedSection === "review" && (
          <div className="border-t border-border p-6">
            <div className="space-y-3">
              {flaggedIssues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium capitalize">{issue.type.replace(/_/g, " ")}</div>
                    <div className="text-sm text-muted-foreground">
                      {issue.region} • {issue.count} items
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        issue.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : issue.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {issue.priority}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        issue.resolved ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {issue.status}
                    </span>
                    <div className="flex gap-2">
                      {!issue.resolved && (
                        <>
                          <Button size="sm" variant="outline">
                            Assign
                          </Button>
                          <Button size="sm" variant="outline">
                            Mark Fixed
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline">
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Weekly Summary */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === "summary" ? "" : "summary")}
          className="w-full p-6 flex items-center justify-between hover:bg-muted transition-colors"
        >
          <h2 className="font-semibold">Latest AI Summary Report</h2>
          <ChevronDown
            size={20}
            className={`transition-transform ${expandedSection === "summary" ? "rotate-180" : ""}`}
          />
        </button>

        {expandedSection === "summary" && (
          <div className="border-t border-border p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Issues Found</div>
                <div className="text-3xl font-bold mt-1">59</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Resolved This Week</div>
                <div className="text-3xl font-bold mt-1">23</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-3">AI audit completed on January 15, 2024. Key findings:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>34 instances of missing survey data detected in Northern region</li>
                <li>12 samples with no corresponding lab results found</li>
                <li>8 out-of-range values flagged for review</li>
                <li>5 unlinked sample records identified</li>
              </ul>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
