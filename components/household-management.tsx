"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, Eye } from "lucide-react"
import { SIERRA_LEONE_REGIONS, getDistrictsByRegion } from "@/lib/sierra-leone-regions"

// TypeScript interfaces
interface Household {
  id: string
  householdId: string
  headName: string
  region: string
  district: string
  address?: string
  gpsCoordinates?: string
  totalMembers: number
  projectId: string
  status: 'active' | 'inactive'
  numParticipants?: number
  numSamplesUrine?: number
  numSamplesBlood?: number
  assignedCollector?: string
  supervisorId?: string
  notes?: string
  createdAt: string
  updatedAt: string
  syncStatus: 'pending' | 'synced'
  version: number
}

interface Project {
  id: string
  name: string
  projectCode?: string
}

interface Region {
  id: string
  name: string
}

interface FormData {
  headName: string
  region: string
  district: string
  address: string
  gpsCoordinates: string
  projectId: string
  totalMembers: number
  numParticipants: number
  numSamplesUrine: number
  numSamplesBlood: number
  status: 'active' | 'inactive'
  assignedCollector: string
  supervisorId: string
  notes: string
}

interface HouseholdFormModalProps {
  household: Household | null
  projects: Project[]
  regions: Region[]
  onSave: (data: FormData) => void
  onClose: () => void
}

