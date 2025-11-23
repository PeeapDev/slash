"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TestTube,
  Users,
  BarChart3,
  Search,
  Plus,
  Filter,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Beaker,
  Microscope,
  ArrowLeft
} from "lucide-react"
import DynamicSampleForm from "./dynamic-sample-form"

interface Sample {
  id: string
  sample_id: string
  sample_type_code: string
  sample_type_name: string
  status: string
  participant_name: string
  household_id: string
  region: string
  district: string
  collection_date: string
  collected_by_name: string
  volume_collected: number
  lab_results?: any
}

interface SampleStats {
  total_samples: number
  not_collected: number
  collected: number
  in_transit: number
  lab_pending: number
  lab_completed: number
  rejected: number
  urine_samples: number
  blood_samples: number
}

export default function SampleManagementDashboard() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [stats, setStats] = useState<SampleStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sampleTypeFilter, setSampleTypeFilter] = useState('')
  const [showNewSampleForm, setShowNewSampleForm] = useState(false)

  // Mock user context - in real app, get from auth
  const currentUser = {
    id: 'user-123',
    role: 'superadmin', // Can be: field_collector, lab_technician, supervisor, regional_head, ai_data_manager, superadmin
    regionId: 'western',
    districtId: 'freetown'
  }

  // Load samples based on user role
  const loadSamples = async () => {
    setIsLoading(true)
    try {
      // OFFLINE-FIRST: Load samples from IndexedDB
      console.log('🧪 Loading samples from IndexedDB...')
      
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const localSamples = await offlineDB.getAll('samples')
      console.log(`✅ Loaded ${localSamples.length} samples from IndexedDB`)
      
      // Format for dashboard compatibility
      const formattedSamples = localSamples.map((s: any) => ({
        id: s.id,
        participantId: s.participantId,
        sampleCode: s.sampleCode,
        sampleType: s.sampleType,
        status: s.status || 'collected',
        collectedAt: s.collectionTimestamp || s.createdAt,
        collectedBy: s.collectorId,
        syncStatus: s.syncStatus
      }))
      
      setSamples(formattedSamples)
      
      if (localSamples.length === 0) {
        console.log('ℹ️ No samples found in IndexedDB - collect samples to see them here')
      }
    } catch (error) {
      console.error('❌ Error loading samples from IndexedDB:', error)
      setSamples([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load dashboard statistics from IndexedDB
  const loadStats = async () => {
    try {
      // OFFLINE-FIRST: Calculate stats from IndexedDB samples
      console.log('📊 Calculating sample statistics from IndexedDB...')
      
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const localSamples = await offlineDB.getAll('samples')
      
      const stats = {
        totalSamples: localSamples.length,
        pendingSamples: localSamples.filter((s: any) => s.syncStatus === 'pending').length,
        completedSamples: localSamples.filter((s: any) => s.status === 'completed' || s.syncStatus === 'synced').length,
        rejectedSamples: localSamples.filter((s: any) => s.status === 'rejected').length
      }
      
      setStats(stats)
      console.log('✅ Sample statistics calculated:', stats)
    } catch (error) {
      console.error('❌ Error calculating stats from IndexedDB:', error)
    }
  }

  useEffect(() => {
    loadSamples()
    loadStats()
  }, [statusFilter, sampleTypeFilter])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm || !searchTerm) {
        loadSamples()
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const getStatusColor = (status: string) => {
    const colors = {
      'not_collected': 'bg-gray-100 text-gray-700',
      'collected': 'bg-blue-100 text-blue-700',
      'in_transit': 'bg-yellow-100 text-yellow-700',
      'lab_pending': 'bg-orange-100 text-orange-700',
      'lab_completed': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      'not_collected': <Clock className="w-4 h-4" />,
      'collected': <TestTube className="w-4 h-4" />,
      'in_transit': <Clock className="w-4 h-4" />,
      'lab_pending': <Beaker className="w-4 h-4" />,
      'lab_completed': <CheckCircle className="w-4 h-4" />,
      'rejected': <XCircle className="w-4 h-4" />
    }
    return icons[status as keyof typeof icons] || <Clock className="w-4 h-4" />
  }

  const handleStatusUpdate = async (sampleId: string, newStatus: string) => {
    try {
      // OFFLINE-FIRST: Update sample in IndexedDB + Sync Queue
      console.log(`🔄 Updating sample status: ${sampleId} -> ${newStatus}`)
      
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      // Update sample in IndexedDB
      const existingSample = await offlineDB.getById('samples', sampleId)
      if (existingSample) {
        const updatedSample = {
          ...existingSample,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending' // Mark for sync to cloud
        }
        
        await offlineDB.update('samples', sampleId, updatedSample)
        console.log('✅ Sample updated in IndexedDB + added to sync queue')
        
        // Refresh data from IndexedDB
        loadSamples()
        loadStats()
      }
    } catch (error) {
      console.error('❌ Error updating sample status:', error)
    }
  }

  const renderRoleSpecificActions = (sample: Sample) => {
    switch (currentUser.role) {
      case 'field_collector':
        return sample.status === 'not_collected' ? (
          <Button 
            size="sm" 
            onClick={() => handleStatusUpdate(sample.id, 'collected')}
          >
            Mark Collected
          </Button>
        ) : null

      case 'lab_technician':
        return sample.status === 'collected' ? (
          <Button 
            size="sm" 
            onClick={() => handleStatusUpdate(sample.id, 'lab_pending')}
          >
            Receive Sample
          </Button>
        ) : sample.status === 'lab_pending' ? (
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleStatusUpdate(sample.id, 'lab_completed')}
            >
              Complete
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleStatusUpdate(sample.id, 'rejected')}
            >
              Reject
            </Button>
          </div>
        ) : null

      default:
        return (
          <Button size="sm" variant="outline">
            View Details
          </Button>
        )
    }
  }

  const handleNewSampleSubmit = (sampleData: any) => {
    console.log('New sample created:', sampleData)
    setShowNewSampleForm(false)
    // Refresh the samples list
    loadSamples()
    loadStats()
  }

  const handleCancelNewSample = () => {
    setShowNewSampleForm(false)
  }

  // Show new sample form if requested
  if (showNewSampleForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleCancelNewSample}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <h2 className="text-xl font-semibold">Create New Sample</h2>
        </div>
        
        <DynamicSampleForm 
          onSubmit={handleNewSampleSubmit}
          onCancel={handleCancelNewSample}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TestTube className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Sample Management</h1>
          <Badge className="bg-blue-100 text-blue-700">
            {currentUser.role.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          {(currentUser.role === 'field_collector' || currentUser.role === 'superadmin') && (
            <Button onClick={() => setShowNewSampleForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Sample
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Samples</p>
                <p className="text-2xl font-bold">{stats.total_samples}</p>
              </div>
              <TestTube className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-2xl font-bold text-green-600">{stats.collected}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lab Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lab_pending}</p>
              </div>
              <Beaker className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.lab_completed}</p>
              </div>
              <Microscope className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by Sample ID, Household ID, or Participant name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select 
              className="px-3 py-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="not_collected">Not Collected</option>
              <option value="collected">Collected</option>
              <option value="in_transit">In Transit</option>
              <option value="lab_pending">Lab Pending</option>
              <option value="lab_completed">Lab Completed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select 
              className="px-3 py-2 border rounded-md"
              value={sampleTypeFilter}
              onChange={(e) => setSampleTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="URINE">Urine</option>
              <option value="BLOOD">Blood</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Sample List */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold">Sample Collection Records</h3>
          <p className="text-sm text-muted-foreground">
            {samples.length} samples found
          </p>
        </div>

        <div className="divide-y">
          {samples.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <TestTube className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No samples found matching your criteria</p>
            </div>
          ) : (
            samples.map((sample) => (
              <div key={sample.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {sample.sample_id}
                      </div>
                      <Badge className={getStatusColor(sample.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(sample.status)}
                          {sample.status.replace('_', ' ')}
                        </div>
                      </Badge>
                      <Badge variant="outline">
                        {sample.sample_type_name}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Participant</p>
                        <p className="font-medium">{sample.participant_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Household</p>
                        <p className="font-medium">{sample.household_id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="font-medium">{sample.district}, {sample.region}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Collected By</p>
                        <p className="font-medium">{sample.collected_by_name || 'Not collected'}</p>
                      </div>
                    </div>

                    {sample.volume_collected && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Volume: </span>
                        <span className="font-medium">{sample.volume_collected} mL</span>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    {renderRoleSpecificActions(sample)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
