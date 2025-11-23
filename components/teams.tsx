"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, Users, UserPlus, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Staff {
  id: string
  fullName: string
  email: string
  role: string
  regionId?: string
  isActive: boolean
}

interface Project {
  id: string
  projectName: string
  projectCode: string
}

interface Team {
  id: string
  teamName: string
  projectId: string
  projectName: string
  description?: string
  leaderId: string
  leaderName?: string
  memberIds: string[]
  members?: Staff[]
  regionId?: string
  districtId?: string
  isActive: boolean
  createdAt: string
}

export default function Teams() {
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [filterProject, setFilterProject] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    teamName: '',
    projectId: '',
    description: '',
    leaderId: '',
    memberIds: [] as string[],
    regionId: '',
    districtId: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      console.log('📊 Loading teams, projects, and staff...')
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()

      const [teamsData, projectsData, staffData] = await Promise.all([
        offlineDB.getAll('teams'),
        offlineDB.getAll('project_metadata'),
        offlineDB.getAll('team_members')
      ])

      // Format teams with member details
      const formattedTeams = teamsData.map((team: any) => {
        const leader = staffData.find((s: any) => s.id === team.leaderId)
        const members = staffData.filter((s: any) => team.memberIds.includes(s.id))
        
        return {
          ...team,
          leaderName: leader?.fullName || 'Unknown',
          members: members
        }
      })

      setTeams(formattedTeams)
      setProjects(projectsData)
      setStaff(staffData.map((s: any) => ({
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        role: s.role,
        regionId: s.regionId,
        isActive: s.isActive
      })))

      console.log(`✅ Loaded ${formattedTeams.length} teams, ${projectsData.length} projects, ${staffData.length} staff`)
    } catch (error) {
      console.error('❌ Error loading teams data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTeam = () => {
    setEditingTeam(null)
    setFormData({
      teamName: '',
      projectId: '',
      description: '',
      leaderId: '',
      memberIds: [],
      regionId: '',
      districtId: ''
    })
    setShowForm(true)
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      teamName: team.teamName,
      projectId: team.projectId,
      description: team.description || '',
      leaderId: team.leaderId,
      memberIds: team.memberIds,
      regionId: team.regionId || '',
      districtId: team.districtId || ''
    })
    setShowForm(true)
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return

    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()
      await offlineDB.delete('teams', teamId)
      
      toast({
        title: "Team Deleted",
        description: "Team has been deleted successfully",
        variant: "default",
        duration: 3000,
      })
      
      loadData()
    } catch (error) {
      console.error('❌ Error deleting team:', error)
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.teamName || !formData.projectId || !formData.leaderId) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Team Name, Project, and Team Leader",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    try {
      const { offlineDB } = await import('@/lib/offline-first-db')
      await offlineDB.init()

      const project = projects.find(p => p.id === formData.projectId)
      const leader = staff.find(s => s.id === formData.leaderId)

      if (editingTeam) {
        // Update existing team
        const updated = {
          ...editingTeam,
          teamName: formData.teamName,
          projectId: formData.projectId,
          projectName: project?.projectName || '',
          description: formData.description,
          leaderId: formData.leaderId,
          memberIds: formData.memberIds,
          regionId: formData.regionId || undefined,
          districtId: formData.districtId || undefined,
          updatedAt: new Date().toISOString()
        }

        await offlineDB.update('teams', editingTeam.id, updated)
        
        toast({
          title: "Team Updated",
          description: `${formData.teamName} has been updated`,
          variant: "default",
          duration: 3000,
        })
      } else {
        // Create new team
        const newTeam = {
          id: `TEAM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          teamName: formData.teamName,
          projectId: formData.projectId,
          projectName: project?.projectName || '',
          description: formData.description,
          leaderId: formData.leaderId,
          memberIds: formData.memberIds,
          regionId: formData.regionId || undefined,
          districtId: formData.districtId || undefined,
          isActive: true,
          createdBy: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending' as const,
          version: 1,
          deviceId: 'admin',
          collectorId: 'admin'
        }

        await offlineDB.create('teams', newTeam)
        
        toast({
          title: "Team Created",
          description: `${formData.teamName} led by ${leader?.fullName} created successfully`,
          variant: "default",
          duration: 5000,
        })
      }

      setShowForm(false)
      loadData()
    } catch (error) {
      console.error('❌ Error saving team:', error)
      toast({
        title: "Error",
        description: "Failed to save team",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const toggleMember = (staffId: string) => {
    if (formData.memberIds.includes(staffId)) {
      setFormData({
        ...formData,
        memberIds: formData.memberIds.filter(id => id !== staffId)
      })
    } else {
      setFormData({
        ...formData,
        memberIds: [...formData.memberIds, staffId]
      })
    }
  }

  const filteredTeams = teams.filter(team => {
    const matchesProject = filterProject === 'all' || team.projectId === filterProject
    const matchesSearch = team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesProject && matchesSearch
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading teams...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Teams</h1>
          <p className="text-muted-foreground">Manage project-based teams and assign staff members</p>
        </div>
        <Button onClick={handleAddTeam} className="gap-2">
          <Plus size={16} />
          Create Team
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-blue-600 dark:text-blue-400">Total Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{teams.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-green-600 dark:text-green-400">Active Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {teams.filter(t => t.isActive).length}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-purple-600 dark:text-purple-400">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {teams.reduce((acc, team) => acc + team.memberIds.length, 0)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-orange-600 dark:text-orange-400">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{projects.length}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.projectName}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Teams List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{team.teamName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{team.projectName}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditTeam(team)}>
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteTeam(team.id)}>
                    <Trash2 size={14} className="text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground">Team Leader</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Users size={16} className="text-blue-600" />
                    <span className="font-medium">{team.leaderName}</span>
                  </div>
                </div>
                
                {team.description && (
                  <div>
                    <span className="text-xs text-muted-foreground">Description</span>
                    <p className="text-sm mt-1">{team.description}</p>
                  </div>
                )}
                
                <div>
                  <span className="text-xs text-muted-foreground">Members ({team.memberIds.length})</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {team.members && team.members.length > 0 ? (
                      team.members.map((member) => (
                        <Badge key={member.id} variant="secondary" className="text-xs">
                          {member.fullName}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No members assigned</span>
                    )}
                  </div>
                </div>

                {team.regionId && (
                  <div>
                    <Badge variant="outline" className="text-xs">
                      Region: {team.regionId}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No teams found</p>
            <Button onClick={handleAddTeam} className="mt-4">
              <Plus size={16} className="mr-2" />
              Create First Team
            </Button>
          </div>
        </Card>
      )}

      {/* Team Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <Card className="bg-background dark:bg-slate-900">
              <CardHeader>
                <CardTitle>{editingTeam ? 'Edit Team' : 'Create New Team'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Team Name *</label>
                    <Input
                      value={formData.teamName}
                      onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                      placeholder="e.g., Western Region Field Team"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Project *</label>
                    <select
                      value={formData.projectId}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.projectName} ({project.projectCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Team Leader *</label>
                    <select
                      value={formData.leaderId}
                      onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      required
                    >
                      <option value="">Select Team Leader from Staff</option>
                      {staff.filter(s => s.isActive).map(member => (
                        <option key={member.id} value={member.id}>
                          {member.fullName} - {member.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of team responsibilities..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Team Members ({formData.memberIds.length} selected)
                    </label>
                    <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-muted/20">
                      {staff.filter(s => s.isActive && s.id !== formData.leaderId).length > 0 ? (
                        staff.filter(s => s.isActive && s.id !== formData.leaderId).map(member => (
                          <label
                            key={member.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.memberIds.includes(member.id)}
                              onChange={() => toggleMember(member.id)}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{member.fullName}</div>
                              <div className="text-xs text-muted-foreground">{member.email} • {member.role}</div>
                            </div>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No staff available. Create staff members in HR Management first.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingTeam ? 'Update Team' : 'Create Team'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
