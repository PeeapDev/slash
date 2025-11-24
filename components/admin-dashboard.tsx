"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
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
import { offlineDB, type Household, type Participant, type Sample, type LabResult, type AuditTrail, type ProjectMetadata } from "@/lib/offline-first-db"

export default function AdminDashboard() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [samples, setSamples] = useState<Sample[]>([])
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([])
  const [projects, setProjects] = useState<ProjectMetadata[]>([])
  const [syncQueue, setSyncQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const loadData = async () => {
    try {
      if (!loading) setRefreshing(true)
      console.log('📊 Loading dashboard data from IndexedDB...')
      
      // Initialize offlineDB first
      await offlineDB.init()
      console.log('✅ IndexedDB initialized')
      
      // Load data with individual error handling
      const householdsData = await offlineDB.getAll<Household>('households').catch(e => {
        console.error('Error loading households:', e)
        return []
      })
      
      const participantsData = await offlineDB.getAll<Participant>('participants').catch(e => {
        console.error('Error loading participants:', e)
        return []
      })
      
      const samplesData = await offlineDB.getAll<Sample>('samples').catch(e => {
        console.error('Error loading samples:', e)
        return []
      })
      
      const labData = await offlineDB.getAll<LabResult>('lab_results').catch(e => {
        console.error('Error loading lab results:', e)
        return []
      })
      
      const auditData = await offlineDB.getAll<AuditTrail>('audit_trails').catch(e => {
        console.error('Error loading audit trails:', e)
        return []
      })
      
      const projectsData = await offlineDB.getAll<ProjectMetadata>('project_metadata').catch(e => {
        console.error('Error loading projects:', e)
        return []
      })
      
      const queueData = await offlineDB.getAll('sync_queue').catch(e => {
        console.error('Error loading sync queue:', e)
        return []
      })
      
      console.log('📊 Dashboard data loaded:', {
        households: householdsData.length,
        participants: participantsData.length,
        samples: samplesData.length,
        labResults: labData.length,
        projects: projectsData.length,
        syncQueue: queueData.length
      })
      
      setHouseholds(householdsData)
      setParticipants(participantsData)
      setSamples(samplesData)
      setLabResults(labData)
      setAuditTrails(auditData)
      setProjects(projectsData)
      setSyncQueue(queueData)
      setLastRefresh(new Date())
      
      console.log('✅ Dashboard data set successfully')
    } catch (error) {
      console.error("❌ CRITICAL Error loading dashboard data:", error)
      alert(`Dashboard loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      console.log('🏁 Setting loading to false')
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    console.log('🚀 AdminDashboard mounted - starting data load')
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Safety timeout triggered - forcing loading to false')
      setLoading(false)
      setRefreshing(false)
    }, 10000) // 10 seconds max
    
    loadData().then(() => {
      clearTimeout(safetyTimeout)
    }).catch(err => {
      console.error('loadData failed:', err)
      clearTimeout(safetyTimeout)
    })
    
    // Subscribe to sync events to auto-reload dashboard
    let unsubscribe: (() => void) | undefined
    
    const setupSyncListener = async () => {
      try {
        const { syncEngine } = await import('@/lib/sync-queue-engine')
        unsubscribe = syncEngine.onSyncComplete(() => {
          console.log('🔄 Sync completed - reloading dashboard data')
          loadData()
        })
      } catch (error) {
        console.error('Failed to setup sync listener:', error)
      }
    }
    
    setupSyncListener()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh triggered')
      loadData()
    }, 30000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(safetyTimeout)
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Calculate regional activity from actual data
  const regionActivityData = (households || []).reduce((acc, household) => {
    const region = household.address?.split(',')[0] || "Unknown"
    if (!acc[region]) {
      acc[region] = { region, households: 0, participants: 0, samples: 0 }
    }
    acc[region].households++
    
    // Count participants for this household
    const householdParticipants = (participants || []).filter(p => p.householdId === household.id)
    acc[region].participants += householdParticipants.length
    
    // Count samples for this household
    const householdSamples = (samples || []).filter(s => s.householdId === household.id)
    acc[region].samples += householdSamples.length
    
    return acc
  }, {} as Record<string, { region: string; households: number; participants: number; samples: number }>)

  const regionActivityArray = Object.values(regionActivityData)

  // Calculate weekly sync data from syncQueue
  const weeklySyncData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    
    const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime()
    const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime()
    
    const dayQueue = (syncQueue || []).filter(q => {
      if (!q?.createdAt) return false
      const qTime = new Date(q.createdAt).getTime()
      return qTime >= dayStart && qTime <= dayEnd
    })
    
    return {
      day: dayName,
      synced: dayQueue.filter(q => q.synced).length,
      pending: dayQueue.filter(q => !q.synced).length
    }
  })

  // Calculate lab results status
  const completedResults = (labResults || []).filter(r => r.status === 'completed' || r.status === 'reviewed').length
  const pendingResults = (samples || []).filter(s => !(labResults || []).some(l => l.sampleId === s.id)).length
  const inReviewResults = (labResults || []).filter(r => r.status === 'needs_review' || r.status === 'flagged').length
  
  const labResultsData = [
    { name: "Completed", value: completedResults, color: "#10b981" },
    { name: "Pending", value: pendingResults, color: "#f59e0b" },
    { name: "In Review", value: inReviewResults, color: "#3b82f6" },
  ].filter(item => item.value > 0)

  // Group audit trails by operation type to identify issues
  const flagsByType = (auditTrails || []).reduce((acc, trail) => {
    const key = trail.operation
    if (!acc[key]) {
      acc[key] = { issue: key.replace(/_/g, ' '), count: 0, priority: 'medium', flags: [] }
    }
    acc[key].count++
    acc[key].flags.push(trail)
    return acc
  }, {} as Record<string, any>)

  const aiFlags = Object.values(flagsByType).map((item: any) => ({
    id: item.flags[0]?.id || 'unknown',
    issue: item.issue.charAt(0).toUpperCase() + item.issue.slice(1),
    count: item.count,
    priority: item.priority,
    region: item.flags[0]?.objectStore || 'unknown'
  }))

  // Calculate enumerator performance from samples
  const collectorPerformance = (samples || []).reduce((acc, sample) => {
    const collectorId = sample.collectorId
    const collectorName = collectorId
    
    if (!acc[collectorId]) {
      acc[collectorId] = { name: collectorName, samples: 0, labResults: 0, qualityChecks: [] }
    }
    acc[collectorId].samples++
    
    // Check if sample has lab result
    if ((labResults || []).some(l => l.sampleId === sample.id)) {
      acc[collectorId].labResults++
    }
    
    // Track quality checks based on quality flags
    const qualityScore = (sample.qualityFlags || []).length === 0 ? 1 : 0.7
    acc[collectorId].qualityChecks.push(qualityScore)
    
    return acc
  }, {} as Record<string, any>)

  const enumeratorPerformance = Object.values(collectorPerformance)
    .map((perf: any) => ({
      name: perf.name,
      surveys: 0,
      samples: perf.samples,
      accuracy: perf.qualityChecks.length > 0 ? Math.round((perf.qualityChecks.reduce((a: number, b: number) => a + b, 0) / perf.qualityChecks.length) * 100) : 0
    }))
    .filter(p => p.samples > 0)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Refresh Button - Top Right */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Analytics - 2 columns on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <Card className="p-3 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <div className="text-xs lg:text-sm text-blue-700 dark:text-blue-300 font-medium">Households</div>
          <div className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2 text-blue-900 dark:text-blue-100">{(households || []).length.toLocaleString()}</div>
          <div className="text-[10px] lg:text-xs text-blue-600 dark:text-blue-400 mt-1 lg:mt-2 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-green-500"></span>
            <span className="hidden lg:inline">{(households || []).filter(h => h.syncStatus === 'synced').length} synced</span>
            <span className="lg:hidden">{(households || []).filter(h => h.syncStatus === 'synced').length}</span>
          </div>
        </Card>
        <Card className="p-3 lg:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <div className="text-xs lg:text-sm text-green-700 dark:text-green-300 font-medium">Participants</div>
          <div className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2 text-green-900 dark:text-green-100">{(participants || []).length.toLocaleString()}</div>
          <div className="text-[10px] lg:text-xs text-green-600 dark:text-green-400 mt-1 lg:mt-2 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-green-500"></span>
            <span className="hidden lg:inline">{(participants || []).filter(p => p.syncStatus === 'synced').length} synced</span>
            <span className="lg:hidden">{(participants || []).filter(p => p.syncStatus === 'synced').length}</span>
          </div>
        </Card>
        <Card className="p-3 lg:p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <div className="text-xs lg:text-sm text-amber-700 dark:text-amber-300 font-medium">Samples</div>
          <div className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2 text-amber-900 dark:text-amber-100">{(samples || []).length.toLocaleString()}</div>
          <div className="text-[10px] lg:text-xs text-amber-600 dark:text-amber-400 mt-1 lg:mt-2 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-green-500"></span>
            <span className="hidden lg:inline">{(samples || []).filter(s => s.syncStatus === 'synced').length} synced</span>
            <span className="lg:hidden">{(samples || []).filter(s => s.syncStatus === 'synced').length}</span>
          </div>
        </Card>
        <Card className="p-3 lg:p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <div className="text-xs lg:text-sm text-purple-700 dark:text-purple-300 font-medium">Lab Results</div>
          <div className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2 text-purple-900 dark:text-purple-100">{(labResults || []).length.toLocaleString()}</div>
          <div className="text-[10px] lg:text-xs text-purple-600 dark:text-purple-400 mt-1 lg:mt-2">
            <span className="hidden lg:inline">{(samples || []).length > 0 ? Math.round(((labResults || []).length / (samples || []).length) * 100) : 0}% rate</span>
            <span className="lg:hidden">{(samples || []).length > 0 ? Math.round(((labResults || []).length / (samples || []).length) * 100) : 0}%</span>
          </div>
        </Card>
        <Card className="p-3 lg:p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800">
          <div className="text-xs lg:text-sm text-indigo-700 dark:text-indigo-300 font-medium">Projects</div>
          <div className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2 text-indigo-900 dark:text-indigo-100">{(projects || []).length}</div>
          <div className="text-[10px] lg:text-xs text-indigo-600 dark:text-indigo-400 mt-1 lg:mt-2">
            <span className="hidden lg:inline">{(projects || []).length} total</span>
            <span className="lg:hidden">Active</span>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Activity */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Regional Activity Comparison</h3>
          {regionActivityArray.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionActivityArray}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="region" className="text-xs" stroke="hsl(var(--foreground))" />
                <YAxis className="text-xs" stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="households" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="participants" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="samples" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No regional data available
            </div>
          )}
        </Card>

        {/* Weekly Sync Activity */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Weekly Sync Activity</h3>
          {weeklySyncData.some(d => d.synced > 0 || d.pending > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklySyncData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" stroke="hsl(var(--foreground))" />
                <YAxis className="text-xs" stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <Line type="monotone" dataKey="synced" stroke="hsl(142 76% 36%)" strokeWidth={3} dot={{ fill: 'hsl(142 76% 36%)', r: 4 }} />
                <Line type="monotone" dataKey="pending" stroke="hsl(38 92% 50%)" strokeWidth={3} dot={{ fill: 'hsl(38 92% 50%)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No sync data available
            </div>
          )}
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lab Results Status */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Lab Results Status</h3>
          {labResultsData.length > 0 ? (
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              No lab results available
            </div>
          )}
        </Card>

        {/* AI Flagged Issues */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Data Quality Flags</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {aiFlags.length > 0 ? (
              aiFlags.map((flag) => (
                <div key={flag.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{flag.issue}</div>
                    <div className="text-xs text-muted-foreground">
                      {flag.region} • {flag.count} items
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      flag.priority === "high" || flag.priority === "critical"
                        ? "bg-red-100 text-red-800"
                        : flag.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {flag.priority}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No data quality issues detected
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Project Timeline */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Project Timeline & Status</h3>
        <div className="space-y-4">
          {(projects || []).length > 0 ? (
            (projects || []).map((project) => {
              const startDate = project.studyPeriod?.start || 'N/A'
              const endDate = project.studyPeriod?.end || 'N/A'
              const isActive = new Date() >= new Date(startDate) && new Date() <= new Date(endDate)
              
              return (
                <div key={project.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium text-sm">{project.projectName}</h4>
                        <p className="text-xs text-muted-foreground">
                          {project.projectCode} • {(project.regions || []).join(', ') || 'No regions'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Target: {project.targetSampleSize || 0} samples</span>
                      <span>{startDate} - {endDate}</span>
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>No projects available</p>
              <p className="text-xs mt-1">Create a project in Project Management</p>
            </div>
          )}
        </div>
      </Card>

      {/* Enumerator Performance */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Collector Performance Leaderboard</h3>
        {enumeratorPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Collector</th>
                  <th className="text-center py-3 px-4">Surveys Completed</th>
                  <th className="text-center py-3 px-4">Samples Collected</th>
                  <th className="text-center py-3 px-4">Quality Score</th>
                </tr>
              </thead>
              <tbody>
                {enumeratorPerformance.map((enum_, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted">
                    <td className="py-3 px-4">{enum_.name}</td>
                    <td className="text-center py-3 px-4">{enum_.surveys || 'N/A'}</td>
                    <td className="text-center py-3 px-4">{enum_.samples}</td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          enum_.accuracy >= 97 ? "bg-green-100 text-green-800" : 
                          enum_.accuracy >= 90 ? "bg-blue-100 text-blue-800" : 
                          "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {isNaN(enum_.accuracy) ? 'N/A' : `${enum_.accuracy}%`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No collector performance data available
          </div>
        )}
      </Card>
    </div>
  )
}
