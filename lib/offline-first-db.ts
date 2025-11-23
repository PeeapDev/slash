"use client"

// Offline-First IndexedDB Implementation - Master Specification Compliant
// Complete implementation following the detailed specification provided

import { v4 as uuidv4 } from 'uuid'

// Core Data Types per Specification
export type SyncStatus = 'pending' | 'synced' | 'error'

export interface BaseRecord {
  id: string // UUID primary key
  version: number // Revision tracking
  syncStatus: SyncStatus
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
  deviceId: string // Device identifier
  collectorId: string // Session ID
  integrityHash?: string // Checksum for tampering detection
}

// Object Store Interfaces per Specification
export interface Household extends BaseRecord {
  householdId: string // Field enumeration ID
  headOfHousehold: string
  address: string
  gpsCoordinates?: { lat: number; lng: number }
  phoneNumber?: string
  familySize: number
  waterSource: string
  sanitationFacility: string
  notes?: string
  enumeratorId: string
  projectId: string
}

export interface Participant extends BaseRecord {
  participantId: string // Field enumeration ID
  householdId: string // Link to household
  fullName: string
  age: number
  gender: 'male' | 'female' | 'other'
  relationToHead: string
  occupation?: string
  education?: string
  medicalHistory?: string[]
  currentMedications?: string[]
  pregnancyStatus?: 'pregnant' | 'not_pregnant' | 'unknown'
  consentGiven: boolean
  consentDate?: string
  projectId: string
}

export interface Survey extends BaseRecord {
  surveyId: string
  participantId: string
  householdId: string
  surveyType: string
  formId: string // Links to dynamic form
  formVersion: number
  responses: { [fieldName: string]: any }
  completionStatus: 'draft' | 'completed' | 'submitted'
  gpsLocation?: { lat: number; lng: number }
  projectId: string
}

export interface Sample extends BaseRecord {
  sampleId: string // Unique sample identifier
  participantId: string
  householdId: string
  sampleType: string
  sampleCode: string // Barcode or lab code
  collectionTimestamp: string
  collectorId: string
  gpsLocation?: { lat: number; lng: number }
  chainOfCustody: ChainOfCustodyRecord[]
  storageCondition: string
  volume?: number
  containerType: string
  qualityFlags: string[]
  projectId: string
}

export interface ChainOfCustodyRecord {
  timestamp: string
  handlerName: string
  handlerId: string
  action: 'collected' | 'transported' | 'received' | 'processed' | 'stored'
  location: string
  temperature?: number
  notes?: string
}

export interface Form extends BaseRecord {
  formId: string
  formName: string
  formDescription: string
  module: 'household' | 'participant' | 'sample' | 'survey'
  formSchema: FormSchema
  activeVersion: number
  activeDateRange: { start: string; end: string }
  mandatoryRules: string[]
  optionalRules: string[]
  publishedBy: string
  projectIds: string[]
}

export interface FormSchema {
  fields: FormField[]
  validation: ValidationRule[]
  layout: LayoutConfig
  metadata: FormMetadata
}

export interface FormField {
  id: string
  name: string
  label: string
  type: string
  required: boolean
  validation?: any
  options?: any[]
  conditional?: ConditionalRule
}

