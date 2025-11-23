"use client"

// IndexedDB Service for Offline-First PWA
// Replaces localStorage with IndexedDB for better performance and storage

interface DBSchema {
  // Forms and Responses
  forms: Form[]
  form_responses: FormResponse[]
  
  // Core Data Collections
  household_data: HouseholdData[]
  participant_data: ParticipantData[]
  sample_collection_data: SampleCollectionData[]
  lab_analysis: LabAnalysis[]
  audit_flags: AuditFlag[]
  sync_status: SyncStatus[]
  
  // Admin Management
  admin_users: AdminUser[]
  regions: Region[]
  districts: District[]
  audit_logs: AuditLog[]
  projects: Project[]
  
  // AI and Settings
  ai_settings: AISettings
  app_settings: any
  
  // PWA Specific
  offline_queue: OfflineAction[]
  sync_metadata: SyncMetadata
}

interface OfflineAction {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: keyof DBSchema
  data: any
  timestamp: string
  synced: boolean
}

interface SyncMetadata {
  id: string
  lastSync: string
  pendingActions: number
  connectionStatus: 'online' | 'offline'
}

interface Form {
  id: string
  name: string
  description: string
  fields: any[]
  createdAt: string
  updatedAt: string
}

interface FormResponse {
  id: string
  formId: string
  data: any
  submittedAt: string
  submittedBy: string
}

interface HouseholdData {
  id: string
  householdId: string
  collectorName: string
  date: string
  location: string
  familySize: number
  waterSource: string
  sanitationFacility: string
  [key: string]: any
}

interface ParticipantData {
  id: string
  householdId: string
  participantId: string
  name: string
  age: number
  gender: string
  [key: string]: any
}

interface SampleCollectionData {
  id: string
  participantId: string
  sampleType: string
  collectionDate: string
  collectorId: string
  [key: string]: any
}

interface LabAnalysis {
  id: string
  sampleId: string
  analysisType: string
  results: any
  analyzedBy: string
  analyzedAt: string
  [key: string]: any
}

interface AuditFlag {
  id: string
  entityType: string
  entityId: string
  flagType: string
  description: string
  severity: 'low' | 'medium' | 'high'
  resolved: boolean
  [key: string]: any
}

interface SyncStatus {
  collectorId: string
  lastSync: string
  pendingUploads: number
  pendingDownloads: number
  [key: string]: any
}

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  [key: string]: any
}

interface Region {
  id: string
  name: string
  code: string
  [key: string]: any
}

interface District {
  id: string
  regionId: string
  name: string
  code: string
  [key: string]: any
}

interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  timestamp: string
  [key: string]: any
}

interface Project {
  id: string
  name: string
  code: string
  description: string
  [key: string]: any
}

interface AISettings {
  providers: any[]
  lastUpdated: string
  [key: string]: any
}

