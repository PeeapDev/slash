"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, Users, UserCheck, UserX, Search } from "lucide-react"
import { TeamRole, TeamMember, ROLE_DEFINITIONS, getRoleColor, getAvailableRolesForUser } from "@/lib/team-roles"

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole>('superadmin')
  const [filterRole, setFilterRole] = useState<TeamRole | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadTeamMembers()
    loadCurrentUserRole()
  }, [])

  const loadCurrentUserRole = async () => {
    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const settings = await offlineDB.getAll('settings') as any[]
      const userSetting = settings.find((s: any) => s.key === 'current_user')
      
      if (userSetting && userSetting.value && userSetting.value.role) {
        setCurrentUserRole(userSetting.value.role)
      }
    } catch (error) {
      console.error('Error loading user role:', error)
    }
  }

  const loadTeamMembers = async () => {
    try {
      console.log('👥 Loading team members from IndexedDB...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const members = await offlineDB.getAll('team_members') as TeamMember[]
      console.log(`✅ Loaded ${members.length} team members`)
      
      setTeamMembers(members)
    } catch (error) {
      console.error('❌ Error loading team members:', error)
      setTeamMembers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMember = () => {
    setEditingMember(null)
    setShowForm(true)
  }

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member)
    setShowForm(true)
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return
    
    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.delete('team_members', memberId)
      console.log(`✅ Deleted team member: ${memberId}`)
      loadTeamMembers()
    } catch (error) {
      console.error('❌ Error deleting team member:', error)
    }
  }

  const handleToggleStatus = async (member: TeamMember) => {
    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      const newStatus = member.isActive ? 'suspended' : 'active'
      
      await offlineDB.update('team_members', member.id, {
        ...member,
        isActive: !member.isActive,
        employmentStatus: newStatus,
        updatedAt: new Date().toISOString()
      })
      
      console.log(`✅ Updated member status: ${member.fullName}`)
      loadTeamMembers()
    } catch (error) {
      console.error('❌ Error updating member status:', error)
    }
  }

  const filteredMembers = teamMembers.filter(member => {
    const matchesRole = filterRole === 'all' || member.role === filterRole
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesSearch
  })

  const roleStats = {
    total: teamMembers.length,
    active: teamMembers.filter(m => m.isActive).length,
    suspended: teamMembers.filter(m => !m.isActive).length,
    superadmin: teamMembers.filter(m => m.role === 'superadmin').length,
    regional_head: teamMembers.filter(m => m.role === 'regional_head').length,
    supervisor: teamMembers.filter(m => m.role === 'supervisor').length,
    field_collector: teamMembers.filter(m => m.role === 'field_collector').length,
    lab_technician: teamMembers.filter(m => m.role === 'lab_technician').length,
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading team members...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Team Management</h2>
          <p className="text-muted-foreground">Manage team members, roles, and permissions</p>
        </div>
        <Button onClick={handleAddMember} className="gap-2">
          <Plus size={16} />
          Add Team Member
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roleStats.total}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-green-600 dark:text-green-400">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{roleStats.active}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-purple-600 dark:text-purple-400">Superadmins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{roleStats.superadmin}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-blue-600 dark:text-blue-400">Regional Heads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{roleStats.regional_head}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-green-600 dark:text-green-400">Supervisors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{roleStats.supervisor}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-yellow-600 dark:text-yellow-400">Collectors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{roleStats.field_collector}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-pink-600 dark:text-pink-400">Lab Techs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">{roleStats.lab_technician}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as TeamRole | 'all')}
              className="px-3 py-2 border border-border rounded-lg"
            >
              <option value="all">All Roles</option>
              {(Object.keys(ROLE_DEFINITIONS) as TeamRole[]).map(role => (
                <option key={role} value={role}>
                  {ROLE_DEFINITIONS[role].title}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No team members found. Add your first team member to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Email</th>
                    <th className="text-left py-2 px-2">Role</th>
                    <th className="text-left py-2 px-2">Region/District</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-2 font-medium">{member.fullName}</td>
                      <td className="py-3 px-2 text-xs">{member.email}</td>
                      <td className="py-3 px-2">
                        <Badge className={`${getRoleColor(member.role)} text-white`}>
                          {ROLE_DEFINITIONS[member.role].title}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-xs">
                        {member.regionId && <div>Region: {member.regionId}</div>}
                        {member.districtId && <div>District: {member.districtId}</div>}
                        {!member.regionId && !member.districtId && '-'}
                      </td>
                      <td className="py-3 px-2">
                        {member.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Suspended</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleStatus(member)}
                            className="p-1 hover:bg-muted rounded"
                            title={member.isActive ? 'Suspend' : 'Activate'}
                          >
                            {member.isActive ? (
                              <UserX size={16} className="text-red-600" />
                            ) : (
                              <UserCheck size={16} className="text-green-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditMember(member)}
                            className="p-1 hover:bg-muted rounded"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-1 hover:bg-muted rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <TeamMemberForm
          member={editingMember}
          currentUserRole={currentUserRole}
          onClose={() => {
            setShowForm(false)
            setEditingMember(null)
          }}
          onSave={() => {
            setShowForm(false)
            setEditingMember(null)
            loadTeamMembers()
          }}
        />
      )}
    </div>
  )
}

// Team Member Form Component
function TeamMemberForm({ 
  member, 
  currentUserRole,
  onClose, 
  onSave 
}: { 
  member: TeamMember | null
  currentUserRole: TeamRole
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    fullName: member?.fullName || '',
    email: member?.email || '',
    role: member?.role || 'field_collector' as TeamRole,
    regionId: member?.regionId || '',
    districtId: member?.districtId || '',
    teamId: member?.teamId || '',
    supervisorId: member?.supervisorId || '',
  })

  const availableRoles = getAvailableRolesForUser(currentUserRole)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      
      const rolePermissions = ROLE_DEFINITIONS[formData.role].permissions
      
      if (member) {
        // Update existing member
        await offlineDB.update('team_members', member.id, {
          ...member,
          ...formData,
          permissions: rolePermissions,
          updatedAt: new Date().toISOString()
        })
        console.log(`✅ Updated team member: ${formData.fullName}`)
      } else {
        // Create new member
        const newMember: TeamMember = {
          id: `TEAM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: `USER_${Date.now()}`,
          ...formData,
          isActive: true,
          employmentStatus: 'active',
          hireDate: new Date().toISOString(),
          permissions: rolePermissions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await offlineDB.create('team_members', newMember)
        console.log(`✅ Created team member: ${formData.fullName}`)
      }
      
      onSave()
    } catch (error) {
      console.error('❌ Error saving team member:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-background dark:bg-slate-900 border-border dark:border-slate-700">
          <CardHeader>
            <CardTitle>{member ? 'Edit Team Member' : 'Add Team Member'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Full Name *</label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-background dark:bg-slate-800 text-foreground dark:border-slate-600"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-background dark:bg-slate-800 text-foreground dark:border-slate-600"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as TeamRole })}
                  className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-lg bg-background dark:bg-slate-800 text-foreground"
                  required
                >
                  {availableRoles.map(role => (
                    <option key={role} value={role}>
                      {ROLE_DEFINITIONS[role].title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {ROLE_DEFINITIONS[formData.role].description}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Region ID</label>
                  <Input
                    value={formData.regionId}
                    onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                    placeholder="e.g., western, northern"
                    className="bg-background dark:bg-slate-800 text-foreground dark:border-slate-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">District ID</label>
                  <Input
                    value={formData.districtId}
                    onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                    placeholder="e.g., freetown, bo"
                    className="bg-background dark:bg-slate-800 text-foreground dark:border-slate-600"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {member ? 'Update Member' : 'Add Member'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
