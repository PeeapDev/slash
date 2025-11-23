"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { offlineDB, ProjectMetadata } from "@/lib/offline-first-db"
// Sync engine disabled for pure IndexedDB testing
import { SIERRA_LEONE_REGIONS } from "@/lib/sierra-leone-regions"

export default function ProjectManagement() {
  const [projects, setProjects] = useState([])
  const [regions, setRegions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterRegion, setFilterRegion] = useState("all")
  const [userRole, setUserRole] = useState("superadmin")

  useEffect(() => {
    loadProjects()
    setRegions(SIERRA_LEONE_REGIONS)
    const user = JSON.parse(localStorage.getItem("current_user") || '{"role":"superadmin"}')
    setUserRole(user.role)
  }, [])

  // Load projects from IndexedDB (offline-first)
  const loadProjects = async () => {
    try {
      console.log('📊 Loading projects from IndexedDB...')
      await offlineDB.init()
      
      // Get projects from local IndexedDB first
      const localProjects = await offlineDB.getAll<ProjectMetadata>('project_metadata')
      console.log(`✅ Loaded ${localProjects.length} projects from IndexedDB`)
      
      setProjects(localProjects as any)
      
      // PURE INDEXEDDB MODE - No external API calls
      console.log('🎯 Pure IndexedDB mode - no external database sync')
    } catch (error) {
      console.error('❌ Error loading projects from IndexedDB:', error)
      setProjects([])
    }
  }

  const projectTypes = [
    { value: "household_survey", label: "Household Survey" },
    { value: "blood_sample", label: "Blood Sample Collection" },
    { value: "urine_sample", label: "Urine Sample Collection" },
    { value: "other", label: "Other" },
  ]

  const statusColors = {
    not_started: { bg: "bg-red-100", text: "text-red-800", label: "Not Started" },
    in_progress: { bg: "bg-yellow-100", text: "text-yellow-800", label: "In Progress" },
    completed: { bg: "bg-green-100", text: "text-green-800", label: "Completed" },
  }

  const handleAddProject = async (formData: any) => {
    try {
      console.log('🎯 Creating project in IndexedDB first...', formData)
      
      // Create project in IndexedDB first (offline-first approach)
      const projectData = {
        projectId: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectName: formData.name,
        projectCode: formData.code || `PROJECT-${Date.now()}`,
        description: formData.description || '',
        principalInvestigator: formData.pi || 'TBD',
        studyPeriod: {
          start: formData.startDate || new Date().toISOString().split('T')[0],
          end: formData.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        targetSampleSize: formData.targetSamples || 0,
        regions: formData.regions || [],
        districts: formData.districts || [],
        assignments: [],
        milestones: [],
        samplingQuotas: [],
        activeModules: ['households', 'participants', 'samples'],
        configurations: { 
          sampleTypes: formData.type === 'blood_sample' ? ['BLOOD'] : 
                      formData.type === 'urine_sample' ? ['URINE'] : 
                      ['URINE', 'BLOOD']
        }
      }

      // Save to IndexedDB - PURE OFFLINE MODE
      await offlineDB.create<ProjectMetadata>('project_metadata', projectData)
      console.log('✅ Project saved to IndexedDB - PURE OFFLINE MODE')
      console.log('📊 Project data:', projectData)
      
      // Refresh local list
      await loadProjects()
      setShowForm(false)
      
    } catch (error) {
      console.error('❌ Error creating project:', error)
    }
  }

  const handleEditProject = async (id: string, formData: any) => {
    try {
      // For now, we'll implement this later - the API doesn't have PUT endpoint yet
      console.log('Edit project not implemented yet:', id, formData)
      setShowForm(false)
      setEditingProject(null)
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        // For now, we'll implement this later - the API doesn't have DELETE endpoint yet
        console.log('Delete project not implemented yet:', id)
      } catch (error) {
        console.error('Error deleting project:', error)
      }
    }
  }

  const filteredProjects = projects.filter((p) => {
    const statusMatch = filterStatus === "all" || p.status === filterStatus
    const regionMatch = filterRegion === "all" || p.regions.includes(filterRegion)
    return statusMatch && regionMatch
  })

  const canEdit = ["superadmin", "regional_head"].includes(userRole)
  const visibleProjects =
    userRole === "superadmin"
      ? filteredProjects
      : userRole === "regional_head"
        ? filteredProjects.filter((p) => p.regions.includes(regions[0]?.id))
        : filteredProjects

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / Projects</div>
          <h1 className="text-2xl font-bold mt-1">Project Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage data collection projects</p>
        </div>
        {canEdit && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            Add New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-sm font-medium block mb-2">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {userRole === "superadmin" && (
          <div>
            <label className="text-sm font-medium block mb-2">Region</label>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm"
            >
              <option value="all">All Regions</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Projects Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-6 font-semibold">Project Name</th>
                <th className="text-left py-3 px-6 font-semibold">Type</th>
                <th className="text-left py-3 px-6 font-semibold">Region(s)</th>
                <th className="text-left py-3 px-6 font-semibold">Duration</th>
                <th className="text-left py-3 px-6 font-semibold">Status</th>
                <th className="text-left py-3 px-6 font-semibold">Assigned Team</th>
                {canEdit && <th className="text-center py-3 px-6 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {visibleProjects.length > 0 ? (
                visibleProjects.map((project) => (
                  <tr key={project.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-6 font-medium">{project.name}</td>
                    <td className="py-4 px-6">{projectTypes.find((t) => t.value === project.type)?.label}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-2">
                        {project.regions.map((regionId) => {
                          const region = regions.find((r) => r.id === regionId)
                          return (
                            <span
                              key={regionId}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                            >
                              {region?.name || regionId}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      {new Date(project.startDate).toLocaleDateString()} -{" "}
                      {new Date(project.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[project.status].bg
                        } ${statusColors[project.status].text}`}
                      >
                        {statusColors[project.status].label}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                        {project.supervisors.length} supervisors
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingProject(project)}
                            className="p-1 hover:bg-muted rounded"
                            title="Edit project"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="p-1 hover:bg-muted rounded"
                            title="Delete project"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="py-8 px-6 text-center text-muted-foreground">
                    No projects found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Project Form Modal */}
      {(showForm || editingProject) && (
        <ProjectFormModal
          project={editingProject}
          regions={regions}
          projectTypes={projectTypes}
          onSave={(data) => {
            if (editingProject) {
              handleUpdateProject(editingProject.id, data)
            } else {
              handleAddProject(data)
            }
          }}
          onClose={() => {
            setShowForm(false)
            setEditingProject(null)
          }}
        />
      )}
    </div>
  )
}

function ProjectFormModal({ project, regions, projectTypes, onSave, onClose }) {
  const [formData, setFormData] = useState(
    project || {
      name: "",
      type: "household_survey",
      regions: [],
      districts: [],
      startDate: "",
      endDate: "",
      status: "not_started",
      assignedTeam: [],
      supervisors: [],
      notes: "",
    },
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">{project ? "Edit Project" : "Create New Project"}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Project Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                {projectTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes / Instructions</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg h-24 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Project</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
