"use client"

// Data stores with database integration (client-side safe)
// Database operations should be done through API calls

// Check if we're in browser environment
const isClient = typeof window !== 'undefined'
const isDatabaseEnabled = process.env.NEXT_PUBLIC_DATABASE_ENABLED

export interface HouseholdData {
  id: string
  householdId: string
  collectorName: string
  date: string
  location: string
  familySize: number
  waterSource: string
  sanitationFacility: string
  healthIssues: string[]
  notes: string
  status: "draft" | "submitted" | "reviewed"
}

export interface ParticipantData {
  id: string
  participantId: string
  householdId: string
  name: string
  age: number
  sex: string
  relationship: string
  consent: boolean
  date: string
  status: "draft" | "submitted"
}

export interface SampleCollectionData {
  id: string
  sampleId: string
  participantId: string
  householdId: string
  sampleType: "urine" | "blood"
  collectionTime: string
  condition: string
  collectorId: string
  notes: string
  date: string
  status: "collected" | "pending_analysis" | "analyzed"
}

export interface LabAnalysis {
  id: string
  dataSampleId: string
  analysisType: string
  results: Record<string, string | number>
  technician: string
  date: string
  notes: string
  status: "pending" | "completed" | "flagged"
}

export interface AuditFlag {
  id: string
  type: "missing_survey" | "sample_no_results" | "results_no_sample"
  dataId: string
  dataType: "household" | "sample" | "analysis"
  description: string
  priority: "high" | "medium" | "low"
  createdAt: string
  resolved: boolean
}

export interface SyncStatus {
  collectorId: string
  collectorName: string
  lastSync: string
  pendingRecords: number
  syncedRecords: number
  status: "synced" | "pending" | "offline"
}

const STORAGE_KEYS = {
  HOUSEHOLD_DATA: "slash_household_data",
  PARTICIPANT_DATA: "slash_participant_data",
  SAMPLE_COLLECTION_DATA: "slash_sample_collection_data",
  LAB_ANALYSIS: "slash_lab_analysis",
  AUDIT_FLAGS: "slash_audit_flags",
  SYNC_STATUS: "slash_sync_status",
}

// Household Data Functions
export function getHouseholdData(): HouseholdData[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.HOUSEHOLD_DATA)
  return data ? JSON.parse(data) : []
}

export function addHouseholdData(data: HouseholdData): void {
  if (typeof window === "undefined") return
  const existing = getHouseholdData()
  existing.push(data)
  localStorage.setItem(STORAGE_KEYS.HOUSEHOLD_DATA, JSON.stringify(existing))
}

export function updateHouseholdData(id: string, updates: Partial<HouseholdData>): void {
  if (typeof window === "undefined") return
  const data = getHouseholdData()
  const index = data.findIndex((item) => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.HOUSEHOLD_DATA, JSON.stringify(data))
  }
}

// Participant Data Functions
export function getParticipantData(): ParticipantData[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.PARTICIPANT_DATA)
  return data ? JSON.parse(data) : []
}

export function addParticipantData(data: ParticipantData): void {
  if (typeof window === "undefined") return
  const existing = getParticipantData()
  existing.push(data)
  localStorage.setItem(STORAGE_KEYS.PARTICIPANT_DATA, JSON.stringify(existing))
}

export function updateParticipantData(id: string, updates: Partial<ParticipantData>): void {
  if (typeof window === "undefined") return
  const data = getParticipantData()
  const index = data.findIndex((item) => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.PARTICIPANT_DATA, JSON.stringify(data))
  }
}

// Sample Collection Data Functions
export function getSampleCollectionData(): SampleCollectionData[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.SAMPLE_COLLECTION_DATA)
  return data ? JSON.parse(data) : []
}

export function addSampleCollectionData(data: SampleCollectionData): void {
  if (typeof window === "undefined") return
  const existing = getSampleCollectionData()
  existing.push(data)
  localStorage.setItem(STORAGE_KEYS.SAMPLE_COLLECTION_DATA, JSON.stringify(existing))
}

export function updateSampleCollectionData(id: string, updates: Partial<SampleCollectionData>): void {
  if (typeof window === "undefined") return
  const data = getSampleCollectionData()
  const index = data.findIndex((item) => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.SAMPLE_COLLECTION_DATA, JSON.stringify(data))
  }
}

// Lab Analysis Functions
export function getLabAnalysis(): LabAnalysis[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.LAB_ANALYSIS)
  return data ? JSON.parse(data) : []
}

export function addLabAnalysis(data: LabAnalysis): void {
  if (typeof window === "undefined") return
  const existing = getLabAnalysis()
  existing.push(data)
  localStorage.setItem(STORAGE_KEYS.LAB_ANALYSIS, JSON.stringify(existing))
}

export function updateLabAnalysis(id: string, updates: Partial<LabAnalysis>): void {
  if (typeof window === "undefined") return
  const data = getLabAnalysis()
  const index = data.findIndex((item) => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.LAB_ANALYSIS, JSON.stringify(data))
  }
}

export function getAuditFlags(): AuditFlag[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.AUDIT_FLAGS)
  return data ? JSON.parse(data) : []
}

export function addAuditFlag(flag: AuditFlag): void {
  if (typeof window === "undefined") return
  const existing = getAuditFlags()
  existing.push(flag)
  localStorage.setItem(STORAGE_KEYS.AUDIT_FLAGS, JSON.stringify(existing))
}

export function resolveAuditFlag(flagId: string): void {
  if (typeof window === "undefined") return
  const flags = getAuditFlags()
  const index = flags.findIndex((f) => f.id === flagId)
  if (index !== -1) {
    flags[index].resolved = true
    localStorage.setItem(STORAGE_KEYS.AUDIT_FLAGS, JSON.stringify(flags))
  }
}

// Sync Status Functions
export function getSyncStatus(): SyncStatus[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.SYNC_STATUS)
  return data ? JSON.parse(data) : []
}

export function updateSyncStatus(collectorId: string, status: Partial<SyncStatus>): void {
  if (typeof window === "undefined") return
  const syncStatuses = getSyncStatus()
  const index = syncStatuses.findIndex((s) => s.collectorId === collectorId)
  if (index !== -1) {
    syncStatuses[index] = { ...syncStatuses[index], ...status }
  } else {
    syncStatuses.push({ collectorId, ...status } as SyncStatus)
  }
  localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(syncStatuses))
}
