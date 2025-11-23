export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  region?: string
  district?: string
  status: "active" | "inactive" | "pending"
  createdAt: string
}

export interface Region {
  id: string
  name: string
  code: string
  districts: string[]
}

export interface District {
  id: string
  region_id: string
  name: string
  code: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  resource: string
  timestamp: string
  details: any
}

export interface RolePermission {
  role: string
  permissions: {
    view: string[]
    edit: string[]
    approve: string[]
    sync: string[]
  }
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: {
    dashboard: boolean
    view_regions: boolean
    edit_regions: boolean
    view_districts: boolean
    edit_districts: boolean
    view_staff: boolean
    edit_staff: boolean
    view_surveys: boolean
    edit_surveys: boolean
    view_samples: boolean
    edit_samples: boolean
    view_lab_results: boolean
    edit_lab_results: boolean
    view_analytics: boolean
    manage_roles: boolean
    manage_ai: boolean
    manage_sync: boolean
    view_logs: boolean
  }
  createdAt: string
}

export interface Staff {
  id: string
  name: string
  email: string
  phone: string
  role: string
  region?: string
  district?: string
  status: "active" | "inactive" | "pending"
  employmentType: "full-time" | "contract" | "part-time"
  joinDate: string
  createdAt: string
}

// Project interface
export interface Project {
  id: string
  name: string
  type: "household_survey" | "blood_sample" | "urine_sample" | "other"
  regions: string[]
  districts: string[]
  startDate: string
  endDate: string
  status: "not_started" | "in_progress" | "completed"
  assignedTeam: string[]
  supervisors: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

// Household interface
export interface Household {
  id: string
  headName: string
  region: string
  district: string
  address: string
  gps?: string
  projectId: string
  numParticipants: number
  numSamplesUrine: number
  numSamplesBlood: number
  status: "active" | "inactive"
  assignedCollector: string
  supervisorId: string
  notes: string
  createdAt: string
  updatedAt: string
}

// Participant interface
export interface Participant {
  id: string
  householdId: string
  name: string
  age: number
  sex: "male" | "female" | "other"
  relationship: string
  consent: boolean
  projectId: string
  createdAt: string
  updatedAt: string
}

// Survey interface
export interface Survey {
  id: string
  householdId: string
  participantId: string
  projectId: string
  status: "not_started" | "in_progress" | "completed"
  collectorId: string
  completedDate?: string
  data: any
  createdAt: string
  updatedAt: string
}

// Sample interface
export interface Sample {
  id: string
  householdId: string
  participantId: string
  projectId: string
  type: "urine" | "blood"
  collectionStatus: "not_collected" | "collected" | "completed"
  collectionDate?: string
  collectorId: string
  labResult?: any
  labTechnicianId?: string
  notes: string
  createdAt: string
  updatedAt: string
}

// Admin Users
export function addAdminUser(user: AdminUser) {
  const users = JSON.parse(localStorage.getItem("admin_users") || "[]")
  users.push(user)
  localStorage.setItem("admin_users", JSON.stringify(users))
}

export function getAdminUsers() {
  return JSON.parse(localStorage.getItem("admin_users") || "[]") as AdminUser[]
}

export function updateAdminUser(id: string, updates: Partial<AdminUser>) {
  const users = getAdminUsers()
  const index = users.findIndex((u: AdminUser) => u.id === id)
  if (index !== -1) {
    users[index] = { ...users[index], ...updates }
    localStorage.setItem("admin_users", JSON.stringify(users))
  }
}

// Regions & Districts
import { SIERRA_LEONE_REGIONS } from "@/lib/sierra-leone-regions"

export function getRegions() {
  // Return Sierra Leone regions as Region format for backward compatibility
  return SIERRA_LEONE_REGIONS.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    districts: r.districts.map((d) => d.name),
  }))
}

export function addRegion(region: Region) {
  const regions = getRegions()
  regions.push(region)
  localStorage.setItem("regions", JSON.stringify(regions))
}

export function getDistricts(regionId: string) {
  const regions = getRegions()
  const region = regions.find((r) => r.id === regionId)
  return region?.districts || []
}

// Audit Logs
export function addAuditLog(log: AuditLog) {
  const logs = JSON.parse(localStorage.getItem("audit_logs") || "[]")
  logs.push(log)
  localStorage.setItem("audit_logs", JSON.stringify(logs))
}

export function getAuditLogs() {
  return JSON.parse(localStorage.getItem("audit_logs") || "[]") as AuditLog[]
}

// Role Permissions
export function getRolePermissions(role: string) {
  const permissions = JSON.parse(localStorage.getItem("role_permissions") || "{}")
  return permissions[role] || {}
}

export function setRolePermissions(role: string, permissions: any) {
  const allPermissions = JSON.parse(localStorage.getItem("role_permissions") || "{}")
  allPermissions[role] = permissions
  localStorage.setItem("role_permissions", JSON.stringify(allPermissions))
}