export default function HouseholdManagement() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null)
  const [filterProject, setFilterProject] = useState("all")
  const [filterRegion, setFilterRegion] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [userRole, setUserRole] = useState("superadmin")

  useEffect(() => {
    loadHouseholds()
    loadProjects()
    loadCurrentUser()
    setRegions(SIERRA_LEONE_REGIONS)
  }, [])

  // INDEXEDDB-FIRST: Load households from IndexedDB
  const loadHouseholds = async () => {
    try {
      console.log('🏠 Loading households from IndexedDB...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const localHouseholds = await offlineDB.getAll('households')
      console.log(`✅ Loaded ${localHouseholds.length} households from IndexedDB`)
      setHouseholds(localHouseholds)
      
      if (localHouseholds.length === 0) {
        console.log('ℹ️ No households found in IndexedDB - create households to see them here')
      }
    } catch (error) {
      console.error('❌ Error loading households from IndexedDB:', error)
      setHouseholds([])
    }
  }

  // INDEXEDDB-FIRST: Load projects from IndexedDB
  const loadProjects = async () => {
    try {
      console.log('📊 Loading projects for household dropdown...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const localProjects = await offlineDB.getAll('project_metadata')
      console.log(`✅ Loaded ${localProjects.length} projects from IndexedDB`)
      
      // Map IndexedDB project_metadata structure to Project interface
      const formattedProjects = localProjects.map((project: any) => ({
        id: project.projectId || project.id,
        name: project.projectName || project.name,
        projectCode: project.projectCode || project.code
      }))
      
      setProjects(formattedProjects)
      
      if (localProjects.length === 0) {
        console.log('ℹ️ No projects found - create projects first to assign households')
      }
    } catch (error) {
      console.error('❌ Error loading projects from IndexedDB:', error)
      setProjects([])
    }
  }

  // INDEXEDDB-FIRST: Load current user from IndexedDB
  const loadCurrentUser = async () => {
    try {
      console.log('👤 Loading current user from IndexedDB...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      // Try to get user from settings store
      const userSettings = await offlineDB.getAll('settings')
      const currentUserSetting = userSettings.find(s => s.key === 'current_user')
      
      if (currentUserSetting && currentUserSetting.value) {
        setUserRole(currentUserSetting.value.role || 'superadmin')
        console.log(`✅ Loaded user role: ${currentUserSetting.value.role}`)
      } else {
        // Default to superadmin if no user found
        setUserRole('superadmin')
        console.log('ℹ️ No current user found in IndexedDB - defaulting to superadmin')
        
        // Optionally create default user in IndexedDB
        const defaultUser = {
          id: 'current_user',
          key: 'current_user',
          value: { 
            role: 'superadmin', 
            email: 'admin@localhost',
            id: 'user_admin'
          },
          category: 'auth',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'local' as const,
          version: 1
        }
        
        await offlineDB.create('settings', defaultUser)
        console.log('✅ Created default superadmin user in IndexedDB')
      }
    } catch (error) {
      console.error('❌ Error loading current user from IndexedDB:', error)
      setUserRole('superadmin') // Fallback
    }
  }

  // INDEXEDDB-FIRST: Add household to IndexedDB + Sync Queue
  const handleAddHousehold = async (formData: FormData) => {
    try {
      console.log('🏠 Creating new household in IndexedDB...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()

      const newHousehold: Household = {
        id: `HH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        householdId: `HH-${Date.now()}`,
        headName: formData.headName,
        region: formData.region,
        district: formData.district,
        address: formData.address,
        gpsCoordinates: formData.gpsCoordinates,
        totalMembers: formData.totalMembers || 0,
        projectId: formData.projectId,
        status: formData.status || 'active',
        numParticipants: formData.numParticipants || 0,
        numSamplesUrine: formData.numSamplesUrine || 0,
        numSamplesBlood: formData.numSamplesBlood || 0,
        assignedCollector: formData.assignedCollector,
        supervisorId: formData.supervisorId,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
        version: 1
      }

      await offlineDB.create('households', newHousehold)
      console.log('✅ Household created in IndexedDB + added to sync queue')
      
      await loadHouseholds() // Refresh from IndexedDB
      setShowForm(false)
    } catch (error) {
      console.error('❌ Error creating household:', error)
    }
  }

  // INDEXEDDB-FIRST: Update household in IndexedDB + Sync Queue
  const handleUpdateHousehold = async (id: string, formData: FormData) => {
    try {
      console.log(`🏠 Updating household ${id} in IndexedDB...`)
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()

      const updatedData = {
        ...formData,
        totalMembers: formData.totalMembers || 0,
        numParticipants: formData.numParticipants || 0,
        numSamplesUrine: formData.numSamplesUrine || 0,
        numSamplesBlood: formData.numSamplesBlood || 0,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const
      }

      await offlineDB.update('households', id, updatedData)
      console.log('✅ Household updated in IndexedDB + added to sync queue')
      
      await loadHouseholds() // Refresh from IndexedDB
      setEditingHousehold(null)
    } catch (error) {
      console.error('❌ Error updating household:', error)
    }
  }

  // INDEXEDDB-FIRST: Delete household from IndexedDB + Sync Queue
  const handleDeleteHousehold = async (id: string) => {
    if (confirm("Are you sure you want to delete this household?")) {
      try {
        console.log(`🏠 Deleting household ${id} from IndexedDB...`)
        const { offlineDB } = await import('@/lib/offline-first-db')
        await offlineDB.init()

        await offlineDB.delete('households', id)
        console.log('✅ Household deleted from IndexedDB + added to sync queue')
        
        await loadHouseholds() // Refresh from IndexedDB
      } catch (error) {
        console.error('❌ Error deleting household:', error)
      }
    }
  }

  const filteredHouseholds = households.filter((h: Household) => {
    const projectMatch = filterProject === "all" || h.projectId === filterProject
    const regionMatch = filterRegion === "all" || h.region === filterRegion
    const statusMatch = filterStatus === "all" || h.status === filterStatus
    return projectMatch && regionMatch && statusMatch
  })

  const canEdit = ["superadmin", "regional_head", "supervisor"].includes(userRole)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / Households</div>
          <h1 className="text-2xl font-bold mt-1">Household Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage survey households and participant data</p>
        </div>
        {canEdit && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            Add Household
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-sm font-medium block mb-2">Project</label>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="all">All Projects</option>
            {projects.map((p: Project) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Region</label>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="all">All Regions</option>
            {regions.map((r: Region) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Households Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-6 font-semibold">Household ID</th>
                <th className="text-left py-3 px-6 font-semibold">Head Name</th>
                <th className="text-left py-3 px-6 font-semibold">Region / District</th>
                <th className="text-center py-3 px-6 font-semibold">Participants</th>
                <th className="text-center py-3 px-6 font-semibold">Samples</th>
                <th className="text-left py-3 px-6 font-semibold">Status</th>
                <th className="text-left py-3 px-6 font-semibold">Project</th>
                <th className="text-center py-3 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHouseholds.length > 0 ? (
                filteredHouseholds.map((household: Household) => (
                  <tr key={household.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-6 font-mono text-xs font-medium">{household.householdId}</td>
                    <td className="py-4 px-6 font-medium">{household.headName}</td>
                    <td className="py-4 px-6 text-sm">
                      {household.region} / {household.district}
                    </td>
                    <td className="py-4 px-6 text-center font-medium">{household.numParticipants || 0}</td>
                    <td className="py-4 px-6 text-center text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        U: {household.numSamplesUrine || 0} B: {household.numSamplesBlood || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          household.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {household.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      {projects.find((p: Project) => p.id === household.projectId)?.name || household.projectId}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <>
                            <button
                              onClick={() => setEditingHousehold(household)}
                              className="p-1 hover:bg-muted rounded"
                              title="Edit household"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteHousehold(household.id)}
                              className="p-1 hover:bg-muted rounded"
                              title="Delete household"
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </button>
                          </>
                        )}
                        <button className="p-1 hover:bg-muted rounded" title="View details">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 px-6 text-center text-muted-foreground">
                    No households found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Household Form Modal */}
      {(showForm || editingHousehold) && (
        <HouseholdFormModal
          household={editingHousehold}
          projects={projects}
          regions={regions}
          onSave={(data) => {
            if (editingHousehold) {
              handleUpdateHousehold(editingHousehold.id, data)
            } else {
              handleAddHousehold(data)
            }
          }}
          onClose={() => {
            setShowForm(false)
            setEditingHousehold(null)
          }}
        />
      )}
    </div>
  )
}

function HouseholdFormModal({ household, projects, regions, onSave, onClose }: HouseholdFormModalProps) {
  const [formData, setFormData] = useState<FormData>(
    household ? {
      headName: household.headName,
      region: household.region,
      district: household.district,
      address: household.address || "",
      gpsCoordinates: household.gpsCoordinates || "",
      projectId: household.projectId,
      totalMembers: household.totalMembers,
      numParticipants: household.numParticipants || 0,
      numSamplesUrine: household.numSamplesUrine || 0,
      numSamplesBlood: household.numSamplesBlood || 0,
      status: household.status,
      assignedCollector: household.assignedCollector || "",
      supervisorId: household.supervisorId || "",
      notes: household.notes || "",
    } : {
      headName: "",
      region: "",
      district: "",
      address: "",
      gpsCoordinates: "",
      projectId: "",
      totalMembers: 0,
      numParticipants: 0,
      numSamplesUrine: 0,
      numSamplesBlood: 0,
      status: "active" as const,
      assignedCollector: "",
      supervisorId: "",
      notes: "",
    },
  )

  const districts = formData.region ? getDistrictsByRegion(formData.region) : []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">{household ? "Edit Household" : "Add New Household"}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Head of Household Name</label>
              <input
                type="text"
                required
                value={formData.headName}
                onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Project</label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="">Select Project</option>
                {projects.map((p: Project) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Region</label>
              <select
                required
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value, district: "" })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="">Select Region</option>
                {regions.map((r: Region) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">District</label>
              <select
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
                disabled={!formData.region}
              >
                <option value="">Select District</option>
                {districts.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address / GPS Coordinates</label>
            <input
              type="text"
              placeholder="e.g., 12.345, -67.890"
              value={formData.gpsCoordinates}
              onChange={(e) => setFormData({ ...formData, gpsCoordinates: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Participants</label>
              <input
                type="number"
                min="0"
                value={formData.totalMembers}
                onChange={(e) => setFormData({ ...formData, totalMembers: parseInt(e.target.value) || 0, numParticipants: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Urine Samples</label>
              <input
                type="number"
                min="0"
                value={formData.numSamplesUrine}
                onChange={(e) => setFormData({ ...formData, numSamplesUrine: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Blood Samples</label>
              <input
                type="number"
                min="0"
                value={formData.numSamplesBlood}
                onChange={(e) => setFormData({ ...formData, numSamplesBlood: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg h-20 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Household</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