class IndexedDBService {
  private dbName = 'SLASH_PWA_DB'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve()
        return
      }

      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('IndexedDB error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB initialized successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores for all data types
        const stores = [
          'forms', 'form_responses', 'household_data', 'participant_data',
          'sample_collection_data', 'lab_analysis', 'audit_flags', 'sync_status',
          'admin_users', 'regions', 'districts', 'audit_logs', 'projects',
          'ai_settings', 'app_settings', 'offline_queue', 'sync_metadata'
        ]

        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' })
            
            // Add indexes for common queries
            if (storeName === 'form_responses') {
              store.createIndex('formId', 'formId')
              store.createIndex('submittedBy', 'submittedBy')
            } else if (storeName === 'participant_data') {
              store.createIndex('householdId', 'householdId')
            } else if (storeName === 'sample_collection_data') {
              store.createIndex('participantId', 'participantId')
              store.createIndex('collectorId', 'collectorId')
            } else if (storeName === 'audit_logs') {
              store.createIndex('userId', 'userId')
              store.createIndex('entityType', 'entityType')
            }
          }
        })

        console.log('IndexedDB schema created/updated')
      }
    })
  }

  // Generic CRUD operations
  async get<T>(storeName: keyof DBSchema, id: string): Promise<T | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAll<T>(storeName: keyof DBSchema): Promise<T[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async set<T>(storeName: keyof DBSchema, data: T): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async setAll<T>(storeName: keyof DBSchema, dataArray: T[]): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      // Clear existing data first
      const clearRequest = store.clear()
      
      clearRequest.onsuccess = () => {
        let completed = 0
        let hasError = false

        if (dataArray.length === 0) {
          resolve()
          return
        }

        dataArray.forEach(item => {
          const request = store.add(item)
          
          request.onsuccess = () => {
            completed++
            if (completed === dataArray.length && !hasError) {
              resolve()
            }
          }
          
          request.onerror = () => {
            if (!hasError) {
              hasError = true
              reject(request.error)
            }
          }
        })
      }
      
      clearRequest.onerror = () => reject(clearRequest.error)
    })
  }

  async delete(storeName: keyof DBSchema, id: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(storeName: keyof DBSchema): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Query by index
  async getByIndex<T>(storeName: keyof DBSchema, indexName: string, value: any): Promise<T[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Offline queue management
  async addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    const queueItem: OfflineAction = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      synced: false,
      ...action
    }

    await this.set('offline_queue', queueItem)
  }

  async getOfflineQueue(): Promise<OfflineAction[]> {
    return await this.getAll<OfflineAction>('offline_queue')
  }

  async markAsSynced(actionId: string): Promise<void> {
    const action = await this.get<OfflineAction>('offline_queue', actionId)
    if (action) {
      action.synced = true
      await this.set('offline_queue', action)
    }
  }

  async clearSyncedActions(): Promise<void> {
    const queue = await this.getOfflineQueue()
    const unsyncedActions = queue.filter(action => !action.synced)
    await this.setAll('offline_queue', unsyncedActions)
  }

  // Sync metadata management
  async updateSyncMetadata(metadata: Partial<SyncMetadata>): Promise<void> {
    const existing = await this.get<SyncMetadata>('sync_metadata', 'main') || {
      id: 'main',
      lastSync: new Date().toISOString(),
      pendingActions: 0,
      connectionStatus: 'online' as const
    }

    const updated = { ...existing, ...metadata }
    await this.set('sync_metadata', updated)
  }

  async getSyncMetadata(): Promise<SyncMetadata> {
    const metadata = await this.get<SyncMetadata>('sync_metadata', 'main')
    return metadata || {
      id: 'main',
      lastSync: new Date().toISOString(),
      pendingActions: 0,
      connectionStatus: 'online' as const
    }
  }

  // Export/Import for sync purposes
  async exportData(): Promise<Partial<DBSchema>> {
    const data: Partial<DBSchema> = {}
    
    const stores: (keyof DBSchema)[] = [
      'forms', 'form_responses', 'household_data', 'participant_data',
      'sample_collection_data', 'lab_analysis', 'audit_flags', 'sync_status',
      'admin_users', 'regions', 'districts', 'audit_logs', 'projects'
    ]

    for (const store of stores) {
      try {
        data[store] = await this.getAll(store) as any
      } catch (error) {
        console.error(`Error exporting ${store}:`, error)
      }
    }

    return data
  }

  async importData(data: Partial<DBSchema>): Promise<void> {
    for (const [storeName, storeData] of Object.entries(data)) {
      if (Array.isArray(storeData)) {
        try {
          await this.setAll(storeName as keyof DBSchema, storeData)
        } catch (error) {
          console.error(`Error importing ${storeName}:`, error)
        }
      }
    }
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService()

// Initialize on module load (browser only)
if (typeof window !== 'undefined') {
  indexedDBService.init()
    .then(() => console.log('IndexedDB service ready'))
    .catch((error) => console.error('IndexedDB initialization failed:', error))
}

export default indexedDBService
