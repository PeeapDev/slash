"use client"

import { indexedDBService } from './indexdb-service'

// Offline-first data store using IndexedDB
// Replaces localStorage-based data-store.ts

export interface HouseholdData {
  id: string
  householdId: string
  collectorName: string
  date: string
  location: string
  familySize: number
  waterSource: string
  sanitationFacility: string
  headOfHousehold: string
  phoneNumber?: string
  gpsCoordinates?: { lat: number; lng: number }
  notes?: string
  createdAt: string
  updatedAt: string
  syncStatus: 'pending' | 'synced' | 'error'
}

export interface ParticipantData {
  id: string
  householdId: string
  participantId: string
  fullName: string
  age: number
  gender: 'male' | 'female' | 'other'
  relationToHead: string
  occupation?: string
  education?: string
  medicalHistory?: string[]
  currentMedications?: string[]
  pregnancyStatus?: 'pregnant' | 'not_pregnant' | 'unknown'
  createdAt: string
  updatedAt: string
  syncStatus: 'pending' | 'synced' | 'error'
}

export interface SampleCollectionData {
  id: string
  sampleId: string
  participantId: string
  householdId: string
  sampleType: 'urine' | 'blood' | 'saliva' | 'other'
  collectionDate: string
  collectorId: string
  collectorName: string
  volumeCollected?: number
  containerType?: string
  storageTemperature?: number
  collectionNotes?: string
  qualityCheck: {
    containerCorrect: boolean
    labelCorrect: boolean
    volumeAdequate: boolean
    noContamination: boolean
  }
  createdAt: string
  updatedAt: string
  syncStatus: 'pending' | 'synced' | 'error'
}

export interface LabAnalysis {
  id: string
  sampleId: string
  analysisType: string
  testDate: string
  analyzedBy: string
  results: {
    [testName: string]: {
      value: number | string
      unit?: string
      normalRange?: string
      isNormal: boolean
    }
  }
  qualityControl: {
    calibrationCheck: boolean
    controlResults: boolean
    instrumentStatus: 'good' | 'needs_maintenance' | 'error'
  }
  comments?: string
  flagged: boolean
  flagReason?: string
  createdAt: string
  updatedAt: string
  syncStatus: 'pending' | 'synced' | 'error'
}

export interface AuditFlag {
  id: string
  entityType: 'household' | 'participant' | 'sample' | 'lab_result'
  entityId: string
  flagType: 'data_quality' | 'missing_data' | 'anomaly' | 'protocol_deviation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  detectedBy: 'system' | 'user' | 'ai'
  detectedAt: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  resolutionNotes?: string
  createdAt: string
  updatedAt: string
}

export interface SyncStatus {
  collectorId: string
  lastSync: string
  lastSyncAttempt: string
  pendingUploads: number
  pendingDownloads: number
  totalRecords: number
  syncedRecords: number
  errorCount: number
  connectionStatus: 'online' | 'offline' | 'poor'
  nextSyncScheduled?: string
  updatedAt: string
}

// Household Data Functions
export async function getHouseholdData(): Promise<HouseholdData[]> {
  try {
    return await indexedDBService.getAll<HouseholdData>('household_data')
  } catch (error) {
    console.error('Error getting household data:', error)
    return []
  }
}