export interface ValidationRule {
  field: string
  rule: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface LayoutConfig {
  sections: Section[]
  theme: string
}

export interface Section {
  title: string
  fields: string[]
  collapsible: boolean
}

export interface FormMetadata {
  estimatedTime: number
  language: string
  category: string
}

export interface ConditionalRule {
  field: string
  operator: string
  value: any
}

export interface FormResponse extends BaseRecord {
  responseId: string
  formId: string
  formVersion: number
  participantId?: string
  householdId?: string
  sampleId?: string
  responses: { [fieldName: string]: any }
  submissionStatus: 'draft' | 'completed' | 'validated'
  validationErrors: ValidationError[]
  gpsLocation?: { lat: number; lng: number }
  submissionTimestamp?: string
  reviewedBy?: string
  projectId: string
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ProjectMetadata extends BaseRecord {
  projectId: string
  projectName: string
  projectCode: string
  description: string
  principalInvestigator: string
  studyPeriod: { start: string; end: string }
  targetSampleSize: number
  regions: string[]
  districts: string[]
  assignments: Assignment[]
  milestones: Milestone[]
  samplingQuotas: SamplingQuota[]
  activeModules: string[]
  configurations: { [key: string]: any }
}

export interface Assignment {
  assignmentId: string
  collectorId: string
  assignmentType: 'household' | 'sample' | 'survey'
  targetCount: number
  completedCount: number
  deadline: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'active' | 'completed' | 'overdue'
}

export interface Milestone {
  milestoneId: string
  title: string
  description: string
  targetDate: string
  completionDate?: string
  status: 'pending' | 'active' | 'completed' | 'delayed'
  dependencies: string[]
}

export interface SamplingQuota {
  quotaId: string
  sampleType: string
  targetCount: number
  collectedCount: number
  region?: string
  district?: string
  demographicCriteria?: { [key: string]: any }
}

export interface SyncQueueItem extends BaseRecord {
  queueId: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  objectStore: string
  recordId: string
  data: any
  priority: number
  retryCount: number
  maxRetries: number
  lastAttempt?: string
  errorMessage?: string
  conflictResolution?: 'server_wins' | 'client_wins' | 'manual_merge'
}

export interface AuditTrail extends BaseRecord {
  auditId: string
  objectStore: string
  recordId: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'CONFLICT'
  oldValue?: any
  newValue?: any
  userId: string
  sessionId: string
  ipAddress?: string
  userAgent?: string
  gpsLocation?: { lat: number; lng: number }
  reason?: string
  projectId: string
}

export interface Settings extends BaseRecord {
  settingKey: string
  settingValue: any
  category: 'project' | 'user' | 'system' | 'module'
  description: string
  isEncrypted: boolean
  accessLevel: 'public' | 'restricted' | 'admin'
  projectId?: string
}

// IndexedDB Schema Definition
export interface OfflineDBSchema {
  households: Household[]
  participants: Participant[]
  surveys: Survey[]
  samples: Sample[]
  forms: Form[]
  form_responses: FormResponse[]
  project_metadata: ProjectMetadata[]
  sync_queue: SyncQueueItem[]
  audit_trails: AuditTrail[]
  settings: Settings[]
}

// Offline-First Database Service
class OfflineFirstDB {
  private dbName = 'SLASH_FIELDWORK_DB'
  private dbVersion = 2 // Increased for new schema
  private db: IDBDatabase | null = null
  private deviceId: string
  private collectorId: string

  constructor() {
    this.deviceId = this.getOrCreateDeviceId()
    this.collectorId = this.getOrCreateCollectorSession()
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
        resolve()
        return
      }

      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('OfflineDB error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ OfflineFirstDB initialized successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores per specification
        const storeNames = [
          'households', 'participants', 'surveys', 'samples',
          'forms', 'form_responses', 'project_metadata',
          'sync_queue', 'audit_trails', 'settings'
        ]

        storeNames.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' })
            
            // Add standard indexes
            store.createIndex('syncStatus', 'syncStatus')
            store.createIndex('createdAt', 'createdAt')
            store.createIndex('updatedAt', 'updatedAt')
            store.createIndex('version', 'version')
            store.createIndex('collectorId', 'collectorId')
            
            // Add specific indexes per store
            if (storeName === 'participants') {
              store.createIndex('householdId', 'householdId')
              store.createIndex('projectId', 'projectId')
            } else if (storeName === 'samples') {
              store.createIndex('participantId', 'participantId')
              store.createIndex('sampleType', 'sampleType')
              store.createIndex('collectionTimestamp', 'collectionTimestamp')
            } else if (storeName === 'form_responses') {
              store.createIndex('formId', 'formId')
              store.createIndex('submissionStatus', 'submissionStatus')
            } else if (storeName === 'sync_queue') {
              store.createIndex('priority', 'priority')
              store.createIndex('operation', 'operation')
            } else if (storeName === 'audit_trails') {
              store.createIndex('objectStore', 'objectStore')
              store.createIndex('operation', 'operation')
              store.createIndex('userId', 'userId')
            }
          }
        })

