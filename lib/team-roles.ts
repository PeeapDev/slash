"use client"

// Team Roles & RBAC System - Complete Implementation
// Defines 8 team roles with hierarchical permissions

export type TeamRole = 
  | 'superadmin'
  | 'regional_head'
  | 'supervisor'
  | 'field_collector'
  | 'lab_technician'
  | 'ai_data_manager'
  | 'hr_manager'
  | 'guest'

export interface TeamMember {
  id: string
  userId: string
  email: string
  fullName: string
  role: TeamRole
  regionId?: string // For regional_head, supervisor
  districtId?: string // For supervisor, field_collector
  teamId?: string // For supervisor, field_collector
  supervisorId?: string // For field_collector, lab_technician
  isActive: boolean
  employmentStatus: 'active' | 'suspended' | 'terminated' | 'on_leave'
  hireDate: string
  lastActiveAt?: string
  permissions: RolePermissions
  createdAt: string
  updatedAt: string
}

export interface RolePermissions {
  // Data Access
  viewAllData: boolean
  viewRegionalData: boolean
  viewDistrictData: boolean
  viewOwnData: boolean
  
  // Data Management
  createRecords: boolean
  editRecords: boolean
  deleteRecords: boolean
  approveRecords: boolean
  
  // User Management
  manageUsers: boolean
  assignRoles: boolean
  viewStaffPerformance: boolean
  
  // Lab Operations
  enterLabResults: boolean
  approveLabResults: boolean
  flagLabIssues: boolean
  
  // AI & Analytics
  runAIAudits: boolean
  viewAIReports: boolean
  configureAI: boolean
  
  // System Configuration
  manageConfiguration: boolean
  viewSystemLogs: boolean
  manageIntegrations: boolean
  
  // Region/District Management
  manageRegions: boolean
  manageDistricts: boolean
  assignEnumerators: boolean
}