export async function addHouseholdData(data: Omit<HouseholdData, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<HouseholdData> {
  const timestamp = new Date().toISOString()
  const householdData: HouseholdData = {
    id: `household_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'pending',
    ...data
  }

  await indexedDBService.set('household_data', householdData)
  
  // Add to offline queue for sync
  await indexedDBService.addToOfflineQueue({
    type: 'CREATE',
    entity: 'household_data',
    data: householdData
  })

  return householdData
}

export async function updateHouseholdData(id: string, updates: Partial<HouseholdData>): Promise<void> {
  try {
    const existing = await indexedDBService.get<HouseholdData>('household_data', id)
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const
      }
      
      await indexedDBService.set('household_data', updated)
      
      // Add to offline queue for sync
      await indexedDBService.addToOfflineQueue({
        type: 'UPDATE',
        entity: 'household_data',
        data: updated
      })
    }
  } catch (error) {
    console.error('Error updating household data:', error)
  }
}

export async function getHouseholdById(id: string): Promise<HouseholdData | null> {
  try {
    return await indexedDBService.get<HouseholdData>('household_data', id)
  } catch (error) {
    console.error('Error getting household by ID:', error)
    return null
  }
}

// Participant Data Functions
export async function getParticipantData(): Promise<ParticipantData[]> {
  try {
    return await indexedDBService.getAll<ParticipantData>('participant_data')
  } catch (error) {
    console.error('Error getting participant data:', error)
    return []
  }
}

export async function addParticipantData(data: Omit<ParticipantData, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<ParticipantData> {
  const timestamp = new Date().toISOString()
  const participantData: ParticipantData = {
    id: `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'pending',
    ...data
  }

  await indexedDBService.set('participant_data', participantData)
  
  // Add to offline queue for sync
  await indexedDBService.addToOfflineQueue({
    type: 'CREATE',
    entity: 'participant_data',
    data: participantData
  })

  return participantData
}

export async function updateParticipantData(id: string, updates: Partial<ParticipantData>): Promise<void> {
  try {
    const existing = await indexedDBService.get<ParticipantData>('participant_data', id)
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const
      }
      
      await indexedDBService.set('participant_data', updated)
      
      // Add to offline queue for sync
      await indexedDBService.addToOfflineQueue({
        type: 'UPDATE',
        entity: 'participant_data',
        data: updated
      })
    }
  } catch (error) {
    console.error('Error updating participant data:', error)
  }
}

export async function getParticipantsByHousehold(householdId: string): Promise<ParticipantData[]> {
  try {
    return await indexedDBService.getByIndex<ParticipantData>('participant_data', 'householdId', householdId)
  } catch (error) {
    console.error('Error getting participants by household:', error)
    return []
  }
}

// Sample Collection Data Functions
export async function getSampleCollectionData(): Promise<SampleCollectionData[]> {
  try {
    return await indexedDBService.getAll<SampleCollectionData>('sample_collection_data')
  } catch (error) {
    console.error('Error getting sample collection data:', error)
    return []
  }
}

export async function addSampleCollectionData(data: Omit<SampleCollectionData, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<SampleCollectionData> {
  const timestamp = new Date().toISOString()
  const sampleData: SampleCollectionData = {
    id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'pending',
    ...data
  }

  await indexedDBService.set('sample_collection_data', sampleData)
  
  // Add to offline queue for sync
  await indexedDBService.addToOfflineQueue({
    type: 'CREATE',
    entity: 'sample_collection_data',
    data: sampleData
  })

  return sampleData
}

export async function updateSampleCollectionData(id: string, updates: Partial<SampleCollectionData>): Promise<void> {
  try {
    const existing = await indexedDBService.get<SampleCollectionData>('sample_collection_data', id)
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const
      }
      
      await indexedDBService.set('sample_collection_data', updated)
      
      // Add to offline queue for sync
      await indexedDBService.addToOfflineQueue({
        type: 'UPDATE',
        entity: 'sample_collection_data',
        data: updated
      })
    }
  } catch (error) {
    console.error('Error updating sample collection data:', error)
  }
}

export async function getSamplesByCollector(collectorId: string): Promise<SampleCollectionData[]> {
  try {
    return await indexedDBService.getByIndex<SampleCollectionData>('sample_collection_data', 'collectorId', collectorId)
  } catch (error) {
    console.error('Error getting samples by collector:', error)
    return []
  }
}

export async function getSamplesByParticipant(participantId: string): Promise<SampleCollectionData[]> {
  try {
    return await indexedDBService.getByIndex<SampleCollectionData>('sample_collection_data', 'participantId', participantId)
  } catch (error) {
    console.error('Error getting samples by participant:', error)
    return []
  }
}

// Lab Analysis Functions
export async function getLabAnalysis(): Promise<LabAnalysis[]> {
  try {
    return await indexedDBService.getAll<LabAnalysis>('lab_analysis')
  } catch (error) {
    console.error('Error getting lab analysis:', error)
    return []
  }
}

