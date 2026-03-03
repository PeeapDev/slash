"use client"

// Data stores with IndexedDB write-behind cache
// Synchronous in-memory cache + async IndexedDB persistence

import { indexedDBService } from './indexdb-service'

const isClient = typeof window !== 'undefined'

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
  id?: string
  collectorId: string
  collectorName: string
  lastSync: string
  pendingRecords: number
  syncedRecords: number
  status: "synced" | "pending" | "offline"
}

// ─── Write-behind caches ───
let _householdCache: HouseholdData[] | null = null
let _participantCache: ParticipantData[] | null = null
let _sampleCache: SampleCollectionData[] | null = null
let _labCache: LabAnalysis[] | null = null
let _auditFlagCache: AuditFlag[] | null = null
let _syncStatusCache: SyncStatus[] | null = null

const STORAGE_KEYS = {
  HOUSEHOLD_DATA: "slash_household_data",
  PARTICIPANT_DATA: "slash_participant_data",
  SAMPLE_COLLECTION_DATA: "slash_sample_collection_data",
  LAB_ANALYSIS: "slash_lab_analysis",
  AUDIT_FLAGS: "slash_audit_flags",
  SYNC_STATUS: "slash_sync_status",
}

type StoreKey = 'household_data' | 'participant_data' | 'sample_collection_data' | 'lab_analysis' | 'audit_flags' | 'sync_status'

function migrateAndGet<T>(cache: T[] | null, localKey: string, idbStore: StoreKey): T[] {
  if (cache) return cache
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

function persistToIDB<T>(store: StoreKey, data: T[]) {
  indexedDBService.setAll(store as any, data).catch(e => console.warn(`IDB ${store} persist failed:`, e))
}

// Hydrate from IDB on module load
if (isClient) {
  (async () => {
    try {
      const [h, p, s, l, a, ss] = await Promise.all([
        indexedDBService.getAll('household_data'),
        indexedDBService.getAll('participant_data'),
        indexedDBService.getAll('sample_collection_data'),
        indexedDBService.getAll('lab_analysis'),
        indexedDBService.getAll('audit_flags'),
        indexedDBService.getAll('sync_status'),
      ])
      if (h.length > 0 && !_householdCache) _householdCache = h as HouseholdData[]
      if (p.length > 0 && !_participantCache) _participantCache = p as ParticipantData[]
      if (s.length > 0 && !_sampleCache) _sampleCache = s as SampleCollectionData[]
      if (l.length > 0 && !_labCache) _labCache = l as LabAnalysis[]
      if (a.length > 0 && !_auditFlagCache) _auditFlagCache = a as AuditFlag[]
      if (ss.length > 0 && !_syncStatusCache) _syncStatusCache = ss as SyncStatus[]
    } catch (e) {
      console.warn('data-store IDB hydration failed:', e)
    }
  })()
}

// Household Data Functions
export function getHouseholdData(): HouseholdData[] {
  if (!_householdCache) _householdCache = migrateAndGet<HouseholdData>(_householdCache, STORAGE_KEYS.HOUSEHOLD_DATA, 'household_data')
  return _householdCache
}

export function addHouseholdData(data: HouseholdData): void {
  const existing = getHouseholdData()
  existing.push(data)
  _householdCache = existing
  persistToIDB('household_data', existing)
}

export function updateHouseholdData(id: string, updates: Partial<HouseholdData>): void {
  const data = getHouseholdData()
  const index = data.findIndex((item) => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates }
    _householdCache = data
    persistToIDB('household_data', data)
  }
}

// Participant Data Functions
export function getParticipantData(): ParticipantData[] {
  if (!_participantCache) _participantCache = migrateAndGet<ParticipantData>(_participantCache, STORAGE_KEYS.PARTICIPANT_DATA, 'participant_data')
  return _participantCache
}

export function addParticipantData(data: ParticipantData): void {
  const existing = getParticipantData()
  existing.push(data)
  _participantCache = existing
  persistToIDB('participant_data', existing)
}

export function updateParticipantData(id: string, updates: Partial<ParticipantData>): void {
  const data = getParticipantData()
  const index = data.findIndex((item) => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates }
    _participantCache = data
    persistToIDB('participant_data', data)
  }
}

// Sample Collection Data Functions
export function getSampleCollectionData(): SampleCollectionData[] {
  if (!_sampleCache) _sampleCache = migrateAndGet<SampleCollectionData>(_sampleCache, STORAGE_KEYS.SAMPLE_COLLECTION_DATA, 'sample_collection_data')
  return _sampleCache
}

export function addSampleCollectionData(data: SampleCollectionData): void {
  const existing = getSampleCollectionData()
  existing.push(data)
  _sampleCache = existing
  persistToIDB('sample_collection_data', existing)
}

export function updateSampleCollectionData(id: string, updates: Partial<SampleCollectionData>): void {
  const data = getSampleCollectionData()
  const index = data.findIndex((item) => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates }
    _sampleCache = data
    persistToIDB('sample_collection_data', data)
  }
}

// Lab Analysis Functions
export function getLabAnalysis(): LabAnalysis[] {
  if (!_labCache) _labCache = migrateAndGet<LabAnalysis>(_labCache, STORAGE_KEYS.LAB_ANALYSIS, 'lab_analysis')
  return _labCache
}

export function addLabAnalysis(data: LabAnalysis): void {
  const existing = getLabAnalysis()
  existing.push(data)
  _labCache = existing
  persistToIDB('lab_analysis', existing)
}

export function updateLabAnalysis(id: string, updates: Partial<LabAnalysis>): void {
  const data = getLabAnalysis()
  const index = data.findIndex((item) => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates }
    _labCache = data
    persistToIDB('lab_analysis', data)
  }
}

export function getAuditFlags(): AuditFlag[] {
  if (!_auditFlagCache) _auditFlagCache = migrateAndGet<AuditFlag>(_auditFlagCache, STORAGE_KEYS.AUDIT_FLAGS, 'audit_flags')
  return _auditFlagCache
}

export function addAuditFlag(flag: AuditFlag): void {
  const existing = getAuditFlags()
  existing.push(flag)
  _auditFlagCache = existing
  persistToIDB('audit_flags', existing)
}

export function resolveAuditFlag(flagId: string): void {
  const flags = getAuditFlags()
  const index = flags.findIndex((f) => f.id === flagId)
  if (index !== -1) {
    flags[index].resolved = true
    _auditFlagCache = flags
    persistToIDB('audit_flags', flags)
  }
}

// Sync Status Functions
export function getSyncStatus(): SyncStatus[] {
  if (!_syncStatusCache) _syncStatusCache = migrateAndGet<SyncStatus>(_syncStatusCache, STORAGE_KEYS.SYNC_STATUS, 'sync_status')
  return _syncStatusCache
}

export function updateSyncStatus(collectorId: string, status: Partial<SyncStatus>): void {
  const syncStatuses = getSyncStatus()
  const index = syncStatuses.findIndex((s) => s.collectorId === collectorId)
  if (index !== -1) {
    syncStatuses[index] = { ...syncStatuses[index], ...status }
  } else {
    syncStatuses.push({ id: collectorId, collectorId, ...status } as SyncStatus)
  }
  _syncStatusCache = syncStatuses
  persistToIDB('sync_status', syncStatuses)
}
