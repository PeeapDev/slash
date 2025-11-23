"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, UserPlus } from "lucide-react"
import type { Participant, Household } from "@/lib/offline-first-db"
import { motion } from "framer-motion"

// Predefined relationship options for analytics and consistency
const RELATIONSHIP_OPTIONS = [
  { value: 'head', label: 'Head of Household' },
  { value: 'spouse', label: 'Spouse/Partner' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'relative', label: 'Other Relative' },
  { value: 'non_relative', label: 'Non-Relative' },
  { value: 'other', label: 'Other' }
]

interface ParticipantFormData {
  householdId: string
  fullName: string
  age: number
  gender: 'male' | 'female' | 'other'
  relationToHead: string
  consentGiven: boolean
  projectId: string
  occupation?: string
  education?: string
}

// Helper to format household display in dropdown
const formatHouseholdDisplay = (h: any) => {
  const name = h.headOfHousehold || h.headName || 'Unknown'
  // Check address field first, fallback to gpsCoordinates for old data
  const address = h.address || h.gpsCoordinates || 'No address'
  const district = h.district || 'Unknown'
  const id = h.householdId || h.id
  return `${name} - ${address} in ${district} - ${id}`
}

export default function ParticipantManagement() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [households, setHouseholds] = useState<Household[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [filterHousehold, setFilterHousehold] = useState("all")

  useEffect(() => {
    loadParticipants()
    loadHouseholds()
  }, [])

  // INDEXEDDB-FIRST: Load participants from IndexedDB
  const loadParticipants = async () => {
    try {
      console.log('👥 Loading participants from IndexedDB...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const localParticipants = await offlineDB.getAll('participants') as Participant[]
      console.log(`✅ Loaded ${localParticipants.length} participants from IndexedDB`)
      console.log('📋 Sample participant data:', localParticipants[0])
      
      // Fix any participants missing critical fields (data migration)
      let migrationNeeded = false
      const fixedParticipants = localParticipants.map((p: any) => {
        let fixed = { ...p }
        let needsUpdate = false
        
        // Fix missing participantId
        if (!fixed.participantId && fixed.id) {
          fixed.participantId = `PID-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
          needsUpdate = true
          console.log(`🔧 Fixed missing participantId for ${fixed.fullName}`)
        }
        
        // Fix missing gender (default to male if not set)
        if (!fixed.gender) {
          fixed.gender = 'male'
          needsUpdate = true
          console.log(`🔧 Fixed missing gender for ${fixed.fullName}`)
        }
        
        if (needsUpdate) {
          migrationNeeded = true
          // Update in IndexedDB
          offlineDB.update('participants', fixed.id, fixed).catch(err => 
            console.error('Error updating participant:', err)
          )
        }
        
        return fixed
      })
      
      if (migrationNeeded) {
        console.log('✅ Data migration completed - fixed missing fields')
      }
      
      setParticipants(fixedParticipants)
      
      if (localParticipants.length === 0) {
        console.log('ℹ️ No participants found in IndexedDB - create participants to see them here')
      }
    } catch (error) {
      console.error('❌ Error loading participants from IndexedDB:', error)
      setParticipants([])
    }
  }

  // INDEXEDDB-FIRST: Load households from IndexedDB  
  const loadHouseholds = async () => {
    try {
      console.log('🏠 Loading households for participant dropdown...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const localHouseholds = await offlineDB.getAll('households') as Household[]
      console.log(`✅ Loaded ${localHouseholds.length} households from IndexedDB`)
      setHouseholds(localHouseholds)
      
      if (localHouseholds.length === 0) {
        console.log('ℹ️ No households found - create households first to assign participants')
      }
    } catch (error) {
      console.error('❌ Error loading households from IndexedDB:', error)
      setHouseholds([])
    }
  }

  // Check for duplicate participants in same household
  const checkDuplicateParticipant = async (householdId: string, fullName: string, age: number): Promise<boolean> => {
    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const allParticipants = await offlineDB.getAll('participants') as Participant[]
      const duplicates = allParticipants.filter((p: Participant) => 
        p.householdId === householdId && 
        p.fullName.toLowerCase() === fullName.toLowerCase() && 
        p.age === age
      )
      
      return duplicates.length > 0
    } catch (error) {
      console.error('Error checking duplicates:', error)
      return false
    }
  }

  // INDEXEDDB-FIRST: Add participant to IndexedDB + Sync Queue
  const handleAddParticipant = async (formData: ParticipantFormData) => {
    try {
      console.log('👥 Creating new participant in IndexedDB...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()

      // Check for duplicates
      const isDuplicate = await checkDuplicateParticipant(formData.householdId, formData.fullName, formData.age)
      if (isDuplicate) {
        alert('⚠️ A participant with the same name and age already exists in this household. Please verify the information.')
        return
      }

      const newParticipant: Participant = {
        id: `PART_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participantId: `PID-${Date.now()}`,
        householdId: formData.householdId,
        fullName: formData.fullName,
        age: formData.age,
        gender: formData.gender,
        relationToHead: formData.relationToHead,
        occupation: formData.occupation,
        education: formData.education,
        consentGiven: formData.consentGiven,
        consentDate: formData.consentGiven ? new Date().toISOString() : undefined,
        projectId: formData.projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deviceId: 'web_app',
        collectorId: 'current_user',
        syncStatus: 'pending' as const,
        version: 1
      }

      await offlineDB.create('participants', newParticipant)
      console.log('✅ Participant created in IndexedDB + added to sync queue')
      
      await loadParticipants() // Refresh from IndexedDB
      setShowForm(false)
    } catch (error) {
      console.error('❌ Error creating participant:', error)
    }
  }

  // INDEXEDDB-FIRST: Update participant in IndexedDB + Sync Queue
  const handleUpdateParticipant = async (id: string, formData: ParticipantFormData) => {
    try {
      console.log(`👥 Updating participant ${id} in IndexedDB...`)
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()

      const existingParticipant = await offlineDB.getById('participants', id) as Participant
      
      const updatedParticipant: Participant = {
        ...existingParticipant,
        fullName: formData.fullName,
        age: formData.age,
        gender: formData.gender,
        relationToHead: formData.relationToHead,
        occupation: formData.occupation,
        education: formData.education,
        consentGiven: formData.consentGiven,
        householdId: formData.householdId,
        projectId: formData.projectId,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const,
        version: (existingParticipant.version || 1) + 1
      }

      await offlineDB.update('participants', id, updatedParticipant)
      console.log('✅ Participant updated in IndexedDB + added to sync queue')
      
      await loadParticipants() // Refresh from IndexedDB
      setEditingParticipant(null)
    } catch (error) {
      console.error('❌ Error updating participant:', error)
    }
  }

  // INDEXEDDB-FIRST: Delete participant from IndexedDB + Sync Queue
  const handleDeleteParticipant = async (id: string) => {
    if (confirm("Are you sure you want to delete this participant?")) {
      try {
        console.log(`👥 Deleting participant ${id} from IndexedDB...`)
        const { offlineDB } = await import('@/lib/offline-first-db')
        await offlineDB.init()

        await offlineDB.delete('participants', id)
        console.log('✅ Participant deleted from IndexedDB + added to sync queue')
        
        await loadParticipants() // Refresh from IndexedDB
      } catch (error) {
        console.error('❌ Error deleting participant:', error)
      }
    }
  }

  const filteredParticipants = participants.filter((p: Participant) => {
    const householdMatch = filterHousehold === "all" || p.householdId === filterHousehold
    return householdMatch
  })

  // Helper to get household name by ID
  const getHouseholdName = (householdId: string) => {
    const household = households.find(h => h.id === householdId) as any
    if (!household) return householdId
    // Handle both database schema (headOfHousehold) and component interface (headName)
    return household.headOfHousehold || household.headName || householdId
  }
  
  // Helper to check if household is complete
  const isHouseholdComplete = (householdId: string) => {
    const household = households.find(h => h.id === householdId) as any
    if (!household) return false
    
    const expected = household.familySize || household.totalMembers || 0
    const registered = participants.filter(p => p.householdId === householdId).length
    
    return expected > 0 && registered >= expected
  }
  
  // Helper to get participant count for household
  const getHouseholdParticipantCount = (householdId: string) => {
    const household = households.find(h => h.id === householdId) as any
    const expected = household?.familySize || household?.totalMembers || 0
    const registered = participants.filter(p => p.householdId === householdId).length
    return { expected, registered }
  }
  
  // Quick add participant to household
  const handleQuickAdd = (householdId: string) => {
    setEditingParticipant(null)
    setShowForm(true)
    // Pre-fill household in form
    setTimeout(() => {
      const formElement = document.querySelector('select[name="householdId"]') as HTMLSelectElement
      if (formElement) {
        formElement.value = householdId
        formElement.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }, 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / Participants</div>
          <h1 className="text-2xl font-bold mt-1">Participant Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage survey participants and consent tracking</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add Participant
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-sm font-medium block mb-2">Household</label>
          <select
            value={filterHousehold}
            onChange={(e) => setFilterHousehold(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="all">All Households</option>
            {households.map((h: Household) => (
              <option key={h.id} value={h.id}>
                {formatHouseholdDisplay(h)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-6 font-semibold">Participant ID</th>
                <th className="text-left py-3 px-6 font-semibold">Name</th>
                <th className="text-left py-3 px-6 font-semibold">Age</th>
                <th className="text-left py-3 px-6 font-semibold">Sex</th>
                <th className="text-left py-3 px-6 font-semibold">Relationship</th>
                <th className="text-left py-3 px-6 font-semibold">Consent</th>
                <th className="text-left py-3 px-6 font-semibold">Household</th>
                <th className="text-center py-3 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((participant: Participant) => {
                  const householdComplete = isHouseholdComplete(participant.householdId)
                  const count = getHouseholdParticipantCount(participant.householdId)
                  
                  return (
                  <motion.tr 
                    key={participant.id} 
                    className="border-b border-border hover:bg-muted/50"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      backgroundColor: householdComplete ? 'transparent' : 'rgba(251, 146, 60, 0.05)'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <motion.div
                          className={`w-3 h-3 rounded-full ${
                            householdComplete ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          animate={{
                            scale: householdComplete ? 1 : [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: householdComplete ? 0 : Infinity,
                          }}
                        />
                        <span className="font-mono text-xs font-medium">{participant.participantId}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium">{participant.fullName}</td>
                    <td className="py-4 px-6">{participant.age}</td>
                    <td className="py-4 px-6 capitalize">{participant.gender}</td>
                    <td className="py-4 px-6 capitalize">{participant.relationToHead}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          participant.consentGiven ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {participant.consentGiven ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium">{getHouseholdName(participant.householdId)}</span>
                        <span className={`text-xs ${
                          householdComplete ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {count.registered}/{count.expected} participants
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!householdComplete && (
                          <button
                            onClick={() => handleQuickAdd(participant.householdId)}
                            className="p-1 hover:bg-green-100 rounded text-green-600"
                            title="Quick add participant to this household"
                          >
                            <UserPlus size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setEditingParticipant(participant)}
                          className="p-1 hover:bg-muted rounded"
                          title="Edit participant"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteParticipant(participant.id)}
                          className="p-1 hover:bg-muted rounded"
                          title="Delete participant"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 px-6 text-center text-muted-foreground">
                    No participants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Participant Form Modal */}
      {(showForm || editingParticipant) && (
        <ParticipantFormModal
          participant={editingParticipant}
          households={households}
          onSave={(data) => {
            if (editingParticipant) {
              handleUpdateParticipant(editingParticipant.id, data)
            } else {
              handleAddParticipant(data)
            }
          }}
          onClose={() => {
            setShowForm(false)
            setEditingParticipant(null)
          }}
        />
      )}
    </div>
  )
}

interface ParticipantFormModalProps {
  participant: Participant | null
  households: Household[]
  onSave: (data: ParticipantFormData) => void
  onClose: () => void
}

function ParticipantFormModal({ participant, households, onSave, onClose }: ParticipantFormModalProps) {
  // Get selected household details for participant count tracking
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)
  const [participantCount, setParticipantCount] = useState({ expected: 0, registered: 0 })
  
  const [formData, setFormData] = useState<ParticipantFormData>({
    householdId: participant?.householdId || "",
    fullName: participant?.fullName || "",
    age: participant?.age || 0,
    gender: participant?.gender || "male",
    relationToHead: participant?.relationToHead || "",
    consentGiven: participant?.consentGiven ?? true,
    projectId: participant?.projectId || "",
    occupation: participant?.occupation || "",
    education: participant?.education || "",
  })
  
  // Load participant count when household is selected
  useEffect(() => {
    const loadParticipantCount = async () => {
      if (formData.householdId) {
        try {
          const household = households.find(h => h.id === formData.householdId)
          setSelectedHousehold(household || null)
          
          if (household) {
            const { offlineDB } = await import('@/lib/offline-first-db')
            await offlineDB.init()
            
            // Get all participants for this household
            const allParticipants = await offlineDB.getAll('participants') as Participant[]
            const householdParticipants = allParticipants.filter((p: Participant) => p.householdId === formData.householdId)
            
            setParticipantCount({
              expected: (household as any).familySize || (household as any).totalMembers || 0,
              registered: householdParticipants.length
            })
          }
        } catch (error) {
          console.error('Error loading participant count:', error)
        }
      }
    }
    
    loadParticipantCount()
  }, [formData.householdId, households])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">{participant ? "Edit Participant" : "Add New Participant"}</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Household</label>
<select
              name="householdId"
              required
              value={formData.householdId}
              onChange={(e) => setFormData({ ...formData, householdId: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg"
            >
              <option value="">Select Household</option>
              {households.map((h: Household) => (
                <option key={h.id} value={h.id}>
                  {formatHouseholdDisplay(h)}
                </option>
              ))}
            </select>
            
            {/* Participant Count Tracking */}
            {selectedHousehold && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">
                  📊 Household: {(selectedHousehold as any).headOfHousehold || (selectedHousehold as any).headName}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{participantCount.expected}</div>
                    <div className="text-xs text-blue-600">Expected</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{participantCount.registered}</div>
                    <div className="text-xs text-green-600">Registered</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${participantCount.registered >= participantCount.expected ? 'text-green-600' : 'text-orange-600'}`}>
                      {Math.max(0, participantCount.expected - participantCount.registered)}
                    </div>
                    <div className={`text-xs ${participantCount.registered >= participantCount.expected ? 'text-green-600' : 'text-orange-600'}`}>
                      {participantCount.registered >= participantCount.expected ? 'Complete' : 'Remaining'}
                    </div>
                  </div>
                </div>
                {participantCount.registered < participantCount.expected && (
                  <div className="mt-2 text-xs text-orange-700">
                    ⚠️ This household still needs {participantCount.expected - participantCount.registered} more participant(s)
                  </div>
                )}
                {participantCount.registered >= participantCount.expected && participantCount.expected > 0 && (
                  <div className="mt-2 text-xs text-green-700">
                    ✅ All expected participants registered!
                  </div>
                )}
                {participantCount.expected === 0 && (
                  <div className="mt-2 text-xs text-red-700">
                    ⚠️ Warning: This household has no expected participant count set. Please update the household record.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="Enter participant's full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Age</label>
              <input
                type="number"
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number.parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Relationship to Head</label>
              <select
                required
                value={formData.relationToHead}
                onChange={(e) => setFormData({ ...formData, relationToHead: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="">Select Relationship</option>
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="consent"
              checked={formData.consentGiven}
              onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
              className="w-4 h-4 border border-border rounded"
            />
            <label htmlFor="consent" className="text-sm font-medium">
              Participant consent obtained
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Participant</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