export async function addLabAnalysis(data: Omit<LabAnalysis, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<LabAnalysis> {
  const timestamp = new Date().toISOString()
  const labData: LabAnalysis = {
    id: `lab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'pending',
    ...data
  }

  await indexedDBService.set('lab_analysis', labData)
  
  // Add to offline queue for sync
  await indexedDBService.addToOfflineQueue({
    type: 'CREATE',
    entity: 'lab_analysis',
    data: labData
  })

  return labData
}

export async function updateLabAnalysis(id: string, updates: Partial<LabAnalysis>): Promise<void> {
  try {
    const existing = await indexedDBService.get<LabAnalysis>('lab_analysis', id)
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const
      }
      
      await indexedDBService.set('lab_analysis', updated)
      
      // Add to offline queue for sync
      await indexedDBService.addToOfflineQueue({
        type: 'UPDATE',
        entity: 'lab_analysis',
        data: updated
      })
    }
  } catch (error) {
    console.error('Error updating lab analysis:', error)
  }
}

// Audit Flag Functions
export async function getAuditFlags(): Promise<AuditFlag[]> {
  try {
    return await indexedDBService.getAll<AuditFlag>('audit_flags')
  } catch (error) {
    console.error('Error getting audit flags:', error)
    return []
  }
}

export async function addAuditFlag(flag: Omit<AuditFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuditFlag> {
  const timestamp = new Date().toISOString()
  const auditFlag: AuditFlag = {
    id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...flag
  }

  await indexedDBService.set('audit_flags', auditFlag)
  return auditFlag
}

export async function resolveAuditFlag(flagId: string, resolvedBy: string, resolutionNotes?: string): Promise<void> {
  try {
    const flag = await indexedDBService.get<AuditFlag>('audit_flags', flagId)
    if (flag) {
      const updated = {
        ...flag,
        resolved: true,
        resolvedBy,
        resolvedAt: new Date().toISOString(),
        resolutionNotes,
        updatedAt: new Date().toISOString()
      }
      
      await indexedDBService.set('audit_flags', updated)
    }
  } catch (error) {
    console.error('Error resolving audit flag:', error)
  }
}

// Sync Status Functions
export async function getSyncStatus(): Promise<SyncStatus[]> {
  try {
    return await indexedDBService.getAll<SyncStatus>('sync_status')
  } catch (error) {
    console.error('Error getting sync status:', error)
    return []
  }
}

export async function updateSyncStatus(collectorId: string, status: Omit<SyncStatus, 'collectorId' | 'updatedAt'>): Promise<void> {
  try {
    const syncStatus: SyncStatus = {
      collectorId,
      updatedAt: new Date().toISOString(),
      ...status
    }
    
    await indexedDBService.set('sync_status', syncStatus)
  } catch (error) {
    console.error('Error updating sync status:', error)
  }
}

// Utility Functions
export async function clearAllData(): Promise<void> {
  try {
    await indexedDBService.clear('household_data')
    await indexedDBService.clear('participant_data')
    await indexedDBService.clear('sample_collection_data')
    await indexedDBService.clear('lab_analysis')
    await indexedDBService.clear('audit_flags')
    await indexedDBService.clear('sync_status')
    console.log('All data cleared from IndexedDB')
  } catch (error) {
    console.error('Error clearing data:', error)
  }
}

export async function getDataSummary(): Promise<{
  households: number
  participants: number
  samples: number
  labResults: number
  auditFlags: number
  pendingSync: number
}> {
  try {
    const [households, participants, samples, labResults, auditFlags, offlineQueue] = await Promise.all([
      getHouseholdData(),
      getParticipantData(),
      getSampleCollectionData(),
      getLabAnalysis(),
      getAuditFlags(),
      indexedDBService.getOfflineQueue()
    ])

    return {
      households: households.length,
      participants: participants.length,
      samples: samples.length,
      labResults: labResults.length,
      auditFlags: auditFlags.filter(f => !f.resolved).length,
      pendingSync: offlineQueue.filter(q => !q.synced).length
    }
  } catch (error) {
    console.error('Error getting data summary:', error)
    return {
      households: 0,
      participants: 0,
      samples: 0,
      labResults: 0,
      auditFlags: 0,
      pendingSync: 0
    }
  }
}
