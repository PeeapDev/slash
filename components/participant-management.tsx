"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"
// Removed admin-data-store - now using IndexedDB-first approach

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

export default function ParticipantManagement() {
  const [participants, setParticipants] = useState([])
  const [households, setHouseholds] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState(null)
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
      
      const localParticipants = await offlineDB.getAll('participants')
      console.log(`✅ Loaded ${localParticipants.length} participants from IndexedDB`)
      setParticipants(localParticipants)
      
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
      
      const localHouseholds = await offlineDB.getAll('households')
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

  // INDEXEDDB-FIRST: Add participant to IndexedDB + Sync Queue
  const handleAddParticipant = async (formData) => {
    try {
      console.log('👥 Creating new participant in IndexedDB...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()

      const newParticipant = {
        id: `PART_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participantCode: formData.participantCode || `PART-${Date.now()}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        householdId: formData.householdId,
        relationshipToHead: formData.relationshipToHead || 'member',
        occupation: formData.occupation,
        education: formData.education,
        status: formData.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
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
  const handleUpdateParticipant = async (id, formData) => {
    try {
      console.log(`👥 Updating participant ${id} in IndexedDB...`)
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()

      const updatedData = {
        ...formData,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending'
      }

      await offlineDB.update('participants', id, updatedData)
      console.log('✅ Participant updated in IndexedDB + added to sync queue')
      
      await loadParticipants() // Refresh from IndexedDB
      setEditingParticipant(null)
    } catch (error) {
      console.error('❌ Error updating participant:', error)
    }
  }

  // INDEXEDDB-FIRST: Delete participant from IndexedDB + Sync Queue
  const handleDeleteParticipant = async (id) => {
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

  const filteredParticipants = participants.filter((p) => {
    const householdMatch = filterHousehold === "all" || p.householdId === filterHousehold
    return householdMatch
  })

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
            {households.map((h) => (
              <option key={h.id} value={h.id}>
                {h.id} - {h.headName}
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
                filteredParticipants.map((participant) => (
                  <tr key={participant.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-6 font-mono text-xs font-medium">{participant.id}</td>
                    <td className="py-4 px-6 font-medium">{participant.name}</td>
                    <td className="py-4 px-6">{participant.age}</td>
                    <td className="py-4 px-6 capitalize">{participant.sex}</td>
                    <td className="py-4 px-6">{participant.relationship}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          participant.consent ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {participant.consent ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">{participant.householdId}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
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
                  </tr>
                ))
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

function ParticipantFormModal({ participant, households, onSave, onClose }) {
  // Get selected household details for participant count tracking
  const [selectedHousehold, setSelectedHousehold] = useState(null)
  const [participantCount, setParticipantCount] = useState({ expected: 0, registered: 0 })
  
  const [formData, setFormData] = useState(
    participant ? {
      householdId: participant.householdId || "",
      name: participant.name || participant.firstName + " " + (participant.lastName || ""),
      age: participant.age || 0,
      sex: participant.sex || participant.gender || "male",
      relationship: participant.relationship || participant.relationshipToHead || "",
      consent: participant.consent !== undefined ? participant.consent : true,
      projectId: participant.projectId || "",
    } : {
      householdId: "",
      name: "",
      age: 0,
      sex: "male",
      relationship: "",
      consent: true,
      projectId: "",
    },
  )
  
  // Load participant count when household is selected
  useEffect(() => {
    const loadParticipantCount = async () => {
      if (formData.householdId) {
        try {
          const household = households.find(h => h.id === formData.householdId)
          setSelectedHousehold(household)
          
          if (household) {
            const { offlineDB } = await import('@/lib/offline-first-db')
            await offlineDB.init()
            
            // Get all participants for this household
            const allParticipants = await offlineDB.getAll('participants')
            const householdParticipants = allParticipants.filter(p => p.householdId === formData.householdId)
            
            setParticipantCount({
              expected: household.totalMembers || 0,
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

  const handleSubmit = (e) => {
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
              required
              value={formData.householdId}
              onChange={(e) => setFormData({ ...formData, householdId: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg"
            >
              <option value="">Select Household</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.householdId} - {h.headName}
                </option>
              ))}
            </select>
            
            {/* Participant Count Tracking */}
            {selectedHousehold && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">
                  📊 Household: {selectedHousehold.headName}
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
                    <div className={`text-lg font-bold ${participantCount.expected - participantCount.registered > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {participantCount.expected - participantCount.registered}
                    </div>
                    <div className={`text-xs ${participantCount.expected - participantCount.registered > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {participantCount.expected - participantCount.registered > 0 ? 'Missing' : 'Complete'}
                    </div>
                  </div>
                </div>
                {participantCount.expected - participantCount.registered > 0 && (
                  <div className="mt-2 text-xs text-orange-700">
                    ⚠️ This household still needs {participantCount.expected - participantCount.registered} more participant(s)
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
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
              <label className="block text-sm font-medium mb-2">Sex</label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
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
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
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
              checked={formData.consent}
              onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
              className="w-4 h-4 border border-border rounded"
            />
            <label htmlFor="consent" className="text-sm font-medium">
              Participant consent obtained
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Participant</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