// Role Definitions
export const ROLE_DEFINITIONS: Record<TeamRole, {
  title: string
  description: string
  permissions: RolePermissions
  hierarchy: number // 1 = highest, 8 = lowest
}> = {
  superadmin: {
    title: 'Superadmin',
    description: 'Full system control, oversight, and management',
    hierarchy: 1,
    permissions: {
      viewAllData: true,
      viewRegionalData: true,
      viewDistrictData: true,
      viewOwnData: true,
      createRecords: true,
      editRecords: true,
      deleteRecords: true,
      approveRecords: true,
      manageUsers: true,
      assignRoles: true,
      viewStaffPerformance: true,
      enterLabResults: true,
      approveLabResults: true,
      flagLabIssues: true,
      runAIAudits: true,
      viewAIReports: true,
      configureAI: true,
      manageConfiguration: true,
      viewSystemLogs: true,
      manageIntegrations: true,
      manageRegions: true,
      manageDistricts: true,
      assignEnumerators: true,
    }
  },
  
  regional_head: {
    title: 'Regional Head',
    description: 'Regional management and oversight',
    hierarchy: 2,
    permissions: {
      viewAllData: false,
      viewRegionalData: true,
      viewDistrictData: true,
      viewOwnData: true,
      createRecords: true,
      editRecords: true,
      deleteRecords: false,
      approveRecords: true,
      manageUsers: true, // Can approve supervisors
      assignRoles: false,
      viewStaffPerformance: true,
      enterLabResults: false,
      approveLabResults: false,
      flagLabIssues: true,
      runAIAudits: false,
      viewAIReports: true,
      configureAI: false,
      manageConfiguration: true, // Region-specific
      viewSystemLogs: true,
      manageIntegrations: false,
      manageRegions: false,
      manageDistricts: true,
      assignEnumerators: true,
    }
  },
  
  supervisor: {
    title: 'Supervisor',
    description: 'Team and field-level oversight',
    hierarchy: 3,
    permissions: {
      viewAllData: false,
      viewRegionalData: false,
      viewDistrictData: true,
      viewOwnData: true,
      createRecords: true,
      editRecords: true,
      deleteRecords: false,
      approveRecords: true, // Approve surveys and samples
      manageUsers: false,
      assignRoles: false,
      viewStaffPerformance: true, // For their team
      enterLabResults: false,
      approveLabResults: false,
      flagLabIssues: true,
      runAIAudits: false,
      viewAIReports: true,
      configureAI: false,
      manageConfiguration: false,
      viewSystemLogs: false,
      manageIntegrations: false,
      manageRegions: false,
      manageDistricts: false,
      assignEnumerators: true, // Within their team
    }
  },
  
  field_collector: {
    title: 'Field Data Collector',
    description: 'Primary data collection in the field',
    hierarchy: 4,
    permissions: {
      viewAllData: false,
      viewRegionalData: false,
      viewDistrictData: false,
      viewOwnData: true,
      createRecords: true,
      editRecords: true,
      deleteRecords: false,
      approveRecords: false,
      manageUsers: false,
      assignRoles: false,
      viewStaffPerformance: false,
      enterLabResults: false,
      approveLabResults: false,
      flagLabIssues: true, // Can flag issues to supervisor
      runAIAudits: false,
      viewAIReports: false,
      configureAI: false,
      manageConfiguration: false,
      viewSystemLogs: false,
      manageIntegrations: false,
      manageRegions: false,
      manageDistricts: false,
      assignEnumerators: false,
    }
  },
  
  lab_technician: {
    title: 'Lab Technician',
    description: 'Laboratory data entry and sample verification',
    hierarchy: 5,
    permissions: {
      viewAllData: false,
      viewRegionalData: false,
      viewDistrictData: false,
      viewOwnData: true,
      createRecords: false, // Can't create field data
      editRecords: true, // Can edit lab results
      deleteRecords: false,
      approveRecords: false,
      manageUsers: false,
      assignRoles: false,
      viewStaffPerformance: false,
      enterLabResults: true,
      approveLabResults: false,
      flagLabIssues: true,
      runAIAudits: false,
      viewAIReports: false,
      configureAI: false,
      manageConfiguration: false,
      viewSystemLogs: false,
      manageIntegrations: false,
      manageRegions: false,
      manageDistricts: false,
      assignEnumerators: false,
    }
  },
  
  ai_data_manager: {
    title: 'AI Data Manager',
    description: 'Automated data quality checks and reporting',
    hierarchy: 6,
    permissions: {
      viewAllData: true,
      viewRegionalData: true,
      viewDistrictData: true,
      viewOwnData: true,
      createRecords: false,
      editRecords: false,
      deleteRecords: false,
      approveRecords: false,
      manageUsers: false,
      assignRoles: false,
      viewStaffPerformance: true,
      enterLabResults: false,
      approveLabResults: false,
      flagLabIssues: true,
      runAIAudits: true,
      viewAIReports: true,
      configureAI: true,
      manageConfiguration: false,
      viewSystemLogs: true,
      manageIntegrations: false,
      manageRegions: false,
      manageDistricts: false,
      assignEnumerators: false,
    }
  },
  
  hr_manager: {
    title: 'HR & Staff Manager',
    description: 'Manage user accounts, roles, and staffing',
    hierarchy: 7,
    permissions: {
      viewAllData: false,
      viewRegionalData: false,
      viewDistrictData: false,
      viewOwnData: true,
      createRecords: false,
      editRecords: false,
      deleteRecords: false,
      approveRecords: false,
      manageUsers: true,
      assignRoles: true,
      viewStaffPerformance: true,
      enterLabResults: false,
      approveLabResults: false,
      flagLabIssues: false,
      runAIAudits: false,
      viewAIReports: false,
      configureAI: false,
      manageConfiguration: false,
      viewSystemLogs: true,
      manageIntegrations: false,
      manageRegions: false,
      manageDistricts: false,
      assignEnumerators: true,
    }
  },
  
  guest: {
    title: 'Guest',
    description: 'Read-only access for external stakeholders',
    hierarchy: 8,
    permissions: {
      viewAllData: false,
      viewRegionalData: false,
      viewDistrictData: false,
      viewOwnData: false,
      createRecords: false,
      editRecords: false,
      deleteRecords: false,
      approveRecords: false,
      manageUsers: false,
      assignRoles: false,
      viewStaffPerformance: false,
      enterLabResults: false,
      approveLabResults: false,
      flagLabIssues: false,
      runAIAudits: false,
      viewAIReports: true, // Can view published reports only
      configureAI: false,
      manageConfiguration: false,
      viewSystemLogs: false,
      manageIntegrations: false,
      manageRegions: false,
      manageDistricts: false,
      assignEnumerators: false,
    }
  }
}

// Helper functions for permission checking
export function hasPermission(role: TeamRole, permission: keyof RolePermissions): boolean {
  return ROLE_DEFINITIONS[role].permissions[permission]
}

export function canManageRole(managerRole: TeamRole, targetRole: TeamRole): boolean {
  // Can only manage roles lower in hierarchy
  return ROLE_DEFINITIONS[managerRole].hierarchy < ROLE_DEFINITIONS[targetRole].hierarchy
}

export function getAvailableRolesForUser(userRole: TeamRole): TeamRole[] {
  const userHierarchy = ROLE_DEFINITIONS[userRole].hierarchy
  return (Object.keys(ROLE_DEFINITIONS) as TeamRole[]).filter(
    role => ROLE_DEFINITIONS[role].hierarchy > userHierarchy
  )
}

export function getRoleColor(role: TeamRole): string {
  const colors: Record<TeamRole, string> = {
    superadmin: 'bg-purple-500',
    regional_head: 'bg-blue-500',
    supervisor: 'bg-green-500',
    field_collector: 'bg-yellow-500',
    lab_technician: 'bg-pink-500',
    ai_data_manager: 'bg-indigo-500',
    hr_manager: 'bg-orange-500',
    guest: 'bg-gray-400'
  }
  return colors[role]
}
