import { indexedDBService } from './indexdb-service'
import { SIERRA_LEONE_REGIONS } from "@/lib/sierra-leone-regions"

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

// ─── Write-behind caches ───
let _adminUsersCache: AdminUser[] | null = null
let _auditLogsCache: AuditLog[] | null = null
let _rolePermissionsCache: Record<string, any> | null = null
let _rolesCache: Role[] | null = null
let _staffCache: Staff[] | null = null
let _projectsCache: Project[] | null = null
let _householdsCache: Household[] | null = null
let _participantsCache: Participant[] | null = null
let _surveysCache: Survey[] | null = null
let _samplesCache: Sample[] | null = null

const isClient = typeof window !== 'undefined'

// Generic migration: read from localStorage → persist to IDB → remove from localStorage
function migrateAndGet<T>(localKey: string, idbStore: string): T[] {
  if (!isClient) return []
  try {
    const stored = localStorage.getItem(localKey)
    if (stored) {
      const data = JSON.parse(stored) as T[]
      indexedDBService.setAll(idbStore as any, data).catch(() => {})
      localStorage.removeItem(localKey)
      return data
    }
  } catch { /* ignore */ }
  return []
}

function persistToIDB<T>(store: string, data: T[]) {
  indexedDBService.setAll(store as any, data).catch(e => console.warn(`IDB ${store} persist failed:`, e))
}

// Hydrate caches from IDB on module load
if (isClient) {
  (async () => {
    try {
      const [au, al, ro, st, pr, ho, pa, su, sa] = await Promise.all([
        indexedDBService.getAll('admin_users'),
        indexedDBService.getAll('audit_logs'),
        indexedDBService.getAll('app_settings'), // role_permissions stored as single doc
        indexedDBService.getAll('app_settings'), // staff - use dedicated store below
        indexedDBService.getAll('projects'),
        indexedDBService.getAll('app_settings'),
        indexedDBService.getAll('app_settings'),
        indexedDBService.getAll('app_settings'),
        indexedDBService.getAll('app_settings'),
      ])
      if (au.length > 0 && !_adminUsersCache) _adminUsersCache = au as AdminUser[]
      if (al.length > 0 && !_auditLogsCache) _auditLogsCache = al as AuditLog[]
      // Roles, staff, projects use dedicated stores via get/set pattern below
    } catch { /* ignore hydration errors */ }
  })()
}

// Admin Users
export function addAdminUser(user: AdminUser) {
  const users = getAdminUsers()
  users.push(user)
  _adminUsersCache = users
  persistToIDB('admin_users', users)
}

export function getAdminUsers() {
  if (_adminUsersCache) return _adminUsersCache
  _adminUsersCache = migrateAndGet<AdminUser>('admin_users', 'admin_users')
  return _adminUsersCache
}

export function updateAdminUser(id: string, updates: Partial<AdminUser>) {
  const users = getAdminUsers()
  const index = users.findIndex((u: AdminUser) => u.id === id)
  if (index !== -1) {
    users[index] = { ...users[index], ...updates }
    _adminUsersCache = users
    persistToIDB('admin_users', users)
  }
}

// Regions & Districts
export function getRegions() {
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
  persistToIDB('regions', regions as any)
}

export function getDistricts(regionId: string) {
  const regions = getRegions()
  const region = regions.find((r) => r.id === regionId)
  return region?.districts || []
}

// Audit Logs
export function addAuditLog(log: AuditLog) {
  const logs = getAuditLogs()
  logs.push(log)
  _auditLogsCache = logs
  persistToIDB('audit_logs', logs)
}

export function getAuditLogs() {
  if (_auditLogsCache) return _auditLogsCache
  _auditLogsCache = migrateAndGet<AuditLog>('audit_logs', 'audit_logs')
  return _auditLogsCache
}

// Role Permissions
export function getRolePermissions(role: string) {
  if (_rolePermissionsCache) return _rolePermissionsCache[role] || {}
  if (!isClient) return {}
  try {
    const stored = localStorage.getItem("role_permissions")
    if (stored) {
      _rolePermissionsCache = JSON.parse(stored)
      // Migrate to IDB
      indexedDBService.set('app_settings', { id: 'role_permissions', data: _rolePermissionsCache }).catch(() => {})
      localStorage.removeItem("role_permissions")
      return _rolePermissionsCache![role] || {}
    }
  } catch { /* ignore */ }
  _rolePermissionsCache = {}
  return {}
}