        console.log('✅ OfflineFirstDB schema created/updated')
      }
    })
  }

  // Core CRUD Operations with Specification Compliance
  async create<T extends BaseRecord>(storeName: keyof OfflineDBSchema, data: Omit<T, keyof BaseRecord>): Promise<T> {
    if (!this.db) await this.init()

    const record: T = {
      ...data,
      id: uuidv4(),
      version: 1,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deviceId: this.deviceId,
      collectorId: this.collectorId,
      integrityHash: this.generateIntegrityHash(data)
    } as T

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.add(record)

      request.onsuccess = () => {
        // Add to sync queue
        this.addToSyncQueue('CREATE', storeName, record.id, record)
        // Log audit trail
        this.logAuditTrail('CREATE', storeName, record.id, undefined, record)
        resolve(record)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async update<T extends BaseRecord>(storeName: keyof OfflineDBSchema, id: string, updates: Partial<T>): Promise<void> {
    if (!this.db) await this.init()

    return new Promise(async (resolve, reject) => {
      // Get existing record first
      const existing = await this.getById<T>(storeName, id)
      if (!existing) {
        reject(new Error('Record not found'))
        return
      }

      const updated: T = {
        ...existing,
        ...updates,
        version: existing.version + 1,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
        integrityHash: this.generateIntegrityHash({ ...existing, ...updates })
      } as T

      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(updated)

      request.onsuccess = () => {
        // Add to sync queue
        this.addToSyncQueue('UPDATE', storeName, id, updated)
        // Log audit trail
        this.logAuditTrail('UPDATE', storeName, id, existing, updated)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getById<T>(storeName: keyof OfflineDBSchema, id: string): Promise<T | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAll<T>(storeName: keyof OfflineDBSchema, filter?: { index?: string; value?: any }): Promise<T[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      
      let request: IDBRequest
      if (filter && filter.index) {
        const index = store.index(filter.index)
        request = filter.value ? index.getAll(filter.value) : index.getAll()
      } else {
        request = store.getAll()
      }

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName: keyof OfflineDBSchema, id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise(async (resolve, reject) => {
      // Get existing record for audit trail
      const existing = await this.getById(storeName, id)
      
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => {
        // Add to sync queue
        this.addToSyncQueue('DELETE', storeName, id, { id })
        // Log audit trail
        if (existing) {
          this.logAuditTrail('DELETE', storeName, id, existing, undefined)
        }
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Sync Queue Management
  private async addToSyncQueue(operation: 'CREATE' | 'UPDATE' | 'DELETE', objectStore: string, recordId: string, data: any): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: uuidv4(),
      queueId: uuidv4(),
      operation,
      objectStore,
      recordId,
      data,
      priority: 1,
      retryCount: 0,
      maxRetries: 3,
      version: 1,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deviceId: this.deviceId,
      collectorId: this.collectorId
    }

    const transaction = this.db!.transaction(['sync_queue'], 'readwrite')
    const store = transaction.objectStore('sync_queue')
    store.add(queueItem)
  }

  // Audit Trail Logging
  private async logAuditTrail(operation: string, objectStore: string, recordId: string, oldValue: any, newValue: any): Promise<void> {
    const auditRecord: AuditTrail = {
      id: uuidv4(),
      auditId: uuidv4(),
      objectStore,
      recordId,
      operation: operation as any,
      oldValue,
      newValue,
      userId: this.collectorId,
      sessionId: this.collectorId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      version: 1,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deviceId: this.deviceId,
      collectorId: this.collectorId,
      projectId: newValue?.projectId || oldValue?.projectId || 'unknown'
    }

    const transaction = this.db!.transaction(['audit_trails'], 'readwrite')
    const store = transaction.objectStore('audit_trails')
    store.add(auditRecord)
  }

  // Utility Methods
  private getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let deviceId = localStorage.getItem('slash_device_id')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('slash_device_id', deviceId)
    }
    return deviceId
  }

  private getOrCreateCollectorSession(): string {
    if (typeof window === 'undefined') return 'server'
    
    let sessionId = sessionStorage.getItem('slash_collector_session')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('slash_collector_session', sessionId)
    }
    return sessionId
  }

  private generateIntegrityHash(data: any): string {
    // Simple hash for integrity checking
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  // Sync Status Management
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return this.getAll<SyncQueueItem>('sync_queue', { index: 'syncStatus', value: 'pending' })
  }

  async markAsSynced(queueId: string): Promise<void> {
    await this.update<SyncQueueItem>('sync_queue', queueId, { syncStatus: 'synced' })
  }

  async markSyncError(queueId: string, error: string): Promise<void> {
    const item = await this.getById<SyncQueueItem>('sync_queue', queueId)
    if (item) {
      await this.update<SyncQueueItem>('sync_queue', queueId, {
        syncStatus: 'error',
        retryCount: item.retryCount + 1,
        errorMessage: error,
        lastAttempt: new Date().toISOString()
      })
    }
  }

  // Performance: Cursor-based pagination
  async getCursorPage<T>(storeName: keyof OfflineDBSchema, pageSize: number = 50, cursor?: string): Promise<{ data: T[], nextCursor?: string }> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.openCursor()

      const results: T[] = []
      let count = 0
      let foundStart = !cursor

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (!foundStart && cursor.key !== cursor) {
            cursor.continue()
            return
          }
          foundStart = true

          if (count < pageSize) {
            results.push(cursor.value)
            count++
            cursor.continue()
          } else {
            resolve({
              data: results,
              nextCursor: cursor.key as string
            })
          }
        } else {
          resolve({
            data: results
          })
        }
      }

      request.onerror = () => reject(request.error)
    })
  }
}

// Singleton instance
export const offlineDB = new OfflineFirstDB()

// Auto-initialize
if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  offlineDB.init()
    .then(() => console.log('🎉 OfflineFirstDB ready for fieldwork'))
    .catch((error) => console.error('❌ OfflineFirstDB initialization failed:', error))
}

export default offlineDB
