"use client"

// Fieldwork Dashboard - Offline-First Implementation
// Loads entirely from IndexedDB, never from network

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users,
  Home,
  TestTube,
  FileText,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Target
} from "lucide-react"
import { 
  offlineDB, 
  Household, 
  Participant, 
  Sample, 
  Survey, 
  FormResponse,
  ProjectMetadata,
  Assignment
} from "@/lib/offline-first-db"
import { syncEngine, SyncResult } from "@/lib/sync-engine"

interface FieldworkStats {
  households: {
    total: number
    completed: number
    pending: number
  }
  participants: {
    total: number
    consented: number
    pending: number
  }
  samples: {
    total: number
    collected: number
    pending: number
  }
  surveys: {
    total: number
    completed: number
    draft: number
  }
  syncStatus: {
    pending: number
    errors: number
    lastSync?: string
  }
}

interface CurrentAssignment {
  assignment: Assignment
  progress: number
  daysRemaining: number
  priority: 'low' | 'medium' | 'high'
}

export default function FieldworkDashboard() {
  const [stats, setStats] = useState<FieldworkStats | null>(null)
  const [assignments, setAssignments] = useState<CurrentAssignment[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [activeModule, setActiveModule] = useState<string>('overview')
  const [isOnline, setIsOnline] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)
  
  // Current user context (would be from auth in real app)
  const currentCollector = {
    id: 'collector_123',
    name: 'Sarah Johnson',
    role: 'field_collector',
    region: 'Western',
    district: 'Freetown',
    projectIds: ['project_1', 'project_2']
  }

  useEffect(() => {
    loadDashboardData()
    setupSyncListener()
    setupNetworkListener()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const setupNetworkListener = () => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine)
    }
    
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    updateNetworkStatus()
    
    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
    }
  }

  const setupSyncListener = () => {
    const unsubscribe = syncEngine.onSyncComplete((result: SyncResult) => {
      setLastSyncResult(result)
      setIsSyncing(false)
      // Reload data after sync
      loadDashboardData()
    })

    // Check current sync status
    setIsSyncing(syncEngine.isSyncing())

    return unsubscribe
  }

  // Load All Dashboard Data from IndexedDB (Never from Network)
  const loadDashboardData = async () => {
    try {
      console.log('📊 Loading fieldwork dashboard from IndexedDB...')
      
      await offlineDB.init()

      // Load statistics
      const [households, participants, samples, surveys, formResponses] = await Promise.all([
        offlineDB.getAll<Household>('households'),
        offlineDB.getAll<Participant>('participants'),
        offlineDB.getAll<Sample>('samples'),
        offlineDB.getAll<Survey>('surveys'),
        offlineDB.getAll<FormResponse>('form_responses')
      ])

      // Calculate stats
      const stats: FieldworkStats = {
        households: {
          total: households.length,
          completed: households.filter(h => h.syncStatus === 'synced').length,
          pending: households.filter(h => h.syncStatus === 'pending').length
        },
        participants: {
          total: participants.length,
          consented: participants.filter(p => p.consentGiven).length,
          pending: participants.filter(p => !p.consentGiven).length
        },
        samples: {
          total: samples.length,
          collected: samples.filter(s => s.syncStatus === 'synced').length,
          pending: samples.filter(s => s.syncStatus === 'pending').length
        },
        surveys: {
          total: surveys.length,
          completed: surveys.filter(s => s.completionStatus === 'completed').length,
          draft: surveys.filter(s => s.completionStatus === 'draft').length
        },
        syncStatus: {
          pending: 0,
          errors: 0
        }
      }

      // Load sync status
      const syncSummary = await syncEngine.getSyncSummary()
      stats.syncStatus = {
        ...syncSummary,
        lastSync: lastSyncResult?.duration ? new Date(Date.now() - lastSyncResult.duration).toISOString() : undefined
      }

      setStats(stats)

      // Load assignments
      await loadAssignments()

      // Load recent activity
      await loadRecentActivity()

      console.log('✅ Dashboard data loaded from IndexedDB')
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
    }
  }

  const loadAssignments = async () => {
    try {
      const projects = await offlineDB.getAll<ProjectMetadata>('project_metadata')
      const allAssignments: CurrentAssignment[] = []

      for (const project of projects) {
        const collectorAssignments = project.assignments.filter(
          a => a.collectorId === currentCollector.id
        )

        for (const assignment of collectorAssignments) {
          const daysRemaining = Math.ceil(
            (new Date(assignment.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          
          const progress = assignment.targetCount > 0 
            ? (assignment.completedCount / assignment.targetCount) * 100 
            : 0

          allAssignments.push({
            assignment,
            progress,
            daysRemaining,
            priority: daysRemaining <= 3 ? 'high' : daysRemaining <= 7 ? 'medium' : 'low'
          })
        }
      }

      setAssignments(allAssignments.sort((a, b) => a.daysRemaining - b.daysRemaining))
    } catch (error) {
      console.error('❌ Error loading assignments:', error)
    }
  }

  const loadRecentActivity = async () => {
    try {
      const auditTrails = await offlineDB.getAll('audit_trails')
      const recentItems = auditTrails
        .filter(audit => audit.userId === currentCollector.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)

      setRecentActivity(recentItems)
    } catch (error) {
      console.error('❌ Error loading recent activity:', error)
    }
  }

  // Manual Sync Trigger
  const handleManualSync = async () => {
    if (!isOnline) {
      alert('Cannot sync - device is offline')
      return
    }

    setIsSyncing(true)
    try {
      await syncEngine.syncNow()
    } catch (error) {
      console.error('❌ Manual sync failed:', error)
      setIsSyncing(false)
    }
  }

  // Quick Actions
  const handleQuickAction = (action: string) => {
    setActiveModule(action)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading fieldwork dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Collector Info and Network Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fieldwork Dashboard</h1>
            <p className="text-muted-foreground">
              {currentCollector.name} • {currentCollector.region}, {currentCollector.district}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Network Status */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
            </div>

            {/* Sync Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </div>

        {/* Sync Status */}
        {stats.syncStatus.pending > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {stats.syncStatus.pending} items pending sync
                {stats.syncStatus.errors > 0 && ` • ${stats.syncStatus.errors} errors`}
              </span>
            </div>
          </div>
        )}

        {lastSyncResult && lastSyncResult.conflicts.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                {lastSyncResult.conflicts.length} conflicts require attention
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Home className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{stats.households.total}</div>
              <div className="text-sm text-muted-foreground">Households</div>
              <div className="text-xs text-green-600">
                {stats.households.completed} completed
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{stats.participants.total}</div>
              <div className="text-sm text-muted-foreground">Participants</div>
              <div className="text-xs text-green-600">
                {stats.participants.consented} consented
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TestTube className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold">{stats.samples.total}</div>
              <div className="text-sm text-muted-foreground">Samples</div>
              <div className="text-xs text-green-600">
                {stats.samples.collected} collected
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-orange-600" />
            <div>
              <div className="text-2xl font-bold">{stats.surveys.total}</div>
              <div className="text-sm text-muted-foreground">Surveys</div>
              <div className="text-xs text-green-600">
                {stats.surveys.completed} completed
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2"
            onClick={() => handleQuickAction('households')}
          >
            <Home className="w-6 h-6" />
            <span className="text-sm">New Household</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2"
            onClick={() => handleQuickAction('participants')}
          >
            <Users className="w-6 h-6" />
            <span className="text-sm">Add Participant</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2"
            onClick={() => handleQuickAction('samples')}
          >
            <TestTube className="w-6 h-6" />
            <span className="text-sm">Collect Sample</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2"
            onClick={() => handleQuickAction('surveys')}
          >
            <FileText className="w-6 h-6" />
            <span className="text-sm">Fill Survey</span>
          </Button>
        </div>
      </Card>

      {/* Current Assignments */}
      {assignments.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Current Assignments</h3>
          <div className="space-y-3">
            {assignments.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{item.assignment.assignmentType}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.assignment.completedCount} / {item.assignment.targetCount} completed
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">{Math.round(item.progress)}%</div>
                    <div className="text-xs text-muted-foreground">
                      {item.daysRemaining} days left
                    </div>
                  </div>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {recentActivity.slice(0, 8).map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-2 hover:bg-muted rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm">
                  {activity.operation} {activity.objectStore.replace('_', ' ')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleString()}
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(activity.syncStatus)}>
                {activity.syncStatus}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Offline Notice */}
      {!isOnline && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 text-orange-700">
            <WifiOff className="w-5 h-5" />
            <div>
              <h4 className="font-medium">Working Offline</h4>
              <p className="text-sm">
                All data is being saved locally. It will sync automatically when connection is restored.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
