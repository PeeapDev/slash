"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Eye, Lock, CheckCircle } from "lucide-react"
import { generateId } from "@/lib/utils"
import { SIERRA_LEONE_REGIONS } from "@/lib/sierra-leone-regions"
import { ROLE_DEFINITIONS, TeamRole } from "@/lib/team-roles"
import { useToast } from "@/components/ui/use-toast"

export default function HRManagement() {
  const { toast } = useToast()
  const [staff, setStaff] = useState([])
  const [roles, setRoles] = useState([])
  const [regions, setRegions] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "" as 'male' | 'female' | 'other' | '',
    address: "",
    role: "",
    region: "",
    employmentType: "full-time",
  })

  useEffect(() => {
    loadStaff()
    loadRoles()
    setRegions(SIERRA_LEONE_REGIONS)
  }, [])

  // INDEXEDDB-FIRST: Load staff from team_members store
  const loadStaff = async () => {
    try {
      console.log('👥 Loading staff from team_members store...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      // Load from team_members store (dedicated store for staff)
      const teamMembers = await offlineDB.getAll('team_members')
      
      const formattedStaff = teamMembers.map((member: any) => ({
        id: member.id,
        name: member.fullName,
        email: member.email,
        phone: member.phone || '',
        role: member.role,
        region: member.regionId || null,
        district: member.districtId || null,
        status: member.isActive ? 'active' : 'inactive',
        employmentType: member.employmentStatus || 'active',
        joinDate: member.hireDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        password: member.defaultPassword || '',
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
      }))
      
      console.log(`✅ Loaded ${formattedStaff.length} staff members from team_members store`)
      setStaff(formattedStaff)
      
      if (formattedStaff.length === 0) {
        console.log('ℹ️ No staff found - create staff to see them here')
      }
    } catch (error) {
      console.error('❌ Error loading staff from IndexedDB:', error)
      setStaff([])
    }
  }

  // INDEXEDDB-FIRST: Load all 8 roles from team-roles library
  const loadRoles = async () => {
    try {
      console.log('👥 Loading all 8 roles from team-roles library...')
      // Use all roles from ROLE_DEFINITIONS
      const allRoles = (Object.keys(ROLE_DEFINITIONS) as TeamRole[]).map(roleKey => ({
        id: roleKey,
        name: ROLE_DEFINITIONS[roleKey].title,
        description: ROLE_DEFINITIONS[roleKey].description
      }))
      
      setRoles(allRoles)
      console.log(`✅ Loaded ${allRoles.length} roles from team-roles library`)
    } catch (error) {
      console.error('❌ Error loading roles:', error)
      setRoles([])
    }
  }

  // INDEXEDDB-FIRST: Add staff to team_members store with default password
  const handleAddStaff = async () => {
    if (formData.name && formData.email && formData.gender && formData.region && formData.role) {
      if ((formData.role === "supervisor" || formData.role === "regional_head") && !formData.region) {
        toast({
          title: "Region Required",
          description: "Supervisors and Regional Heads must be assigned to a region",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      try {
        console.log('👥 Creating new staff member in team_members store...')
        const { offlineDB } = await import('@/lib/offline-first-db')
        await offlineDB.init()

        // Default password is always "123456"
        const defaultPassword = "123456"

        const newStaffMember = {
          id: `TEAM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: `USER_${Date.now()}`,
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender || undefined,
          address: formData.address || undefined,
          role: formData.role,
          regionId: formData.region || undefined,
          districtId: undefined,
          teamId: undefined,
          supervisorId: undefined,
          isActive: true,
          employmentStatus: 'active',
          hireDate: new Date().toISOString(),
          lastActiveAt: undefined,
          defaultPassword: defaultPassword,
          permissions: ROLE_DEFINITIONS[formData.role as TeamRole].permissions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending' as const,
          version: 1,
          deviceId: 'admin',
          collectorId: 'admin'
        }

        await offlineDB.create('team_members', newStaffMember)
        console.log(`✅ Staff member created: ${formData.name}`)
        
        // Show success toast
        toast({
          title: "Staff Created Successfully!",
          description: `${formData.name} can now login with email or phone number using password: 123456`,
          variant: "default",
          duration: 5000,
        })
        
        await loadStaff() // Refresh from IndexedDB
        setFormData({
          name: "",
          email: "",
          phone: "",
          gender: "" as 'male' | 'female' | 'other' | '',
          address: "",
          role: "",
          region: "",
          employmentType: "full-time",
        })
        setShowForm(false)
      } catch (error) {
        console.error('❌ Error creating staff member:', error)
        toast({
          title: "Error Creating Staff",
          description: "Failed to create staff member. Please try again.",
          variant: "destructive",
          duration: 4000,
        })
      }
    } else {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Name, Email, Gender, Region, and Role.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // INDEXEDDB-FIRST: Delete staff from team_members store
  const handleDeleteStaff = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return
    
    try {
      console.log(`👥 Deleting staff ${id} from team_members store...`)
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()

      await offlineDB.delete('team_members', id)
      console.log('✅ Staff member deleted from team_members store')
      
      await loadStaff() // Refresh from IndexedDB
      setSelectedStaff(null)
    } catch (error) {
      console.error('❌ Error deleting staff member:', error)
    }
  }

  // INDEXEDDB-FIRST: Update staff status in team_members store
  const handleUpdateStatus = async (id, status) => {
    try {
      console.log(`👥 Updating staff ${id} status to ${status}...`)
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()

      // Get existing member data
      const existing = await offlineDB.get('team_members', id)
      if (existing) {
        const updated = {
          ...existing,
          isActive: status === 'active',
          employmentStatus: status,
          updatedAt: new Date().toISOString()
        }

        await offlineDB.update('team_members', id, updated)
        console.log('✅ Staff status updated in team_members store')
        
        await loadStaff() // Refresh from IndexedDB
        const allStaff = await offlineDB.getAll('team_members')
        const formattedStaff = allStaff.map((member: any) => ({
          id: member.id,
          name: member.fullName,
          email: member.email,
          phone: member.phone || '',
          role: member.role,
          region: member.regionId || null,
          status: member.isActive ? 'active' : 'inactive',
          employmentType: member.employmentStatus || 'active',
          joinDate: member.hireDate?.split('T')[0],
          password: member.defaultPassword || ''
        }))
        setSelectedStaff(formattedStaff.find((s: any) => s.id === id))
      }
    } catch (error) {
      console.error('❌ Error updating staff status:', error)
    }
  }

  const supervisors = staff.filter((s) => s.role === "supervisor")
  const fieldCollectors = staff.filter((s) => s.role === "field_collector")
  const labTechs = staff.filter((s) => s.role === "lab_technician")
  const regionalHeads = staff.filter((s) => s.role === "regional_head")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / HR</div>
          <h1 className="text-2xl font-bold mt-1">HR & Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage staff, roles, and assignments</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add Staff Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Staff</div>
            <div className="text-3xl font-bold mt-1 text-blue-700 dark:text-blue-300">{staff.length}</div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">Active</div>
            <div className="text-3xl font-bold mt-1 text-green-700 dark:text-green-300">{staff.filter((s) => s.status === "active").length}</div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Supervisors</div>
            <div className="text-3xl font-bold mt-1 text-purple-700 dark:text-purple-300">{supervisors.length}</div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Field Collectors</div>
            <div className="text-3xl font-bold mt-1 text-orange-700 dark:text-orange-300">{fieldCollectors.length}</div>
          </Card>
        </motion.div>
      </div>

      {/* Add Staff Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <h2 className="font-semibold mb-4 text-foreground">Add New Staff Member</h2>
          <div className="flex items-center gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Default password: <span className="font-mono font-bold">123456</span>
              <span className="text-xs block mt-1">Staff can login with email or phone number</span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-background text-foreground dark:bg-slate-800 dark:border-slate-600"
              required
            />
            <input
              type="email"
              placeholder="Email *"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-background text-foreground dark:bg-slate-800 dark:border-slate-600"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number (for login)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-background text-foreground dark:bg-slate-800 dark:border-slate-600"
            />
            
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
              className="px-3 py-2 border rounded-lg bg-background text-foreground dark:bg-slate-800 dark:border-slate-600"
              required
            >
              <option value="">Select Gender *</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-background text-foreground dark:bg-slate-800 dark:border-slate-600 md:col-span-2"
            />
            
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-background text-foreground dark:bg-slate-800 dark:border-slate-600"
              required
            >
              <option value="">Select Region *</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-background text-foreground dark:bg-slate-800 dark:border-slate-600"
              required
            >
              <option value="">Select Role *</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>

            {(formData.role === "supervisor" || formData.role === "regional_head") && (
              <div className="md:col-span-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-300">
                ℹ️ Note: Supervisors and Regional Heads require region assignment above
              </div>
            )}

            <select
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-background text-foreground dark:bg-slate-800 dark:border-slate-600"
            >
              <option value="full-time">Full-time</option>
              <option value="contract">Contract</option>
              <option value="part-time">Part-time</option>
            </select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddStaff} className="bg-green-600 hover:bg-green-700">
              Add Staff
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  role: "",
                  region: "",
                  employmentType: "full-time",
                })
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
        </motion.div>
      )}

      {/* Staff Table */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left py-3 px-6 font-semibold">Name</th>
              <th className="text-left py-3 px-6 font-semibold">Email</th>
              <th className="text-left py-3 px-6 font-semibold">Role</th>
              <th className="text-left py-3 px-6 font-semibold">Region</th>
              <th className="text-left py-3 px-6 font-semibold">Employment</th>
              <th className="text-center py-3 px-6 font-semibold">Status</th>
              <th className="text-center py-3 px-6 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-4 px-6 font-medium">{member.name}</td>
                <td className="py-4 px-6 text-muted-foreground text-xs">{member.email}</td>
                <td className="py-4 px-6">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {roles.find((r) => r.id === member.role)?.name || member.role}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm">
                  {member.region ? regions.find((r) => r.id === member.region)?.name : "-"}
                </td>
                <td className="py-4 px-6 text-sm capitalize">{member.employmentType}</td>
                <td className="py-4 px-6 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1 hover:bg-muted rounded" onClick={() => setSelectedStaff(member)}>
                      <Eye size={16} />
                    </button>
                    <button className="p-1 hover:bg-muted rounded" onClick={() => handleDeleteStaff(member.id)}>
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Staff Profile */}
      {selectedStaff && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Staff Profile: {selectedStaff.name}</h2>
            <Button variant="outline" onClick={() => setSelectedStaff(null)}>
              Close
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Email</label>
                <p className="font-medium">{selectedStaff.email}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Phone</label>
                <p className="font-medium">{selectedStaff.phone || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Role</label>
                <p className="font-medium">{roles.find((r) => r.id === selectedStaff.role)?.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Region</label>
                <p className="font-medium">
                  {selectedStaff.region ? regions.find((r) => r.id === selectedStaff.region)?.name : "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Employment Type</label>
                <p className="font-medium capitalize">{selectedStaff.employmentType}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Join Date</label>
                <p className="font-medium">{selectedStaff.joinDate}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Status</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedStaff.status === "active" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus(selectedStaff.id, "active")}
                  >
                    Active
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedStaff.status === "inactive" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus(selectedStaff.id, "inactive")}
                  >
                    Inactive
                  </Button>
                </div>
              </div>
              <div>
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  Reset Password
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
