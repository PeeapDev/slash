"use client"

// Background Sync Engine - Specification Compliant
// Handles automatic and manual sync with conflict resolution

import { offlineDB, SyncQueueItem, AuditTrail, ProjectMetadata, Form, Settings } from './offline-first-db'

export type SyncMode = 'automatic' | 'manual'
export type ConflictStrategy = 'server_wins' | 'client_wins' | 'manual_merge'

export interface SyncResult {
  success: boolean
  itemsSynced: number
  itemsFailed: number
  conflicts: ConflictItem[]
  errors: string[]
  duration: number
}

export interface ConflictItem {
  recordId: string
  objectStore: string
  serverVersion: any
  clientVersion: any
  strategy: ConflictStrategy
  resolution?: 'resolved' | 'pending'
}

export interface NetworkStatus {
  isOnline: boolean
  lastChecked: string
  connectionType?: string
}

class SyncEngine {
  private issyncing = false
  private syncInterval: NodeJS.Timeout | null = null
  private networkStatus: NetworkStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
    lastChecked: new Date().toISOString()
  }
  
  private listeners: Array<(result: SyncResult) => void> = []
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.setupNetworkDetection()
      this.setupAutomaticSync()
    }
  }

  // Network Detection Setup
  private setupNetworkDetection(): void {
    const updateNetworkStatus = () => {
      this.networkStatus = {
        isOnline: navigator.onLine,
        lastChecked: new Date().toISOString(),
        connectionType: this.getConnectionType()
      }

      console.log(`🌐 Network status: ${this.networkStatus.isOnline ? 'Online' : 'Offline'}`)

      // Trigger automatic sync when coming online
      if (this.networkStatus.isOnline) {
        setTimeout(() => this.triggerAutomaticSync(), 2000)
      }
    }

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    
    // Initial check
    updateNetworkStatus()
  }

  private getConnectionType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      return connection.effectiveType || 'unknown'
    }
    return 'unknown'
  }

  // Automatic Sync Setup
  private setupAutomaticSync(): void {
    // Check every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.networkStatus.isOnline && !this.issyncing) {
        this.triggerAutomaticSync()
      }
    }, 30000)

    // Also sync when page becomes visible (user returns to app)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.networkStatus.isOnline && !this.issyncing) {
        this.triggerAutomaticSync()
      }
    })
  }

  // Automatic Sync Trigger
  private async triggerAutomaticSync(): Promise<void> {
    try {
      const pendingItems = await offlineDB.getPendingSyncItems()
      
      if (pendingItems.length > 0) {
        console.log(`🔄 Auto-sync: ${pendingItems.length} items pending`)
        await this.executeSync('automatic')
      }
    } catch (error) {
      console.error('❌ Auto-sync failed:', error)
    }
  }

  // Manual Sync - Fieldworker Triggered
  async syncNow(): Promise<SyncResult> {
    console.log('🔄 Manual sync initiated by fieldworker')
    return this.executeSync('manual')
  }

  // Main Sync Execution
  private async executeSync(mode: SyncMode): Promise<SyncResult> {
    const startTime = Date.now()
    
    if (this.issyncing) {
      console.log('⏳ Sync already in progress')
      return {
        success: false,
        itemsSynced: 0,
        itemsFailed: 0,
        conflicts: [],
        errors: ['Sync already in progress'],
        duration: 0
      }
    }

    if (!this.networkStatus.isOnline) {
      console.log('📴 Cannot sync - device is offline')
      return {
        success: false,
        itemsSynced: 0,
        itemsFailed: 0,
        conflicts: [],
        errors: ['Device is offline'],
        duration: 0
      }
    }

    this.issyncing = true
    let itemsSynced = 0
    let itemsFailed = 0
    const conflicts: ConflictItem[] = []
    const errors: string[] = []

    try {
      console.log(`🚀 Starting ${mode} sync...`)

      // Phase 1: Pull fresh project updates, forms, assignments
      await this.pullGlobalUpdates()

      // Phase 2: Push pending local changes
      const pendingItems = await offlineDB.getPendingSyncItems()
      console.log(`📤 Syncing ${pendingItems.length} pending items`)

      for (const item of pendingItems) {
        try {
          const result = await this.syncItem(item)
          
          if (result.success) {
            itemsSynced++
            await offlineDB.markAsSynced(item.queueId)
          } else if (result.conflict) {
            conflicts.push(result.conflict)
            await this.handleConflict(item, result.conflict)
          } else {
            itemsFailed++
            await offlineDB.markSyncError(item.queueId, result.error || 'Unknown error')
            errors.push(`${item.objectStore}/${item.recordId}: ${result.error}`)
          }
        } catch (error) {
          itemsFailed++
          const errorMsg = (error as Error).message || 'Unknown error'
          await offlineDB.markSyncError(item.queueId, errorMsg)
          errors.push(`${item.objectStore}/${item.recordId}: ${errorMsg}`)
        }
      }

      const duration = Date.now() - startTime
      const result: SyncResult = {
        success: itemsFailed === 0,
        itemsSynced,
        itemsFailed,
        conflicts,
        errors,
        duration
      }

      console.log(`✅ Sync completed: ${itemsSynced} synced, ${itemsFailed} failed, ${conflicts.length} conflicts (${duration}ms)`)
      
      // Notify listeners
      this.notifyListeners(result)
      
      return result

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMsg = (error as Error).message || 'Unknown sync error'
      console.error('❌ Sync failed:', error)
      
      const result: SyncResult = {
        success: false,
        itemsSynced,
        itemsFailed: itemsFailed + 1,
        conflicts,
        errors: [...errors, errorMsg],
        duration
      }
      
      this.notifyListeners(result)
      return result
      
    } finally {
      this.issyncing = false
    }
  }

  // Pull Global Updates (Server Wins)
  private async pullGlobalUpdates(): Promise<void> {
    try {
      console.log('📥 Pulling global updates...')

      // Pull form definitions
      const formsResponse = await fetch('/api/forms')
      if (formsResponse.ok) {
        const forms = await formsResponse.json()
        // Update local forms (server wins)
        for (const form of forms.data || []) {
          // Check if we have a newer version locally
          const localForm = await offlineDB.getById<Form>('forms', form.id)
          if (!localForm || form.version > localForm.version) {
            await offlineDB.create('forms', form)
          }
        }
      }

      // Pull project metadata
      const projectsResponse = await fetch('/api/projects')
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json()
        for (const project of projects.data || []) {
          const localProject = await offlineDB.getById<ProjectMetadata>('project_metadata', project.id)
          if (!localProject || project.version > localProject.version) {
            await offlineDB.create('project_metadata', project)
          }
        }
      }

      console.log('✅ Global updates pulled successfully')
    } catch (error) {
      console.error('❌ Failed to pull global updates:', error)
      throw error
    }
  }

  // Sync Individual Item
  private async syncItem(item: SyncQueueItem): Promise<{
    success: boolean
    conflict?: ConflictItem
    error?: string
  }> {
    try {
      const endpoint = this.getEndpointForStore(item.objectStore)
      
      switch (item.operation) {
        case 'CREATE':
          return await this.syncCreate(endpoint, item)
        case 'UPDATE':
          return await this.syncUpdate(endpoint, item)
        case 'DELETE':
          return await this.syncDelete(endpoint, item)
        default:
          throw new Error(`Unknown operation: ${item.operation}`)
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  private async syncCreate(endpoint: string, item: SyncQueueItem): Promise<any> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.data)
    })

    if (response.ok) {
      return { success: true }
    } else if (response.status === 409) {
      // Conflict - record already exists
      const serverData = await response.json()
      return {
        success: false,
        conflict: {
          recordId: item.recordId,
          objectStore: item.objectStore,
          serverVersion: serverData.data,
          clientVersion: item.data,
          strategy: this.getConflictStrategy(item.objectStore)
        }
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  private async syncUpdate(endpoint: string, item: SyncQueueItem): Promise<any> {
    const response = await fetch(`${endpoint}/${item.recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.data)
    })

    if (response.ok) {
      return { success: true }
    } else if (response.status === 409) {
      // Conflict - newer version on server
      const serverData = await response.json()
      return {
        success: false,
        conflict: {
          recordId: item.recordId,
          objectStore: item.objectStore,
          serverVersion: serverData.data,
          clientVersion: item.data,
          strategy: this.getConflictStrategy(item.objectStore)
        }
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  private async syncDelete(endpoint: string, item: SyncQueueItem): Promise<any> {
    const response = await fetch(`${endpoint}/${item.recordId}`, {
      method: 'DELETE'
    })

    if (response.ok || response.status === 404) {
      return { success: true }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  // Conflict Resolution per Specification
  private getConflictStrategy(objectStore: string): ConflictStrategy {
    // Server wins for global definitions
    if (['forms', 'project_metadata', 'settings'].includes(objectStore)) {
      return 'server_wins'
    }
    
    // Client wins for child records (fieldwork data)
    if (['households', 'participants', 'samples', 'surveys', 'form_responses'].includes(objectStore)) {
      return 'client_wins'
    }
    
    // Manual merge for complex conflicts
    return 'manual_merge'
  }

  private async handleConflict(item: SyncQueueItem, conflict: ConflictItem): Promise<void> {
    console.log(`⚠️ Conflict detected for ${conflict.objectStore}/${conflict.recordId}`)
    
    switch (conflict.strategy) {
      case 'server_wins':
        // Accept server version
        await offlineDB.update(item.objectStore as any, item.recordId, {
          ...conflict.serverVersion,
          syncStatus: 'synced'
        })
        await offlineDB.markAsSynced(item.queueId)
        console.log(`✅ Conflict resolved: Server wins for ${conflict.recordId}`)
        break
        
      case 'client_wins':
        // Force push client version (if newer timestamp)
        if (this.isClientNewer(conflict.clientVersion, conflict.serverVersion)) {
          // Retry sync with force flag
          await this.forcePushClientVersion(item)
          console.log(`✅ Conflict resolved: Client wins for ${conflict.recordId}`)
        } else {
          // Accept server version
          await this.handleConflict(item, { ...conflict, strategy: 'server_wins' })
        }
        break
        
      case 'manual_merge':
        // Store conflict for manual resolution
        await this.storeConflictForManualResolution(conflict)
        console.log(`⏳ Conflict stored for manual resolution: ${conflict.recordId}`)
        break
    }

    // Log audit trail
    await this.logConflictResolution(conflict)
  }

  private isClientNewer(client: any, server: any): boolean {
    const clientTime = new Date(client.updatedAt).getTime()
    const serverTime = new Date(server.updatedAt).getTime()
    return clientTime > serverTime
  }

  private async forcePushClientVersion(item: SyncQueueItem): Promise<void> {
    const endpoint = this.getEndpointForStore(item.objectStore)
    const response = await fetch(`${endpoint}/${item.recordId}/force`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'X-Force-Update': 'true'
      },
      body: JSON.stringify(item.data)
    })

    if (response.ok) {
      await offlineDB.markAsSynced(item.queueId)
    } else {
      throw new Error(`Force push failed: ${response.statusText}`)
    }
  }

  private async storeConflictForManualResolution(conflict: ConflictItem): Promise<void> {
    // Store in a special conflicts object store or settings
    await offlineDB.create('settings', {
      settingKey: `conflict_${conflict.recordId}`,
      settingValue: conflict,
      category: 'system',
      description: 'Unresolved sync conflict requiring manual intervention',
      isEncrypted: false,
      accessLevel: 'admin'
    })
  }

  private async logConflictResolution(conflict: ConflictItem): Promise<void> {
    const auditRecord: Omit<AuditTrail, 'id' | 'version' | 'syncStatus' | 'createdAt' | 'updatedAt' | 'deviceId' | 'collectorId'> = {
      auditId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      objectStore: conflict.objectStore,
      recordId: conflict.recordId,
      operation: 'CONFLICT',
      oldValue: conflict.clientVersion,
      newValue: conflict.serverVersion,
      userId: 'sync_engine',
      sessionId: 'sync_session',
      reason: `Conflict resolved using ${conflict.strategy} strategy`,
      projectId: conflict.clientVersion?.projectId || 'unknown'
    }

    await offlineDB.create('audit_trails', auditRecord)
  }

  // Utility Methods
  private getEndpointForStore(objectStore: string): string {
    const endpoints = {
      households: '/api/households',
      participants: '/api/participants', 
      surveys: '/api/surveys',
      samples: '/api/samples',
      forms: '/api/forms',
      form_responses: '/api/form-responses',
      project_metadata: '/api/projects',
      settings: '/api/settings'
    }
    
    return endpoints[objectStore as keyof typeof endpoints] || `/api/${objectStore}`
  }

  // Event Listeners
  onSyncComplete(listener: (result: SyncResult) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(result: SyncResult): void {
    this.listeners.forEach(listener => {
      try {
        listener(result)
      } catch (error) {
        console.error('Error in sync listener:', error)
      }
    })
  }

  // Status Methods
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus }
  }

  isSyncing(): boolean {
    return this.issyncing
  }

  async getSyncSummary(): Promise<{
    pending: number
    synced: number
    errors: number
    conflicts: number
  }> {
    const [pending, errors] = await Promise.all([
      offlineDB.getAll<SyncQueueItem>('sync_queue', { index: 'syncStatus', value: 'pending' }),
      offlineDB.getAll<SyncQueueItem>('sync_queue', { index: 'syncStatus', value: 'error' })
    ])

    const conflicts = await offlineDB.getAll<Settings>('settings', { 
      index: 'category', 
      value: 'system' 
    })
    const conflictCount = conflicts.filter(s => s.settingKey.startsWith('conflict_')).length

    return {
      pending: pending.length,
      synced: 0, // Would need to track synced items separately
      errors: errors.length,
      conflicts: conflictCount
    }
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.listeners = []
  }
}

// Singleton instance
export const syncEngine = new SyncEngine()

export default syncEngine
