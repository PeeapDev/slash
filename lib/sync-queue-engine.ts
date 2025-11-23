// Sync Queue Engine - Monitors network and syncs IndexedDB data to cloud
import { offlineDB, SyncQueueItem } from './offline-first-db'

export class SyncQueueEngine {
  private isRunning = false
  private syncInterval: NodeJS.Timeout | null = null
  private networkCheckInterval: NodeJS.Timeout | null = null
  private isOnline = false
  
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false
    console.log('🔄 SyncQueueEngine initialized')
  }

  // Start the sync engine
  async start() {
    if (this.isRunning) {
      console.log('⚠️ SyncQueueEngine already running')
      return
    }

    this.isRunning = true
    console.log('🚀 Starting SyncQueueEngine...')
    
    // Initialize IndexedDB
    await offlineDB.init()
    
    // Start network monitoring
    this.startNetworkMonitoring()
    
    // Start sync loop
    this.startSyncLoop()
    
    console.log('✅ SyncQueueEngine started successfully')
  }

  // Stop the sync engine
  stop() {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval)
      this.networkCheckInterval = null
    }
    
    console.log('🛑 SyncQueueEngine stopped')
  }

  // Monitor network status
  private startNetworkMonitoring() {
    // Listen for network events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))
    }

    // Periodic network check (every 30 seconds)
    this.networkCheckInterval = setInterval(async () => {
      await this.checkNetworkConnectivity()
    }, 30000)

    // Initial check
    this.checkNetworkConnectivity()
  }

  private handleOnline() {
    console.log('🌐 Network: ONLINE - Starting immediate sync')
    this.isOnline = true
    this.performSync() // Immediate sync when coming online
  }

  private handleOffline() {
    console.log('📵 Network: OFFLINE - Pausing sync')
    this.isOnline = false
  }

  private async checkNetworkConnectivity() {
    if (!navigator.onLine) {
      this.isOnline = false
      return
    }

    try {
      // Test actual connectivity with a lightweight request
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      })
      this.isOnline = true
    } catch (error) {
      console.log('📵 Connectivity check failed - marking as offline')
      this.isOnline = false
    }
  }

  // Start the sync loop
  private startSyncLoop() {
    // Sync every 2 minutes when online
    this.syncInterval = setInterval(async () => {
      if (this.isOnline) {
        await this.performSync()
      }
    }, 120000) // 2 minutes
  }

  // Main sync function
  private async performSync() {
    if (!this.isOnline) {
      console.log('📵 Skipping sync - offline')
      return
    }

    try {
      console.log('🔄 Starting sync process...')
      
      // Get all pending sync queue items
      const queueItems = await offlineDB.getAll<SyncQueueItem>('sync_queue')
      const pendingItems = queueItems.filter(item => item.status === 'pending')
      
      if (pendingItems.length === 0) {
        console.log('✅ Sync queue empty - nothing to sync')
        return
      }

      console.log(`🔄 Processing ${pendingItems.length} queued items...`)

      let successCount = 0
      let failureCount = 0

      // Process each queue item
      for (const item of pendingItems) {
        try {
          const success = await this.syncItem(item)
          if (success) {
            // Mark as synced
            await offlineDB.update('sync_queue', item.id, {
              ...item,
              status: 'synced',
              syncedAt: new Date().toISOString(),
              retryCount: item.retryCount || 0
            })
            successCount++
          } else {
            // Increment retry count
            await offlineDB.update('sync_queue', item.id, {
              ...item,
              retryCount: (item.retryCount || 0) + 1,
              lastError: 'Sync failed'
            })
            failureCount++
          }
        } catch (error) {
          console.error(`❌ Error syncing item ${item.id}:`, error)
          
          // Update retry count and error
          await offlineDB.update('sync_queue', item.id, {
            ...item,
            retryCount: (item.retryCount || 0) + 1,
            lastError: error instanceof Error ? error.message : 'Unknown error'
          })
          failureCount++
        }
      }

      console.log(`✅ Sync complete: ${successCount} synced, ${failureCount} failed`)

    } catch (error) {
      console.error('❌ Sync process error:', error)
    }
  }

  // Sync individual item to cloud (placeholder for now)
  private async syncItem(item: SyncQueueItem): Promise<boolean> {
    // TODO: Replace with actual API endpoints when backend is ready
    console.log(`🔄 Syncing ${item.operation} on ${item.tableName}:`, item.recordId)
    
    try {
      // Simulate API call for now
      const apiEndpoint = this.getApiEndpoint(item.tableName, item.operation)
      
      if (!apiEndpoint) {
        console.log(`⚠️ No API endpoint for ${item.tableName} ${item.operation} - marking as synced`)
        return true // Mark as synced since we don't have backend yet
      }

      // For now, just simulate successful sync
      // In future, this will be actual HTTP requests
      console.log(`✅ Simulated sync: ${apiEndpoint}`)
      return true

      /* 
      // Future implementation with real API:
      const response = await fetch(apiEndpoint, {
        method: item.operation === 'create' ? 'POST' : 
               item.operation === 'update' ? 'PUT' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: item.operation !== 'delete' ? JSON.stringify(item.data) : undefined
      })
      
      return response.ok
      */
      
    } catch (error) {
      console.error(`❌ Failed to sync ${item.recordId}:`, error)
      return false
    }
  }

  // Get API endpoint for table and operation
  private getApiEndpoint(tableName: string, operation: string): string | null {
    // Map IndexedDB tables to API endpoints
    const endpointMap: Record<string, string> = {
      'samples': '/api/samples',
      'participants': '/api/participants', 
      'households': '/api/households',
      'projects': '/api/projects',
      'sample_types': '/api/sample-types'
    }

    const baseEndpoint = endpointMap[tableName]
    if (!baseEndpoint) {
      return null
    }

    return baseEndpoint
  }

  // Get sync status
  async getSyncStatus() {
    const queueItems = await offlineDB.getAll<SyncQueueItem>('sync_queue')
    
    return {
      totalItems: queueItems.length,
      pendingItems: queueItems.filter(i => i.status === 'pending').length,
      syncedItems: queueItems.filter(i => i.status === 'synced').length,
      failedItems: queueItems.filter(i => i.retryCount && i.retryCount > 3).length,
      isOnline: this.isOnline,
      isRunning: this.isRunning
    }
  }

  // Force sync now (manual trigger)
  async forceSyncNow() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }
    
    console.log('🚀 Force sync triggered')
    await this.performSync()
  }

  // Clear synced items (cleanup)
  async clearSyncedItems() {
    const queueItems = await offlineDB.getAll<SyncQueueItem>('sync_queue')
    const syncedItems = queueItems.filter(i => i.status === 'synced')
    
    for (const item of syncedItems) {
      await offlineDB.delete('sync_queue', item.id)
    }
    
    console.log(`🧹 Cleared ${syncedItems.length} synced items from queue`)
  }
}

// Global sync engine instance
export const syncEngine = new SyncQueueEngine()

// Auto-start sync engine in browser environment
if (typeof window !== 'undefined') {
  // Start after a short delay to let the app initialize
  setTimeout(() => {
    syncEngine.start().catch(console.error)
  }, 2000)
}