export function setRolePermissions(role: string, permissions: any) {
  if (!_rolePermissionsCache) _rolePermissionsCache = {}
  _rolePermissionsCache[role] = permissions
  indexedDBService.set('app_settings', { id: 'role_permissions', data: _rolePermissionsCache }).catch(() => {})
}

// Role Management - default roles
const defaultRoles: Role[] = [
  {
    id: "superadmin",
    name: "Superadmin",
    description: "Full system control, oversight, and management",
    permissions: {
      dashboard: true, view_regions: true, edit_regions: true, view_districts: true, edit_districts: true,
      view_staff: true, edit_staff: true, view_surveys: true, edit_surveys: true, view_samples: true,
      edit_samples: true, view_lab_results: true, edit_lab_results: true, view_analytics: true,
      manage_roles: true, manage_ai: true, manage_sync: true, view_logs: true,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "regional_head",
    name: "Regional Head",
    description: "Regional management and oversight",
    permissions: {
      dashboard: true, view_regions: true, edit_regions: false, view_districts: true, edit_districts: true,
      view_staff: true, edit_staff: false, view_surveys: true, edit_surveys: true, view_samples: true,
      edit_samples: true, view_lab_results: true, edit_lab_results: true, view_analytics: true,
      manage_roles: false, manage_ai: false, manage_sync: true, view_logs: true,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "supervisor",
    name: "Supervisor",
    description: "Team and field-level oversight",
    permissions: {
      dashboard: true, view_regions: false, edit_regions: false, view_districts: true, edit_districts: false,
      view_staff: true, edit_staff: false, view_surveys: true, edit_surveys: true, view_samples: true,
      edit_samples: true, view_lab_results: true, edit_lab_results: false, view_analytics: true,
      manage_roles: false, manage_ai: false, manage_sync: true, view_logs: false,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "field_collector",
    name: "Field Data Collector",
    description: "Primary data collection in the field",
    permissions: {
      dashboard: true, view_regions: false, edit_regions: false, view_districts: false, edit_districts: false,
      view_staff: false, edit_staff: false, view_surveys: true, edit_surveys: true, view_samples: true,
      edit_samples: true, view_lab_results: false, edit_lab_results: false, view_analytics: false,
      manage_roles: false, manage_ai: false, manage_sync: true, view_logs: false,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "lab_technician",
    name: "Lab Technician",
    description: "Laboratory data entry and sample verification",
    permissions: {
      dashboard: true, view_regions: false, edit_regions: false, view_districts: false, edit_districts: false,
      view_staff: false, edit_staff: false, view_surveys: false, edit_surveys: false, view_samples: true,
      edit_samples: false, view_lab_results: true, edit_lab_results: true, view_analytics: false,
      manage_roles: false, manage_ai: false, manage_sync: true, view_logs: false,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "hr_manager",
    name: "HR & Staff Management",
    description: "Manage user accounts, roles, and staffing",
    permissions: {
      dashboard: true, view_regions: true, edit_regions: false, view_districts: true, edit_districts: false,
      view_staff: true, edit_staff: true, view_surveys: false, edit_surveys: false, view_samples: false,
      edit_samples: false, view_lab_results: false, edit_lab_results: false, view_analytics: false,
      manage_roles: false, manage_ai: false, manage_sync: false, view_logs: true,
    },
    createdAt: new Date().toISOString(),
  },
]

export function addRole(role: Role) {
  const roles = getRoles()
  roles.push(role)
  _rolesCache = roles
  persistToIDB('app_settings', [{ id: 'roles', data: roles }] as any)
}

export function getRoles() {
  if (_rolesCache) return _rolesCache

  if (isClient) {
    try {
      const stored = localStorage.getItem("roles")
      if (stored) {
        const parsed = JSON.parse(stored) as Role[]
        if (parsed.length > 0) {
          _rolesCache = parsed
          persistToIDB('app_settings', [{ id: 'roles', data: parsed }] as any)
          localStorage.removeItem("roles")
          return _rolesCache
        }
      }
    } catch { /* ignore */ }
  }

  _rolesCache = [...defaultRoles]
  return _rolesCache
}

export function updateRole(id: string, updates: Partial<Role>) {
  const roles = getRoles()
  const index = roles.findIndex((r: Role) => r.id === id)
  if (index !== -1) {
    roles[index] = { ...roles[index], ...updates }
    _rolesCache = roles
    persistToIDB('app_settings', [{ id: 'roles', data: roles }] as any)
  }
}

export function deleteRole(id: string) {
  const roles = getRoles()
  _rolesCache = roles.filter((r: Role) => r.id !== id)
  persistToIDB('app_settings', [{ id: 'roles', data: _rolesCache }] as any)
}

// Staff Management
export function addStaff(staff: Staff) {
  const staffList = getStaff()
  staffList.push(staff)
  _staffCache = staffList
  persistToIDB('app_settings', [{ id: 'staff', data: staffList }] as any)
}

export function getStaff() {
  if (_staffCache) return _staffCache

  if (isClient) {
    try {
      const stored = localStorage.getItem("staff")
      if (stored) {
        _staffCache = JSON.parse(stored)
        persistToIDB('app_settings', [{ id: 'staff', data: _staffCache }] as any)
        localStorage.removeItem("staff")
        return _staffCache!
      }
    } catch { /* ignore */ }
  }

  _staffCache = []
  return _staffCache
}

export function updateStaff(id: string, updates: Partial<Staff>) {
  const staffList = getStaff()
  const index = staffList.findIndex((s: Staff) => s.id === id)
  if (index !== -1) {
    staffList[index] = { ...staffList[index], ...updates }
    _staffCache = staffList
    persistToIDB('app_settings', [{ id: 'staff', data: staffList }] as any)
  }
}

export function deleteStaff(id: string) {
  const staffList = getStaff()
  _staffCache = staffList.filter((s: Staff) => s.id !== id)
  persistToIDB('app_settings', [{ id: 'staff', data: _staffCache }] as any)
}

// Projects Management
export function addProject(project: Project) {
  const projects = getProjects()
  projects.push(project)
  _projectsCache = projects
  persistToIDB('projects', projects)
}

export function getProjects() {
  if (_projectsCache) return _projectsCache
  _projectsCache = migrateAndGet<Project>('projects', 'projects')
  return _projectsCache
}

export function updateProject(id: string, updates: Partial<Project>) {
  const projects = getProjects()
  const index = projects.findIndex((p: Project) => p.id === id)
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() }
    _projectsCache = projects
    persistToIDB('projects', projects)
  }
}

export function deleteProject(id: string) {
  const projects = getProjects()
  _projectsCache = projects.filter((p: Project) => p.id !== id)
  persistToIDB('projects', _projectsCache)
}

export function getProjectsByRegion(regionId: string) {
  const projects = getProjects()
  return projects.filter((p: Project) => p.regions.includes(regionId))
}

// Household Management
export function addHousehold(household: Household) {
  const households = getHouseholds()
  households.push(household)
  _householdsCache = households
  persistToIDB('app_settings', [{ id: 'households', data: households }] as any)
}

export function getHouseholds() {
  if (_householdsCache) return _householdsCache

  if (isClient) {
    try {
      const stored = localStorage.getItem("households")
      if (stored) {
        _householdsCache = JSON.parse(stored)
        persistToIDB('app_settings', [{ id: 'households', data: _householdsCache }] as any)
        localStorage.removeItem("households")
        return _householdsCache!
      }
    } catch { /* ignore */ }
  }

  _householdsCache = []
  return _householdsCache
}

export function updateHousehold(id: string, updates: Partial<Household>) {
  const households = getHouseholds()
  const index = households.findIndex((h: Household) => h.id === id)
  if (index !== -1) {
    households[index] = { ...households[index], ...updates, updatedAt: new Date().toISOString() }
    _householdsCache = households
    persistToIDB('app_settings', [{ id: 'households', data: _householdsCache }] as any)
  }
}

export function deleteHousehold(id: string) {
  const households = getHouseholds()
  _householdsCache = households.filter((h: Household) => h.id !== id)
  persistToIDB('app_settings', [{ id: 'households', data: _householdsCache }] as any)
}

export function getHouseholdsByProject(projectId: string) {
  const households = getHouseholds()
  return households.filter((h: Household) => h.projectId === projectId)
}

// Participant Management
export function addParticipant(participant: Participant) {
  const participants = getParticipants()
  participants.push(participant)
  _participantsCache = participants
  persistToIDB('app_settings', [{ id: 'participants', data: participants }] as any)
}

export function getParticipants() {
  if (_participantsCache) return _participantsCache

  if (isClient) {
    try {
      const stored = localStorage.getItem("participants")
      if (stored) {
        _participantsCache = JSON.parse(stored)
        persistToIDB('app_settings', [{ id: 'participants', data: _participantsCache }] as any)
        localStorage.removeItem("participants")
        return _participantsCache!
      }
    } catch { /* ignore */ }
  }

  _participantsCache = []
  return _participantsCache
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
    _participantsCache = participants
    persistToIDB('app_settings', [{ id: 'participants', data: participants }] as any)
  }
}

export function deleteParticipant(id: string) {
  const participants = getParticipants()
  _participantsCache = participants.filter((p: Participant) => p.id !== id)
  persistToIDB('app_settings', [{ id: 'participants', data: _participantsCache }] as any)
}

// Survey Management
export function addSurvey(survey: Survey) {
  const surveys = getSurveys()
  surveys.push(survey)
  _surveysCache = surveys
  persistToIDB('app_settings', [{ id: 'surveys', data: surveys }] as any)
}

export function getSurveys() {
  if (_surveysCache) return _surveysCache

  if (isClient) {
    try {
      const stored = localStorage.getItem("surveys")
      if (stored) {
        _surveysCache = JSON.parse(stored)
        persistToIDB('app_settings', [{ id: 'surveys', data: _surveysCache }] as any)
        localStorage.removeItem("surveys")
        return _surveysCache!
      }
    } catch { /* ignore */ }
  }

  _surveysCache = []
  return _surveysCache
}

export function updateSurvey(id: string, updates: Partial<Survey>) {
  const surveys = getSurveys()
  const index = surveys.findIndex((s: Survey) => s.id === id)
  if (index !== -1) {
    surveys[index] = { ...surveys[index], ...updates, updatedAt: new Date().toISOString() }
    _surveysCache = surveys
    persistToIDB('app_settings', [{ id: 'surveys', data: surveys }] as any)
  }
}

export function deleteSurvey(id: string) {
  const surveys = getSurveys()
  _surveysCache = surveys.filter((s: Survey) => s.id !== id)
  persistToIDB('app_settings', [{ id: 'surveys', data: _surveysCache }] as any)
}

export function getSurveysByProject(projectId: string) {
  const surveys = getSurveys()
  return surveys.filter((s: Survey) => s.projectId === projectId)
}

// Sample Management
export function addSample(sample: Sample) {
  const samples = getSamples()
  samples.push(sample)
  _samplesCache = samples
  persistToIDB('app_settings', [{ id: 'samples', data: samples }] as any)
}

export function getSamples() {
  if (_samplesCache) return _samplesCache

  if (isClient) {
    try {
      const stored = localStorage.getItem("samples")
      if (stored) {
        _samplesCache = JSON.parse(stored)
        persistToIDB('app_settings', [{ id: 'samples', data: _samplesCache }] as any)
        localStorage.removeItem("samples")
        return _samplesCache!
      }
    } catch { /* ignore */ }
  }

  _samplesCache = []
  return _samplesCache
}

export function updateSample(id: string, updates: Partial<Sample>) {
  const samples = getSamples()
  const index = samples.findIndex((s: Sample) => s.id === id)
  if (index !== -1) {
    samples[index] = { ...samples[index], ...updates, updatedAt: new Date().toISOString() }
    _samplesCache = samples
    persistToIDB('app_settings', [{ id: 'samples', data: samples }] as any)
  }
}

export function deleteSample(id: string) {
  const samples = getSamples()
  _samplesCache = samples.filter((s: Sample) => s.id !== id)
  persistToIDB('app_settings', [{ id: 'samples', data: _samplesCache }] as any)
}

export function getSamplesByProject(projectId: string) {
  const samples = getSamples()
  return samples.filter((s: Sample) => s.projectId === projectId)
}