// Role Management
export function addRole(role: Role) {
  const roles = JSON.parse(localStorage.getItem("roles") || "[]")
  roles.push(role)
  localStorage.setItem("roles", JSON.stringify(roles))
}

export function getRoles() {
  const defaultRoles: Role[] = [
    {
      id: "superadmin",
      name: "Superadmin",
      description: "Full system control, oversight, and management",
      permissions: {
        dashboard: true,
        view_regions: true,
        edit_regions: true,
        view_districts: true,
        edit_districts: true,
        view_staff: true,
        edit_staff: true,
        view_surveys: true,
        edit_surveys: true,
        view_samples: true,
        edit_samples: true,
        view_lab_results: true,
        edit_lab_results: true,
        view_analytics: true,
        manage_roles: true,
        manage_ai: true,
        manage_sync: true,
        view_logs: true,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "regional_head",
      name: "Regional Head",
      description: "Regional management and oversight",
      permissions: {
        dashboard: true,
        view_regions: true,
        edit_regions: false,
        view_districts: true,
        edit_districts: true,
        view_staff: true,
        edit_staff: false,
        view_surveys: true,
        edit_surveys: true,
        view_samples: true,
        edit_samples: true,
        view_lab_results: true,
        edit_lab_results: true,
        view_analytics: true,
        manage_roles: false,
        manage_ai: false,
        manage_sync: true,
        view_logs: true,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "supervisor",
      name: "Supervisor",
      description: "Team and field-level oversight",
      permissions: {
        dashboard: true,
        view_regions: false,
        edit_regions: false,
        view_districts: true,
        edit_districts: false,
        view_staff: true,
        edit_staff: false,
        view_surveys: true,
        edit_surveys: true,
        view_samples: true,
        edit_samples: true,
        view_lab_results: true,
        edit_lab_results: false,
        view_analytics: true,
        manage_roles: false,
        manage_ai: false,
        manage_sync: true,
        view_logs: false,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "field_collector",
      name: "Field Data Collector",
      description: "Primary data collection in the field",
      permissions: {
        dashboard: true,
        view_regions: false,
        edit_regions: false,
        view_districts: false,
        edit_districts: false,
        view_staff: false,
        edit_staff: false,
        view_surveys: true,
        edit_surveys: true,
        view_samples: true,
        edit_samples: true,
        view_lab_results: false,
        edit_lab_results: false,
        view_analytics: false,
        manage_roles: false,
        manage_ai: false,
        manage_sync: true,
        view_logs: false,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "lab_technician",
      name: "Lab Technician",
      description: "Laboratory data entry and sample verification",
      permissions: {
        dashboard: true,
        view_regions: false,
        edit_regions: false,
        view_districts: false,
        edit_districts: false,
        view_staff: false,
        edit_staff: false,
        view_surveys: false,
        edit_surveys: false,
        view_samples: true,
        edit_samples: false,
        view_lab_results: true,
        edit_lab_results: true,
        view_analytics: false,
        manage_roles: false,
        manage_ai: false,
        manage_sync: true,
        view_logs: false,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "hr_manager",
      name: "HR & Staff Management",
      description: "Manage user accounts, roles, and staffing",
      permissions: {
        dashboard: true,
        view_regions: true,
        edit_regions: false,
        view_districts: true,
        edit_districts: false,
        view_staff: true,
        edit_staff: true,
        view_surveys: false,
        edit_surveys: false,
        view_samples: false,
        edit_samples: false,
        view_lab_results: false,
        edit_lab_results: false,
        view_analytics: false,
        manage_roles: false,
        manage_ai: false,
        manage_sync: false,
        view_logs: true,
      },
      createdAt: new Date().toISOString(),
    },
  ]

  let roles = JSON.parse(localStorage.getItem("roles") || "[]")
  if (roles.length === 0) {
    roles = defaultRoles
    localStorage.setItem("roles", JSON.stringify(roles))
  }
  return roles as Role[]
}

export function updateRole(id: string, updates: Partial<Role>) {
  const roles = getRoles()
  const index = roles.findIndex((r: Role) => r.id === id)
  if (index !== -1) {
    roles[index] = { ...roles[index], ...updates }
    localStorage.setItem("roles", JSON.stringify(roles))
  }
}

export function deleteRole(id: string) {
  const roles = getRoles()
  const filtered = roles.filter((r: Role) => r.id !== id)
  localStorage.setItem("roles", JSON.stringify(filtered))
}

// Staff Management
export function addStaff(staff: Staff) {
  const staffList = JSON.parse(localStorage.getItem("staff") || "[]")
  staffList.push(staff)
  localStorage.setItem("staff", JSON.stringify(staffList))
}

export function getStaff() {
  return JSON.parse(localStorage.getItem("staff") || "[]") as Staff[]
}

export function updateStaff(id: string, updates: Partial<Staff>) {
  const staffList = getStaff()
  const index = staffList.findIndex((s: Staff) => s.id === id)
  if (index !== -1) {
    staffList[index] = { ...staffList[index], ...updates }
    localStorage.setItem("staff", JSON.stringify(staffList))
  }
}

export function deleteStaff(id: string) {
  const staffList = getStaff()
  const filtered = staffList.filter((s: Staff) => s.id !== id)
  localStorage.setItem("staff", JSON.stringify(filtered))
}

// Projects Management
export function addProject(project: Project) {
  const projects = JSON.parse(localStorage.getItem("projects") || "[]")
  projects.push(project)
  localStorage.setItem("projects", JSON.stringify(projects))
}

export function getProjects() {
  return JSON.parse(localStorage.getItem("projects") || "[]") as Project[]
}

export function updateProject(id: string, updates: Partial<Project>) {
  const projects = getProjects()
  const index = projects.findIndex((p: Project) => p.id === id)
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem("projects", JSON.stringify(projects))
  }
}

export function deleteProject(id: string) {
  const projects = getProjects()
  const filtered = projects.filter((p: Project) => p.id !== id)
  localStorage.setItem("projects", JSON.stringify(filtered))
}

export function getProjectsByRegion(regionId: string) {
  const projects = getProjects()
  return projects.filter((p: Project) => p.regions.includes(regionId))
}

// Household Management
export function addHousehold(household: Household) {
  const households = JSON.parse(localStorage.getItem("households") || "[]")
  households.push(household)
  localStorage.setItem("households", JSON.stringify(households))
}

export function getHouseholds() {
  return JSON.parse(localStorage.getItem("households") || "[]") as Household[]
}

export function updateHousehold(id: string, updates: Partial<Household>) {
  const households = getHouseholds()
  const index = households.findIndex((h: Household) => h.id === id)
  if (index !== -1) {
    households[index] = { ...households[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem("households", JSON.stringify(households))
  }
}

export function deleteHousehold(id: string) {
  const households = getHouseholds()
  const filtered = households.filter((h: Household) => h.id !== id)
  localStorage.setItem("households", JSON.stringify(filtered))
}

export function getHouseholdsByProject(projectId: string) {
  const households = getHouseholds()
  return households.filter((h: Household) => h.projectId === projectId)
}

// Participant Management
export function addParticipant(participant: Participant) {
  const participants = JSON.parse(localStorage.getItem("participants") || "[]")
  participants.push(participant)
  localStorage.setItem("participants", JSON.stringify(participants))
}

export function getParticipants() {
  return JSON.parse(localStorage.getItem("participants") || "[]") as Participant[]
}

export function getParticipantsByHousehold(householdId: string) {
  const participants = getParticipants()
  return participants.filter((p: Participant) => p.householdId === householdId)
}

export function updateParticipant(id: string, updates: Partial<Participant>) {
  const participants = getParticipants()
  const index = participants.findIndex((p: Participant) => p.id === id)
  if (index !== -1) {
    participants[index] = { ...participants[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem("participants", JSON.stringify(participants))
  }
}

export function deleteParticipant(id: string) {
  const participants = getParticipants()
  const filtered = participants.filter((p: Participant) => p.id !== id)
  localStorage.setItem("participants", JSON.stringify(filtered))
}

// Survey Management
export function addSurvey(survey: Survey) {
  const surveys = JSON.parse(localStorage.getItem("surveys") || "[]")
  surveys.push(survey)
  localStorage.setItem("surveys", JSON.stringify(surveys))
}

export function getSurveys() {
  return JSON.parse(localStorage.getItem("surveys") || "[]") as Survey[]
}

export function updateSurvey(id: string, updates: Partial<Survey>) {
  const surveys = getSurveys()
  const index = surveys.findIndex((s: Survey) => s.id === id)
  if (index !== -1) {
    surveys[index] = { ...surveys[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem("surveys", JSON.stringify(surveys))
  }
}

export function deleteSurvey(id: string) {
  const surveys = getSurveys()
  const filtered = surveys.filter((s: Survey) => s.id !== id)
  localStorage.setItem("surveys", JSON.stringify(filtered))
}

export function getSurveysByProject(projectId: string) {
  const surveys = getSurveys()
  return surveys.filter((s: Survey) => s.projectId === projectId)
}

// Sample Management
export function addSample(sample: Sample) {
  const samples = JSON.parse(localStorage.getItem("samples") || "[]")
  samples.push(sample)
  localStorage.setItem("samples", JSON.stringify(samples))
}

export function getSamples() {
  return JSON.parse(localStorage.getItem("samples") || "[]") as Sample[]
}

export function updateSample(id: string, updates: Partial<Sample>) {
  const samples = getSamples()
  const index = samples.findIndex((s: Sample) => s.id === id)
  if (index !== -1) {
    samples[index] = { ...samples[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem("samples", JSON.stringify(samples))
  }
}

export function deleteSample(id: string) {
  const samples = getSamples()
  const filtered = samples.filter((s: Sample) => s.id !== id)
  localStorage.setItem("samples", JSON.stringify(filtered))
}

export function getSamplesByProject(projectId: string) {
  const samples = getSamples()
  return samples.filter((s: Sample) => s.projectId === projectId)
}
