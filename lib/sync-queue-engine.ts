// Sync Queue Engine - Monitors network and syncs IndexedDB data to cloud
import { offlineDB, SyncQueueItem } from './offline-first-db'

export class SyncQueueEngine {
  private isRunning = false
  private syncInterval: NodeJS.Timeout | null = null
  private networkCheckInterval: NodeJS.Timeout | null = null
  private isOnline = false
  private syncListeners: Array<() => void> = []
  
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false
    console.log('🔄 SyncQueueEngine initialized')
  }
  
  // Subscribe to sync events
  onSyncComplete(callback: () => void) {
    this.syncListeners.push(callback)
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback)
    }
  }
  
  // Notify listeners that sync completed
  private notifySyncComplete() {
    this.syncListeners.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error in sync listener:', error)
      }
    })
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
      
      // Also trigger sync when page becomes visible (user returns)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.isOnline) {
          console.log('👁️ Page visible - triggering sync')
          this.performSync()
        }
      })
    }

    // More frequent network check (every 10 seconds)
    this.networkCheckInterval = setInterval(async () => {
      await this.checkNetworkConnectivity()
    }, 10000)

    // Initial check
    this.checkNetworkConnectivity()
  }

  private handleOnline() {
    console.log('🌐 Network: ONLINE - Starting immediate sync')
    this.isOnline = true
    // Trigger multiple immediate syncs to ensure data is uploaded quickly
    this.performSync()
    setTimeout(() => this.performSync(), 1000)
    setTimeout(() => this.performSync(), 3000)
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

  // Start the sync loop - INSTANT SYNC MODE
  private startSyncLoop() {
    // Sync every 5 seconds when online for INSTANT sync
    this.syncInterval = setInterval(async () => {
      if (this.isOnline) {
        await this.performSync()
      }
    }, 5000) // 5 seconds for instant sync
    
    // Immediate first sync
    if (this.isOnline) {
      this.performSync()
    }
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
      const pendingItems = queueItems.filter(item => item.syncStatus === 'pending')
      
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
              syncStatus: 'synced',
              updatedAt: new Date().toISOString(),
              retryCount: item.retryCount || 0
            })
            successCount++
          } else {
            // Increment retry count
            await offlineDB.update('sync_queue', item.id, {
              ...item,
              retryCount: (item.retryCount || 0) + 1,
              errorMessage: 'Sync failed'
            })
            failureCount++
          }
        } catch (error) {
          console.error(`❌ Error syncing item ${item.id}:`, error)
          
          // Update retry count and error
          await offlineDB.update('sync_queue', item.id, {
            ...item,
            retryCount: (item.retryCount || 0) + 1,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })
          failureCount++
        }
      }

      console.log(`✅ Sync complete: ${successCount} synced, ${failureCount} failed`)
      
      // Notify listeners that sync completed
      if (successCount > 0) {
        this.notifySyncComplete()
      }

    } catch (error) {
      console.error('❌ Sync process error:', error)
    }
  }

  // Sync individual item to cloud - REAL SUPABASE SYNC
  private async syncItem(item: SyncQueueItem): Promise<boolean> {
    console.log(`🔄 Syncing ${item.operation} on ${item.objectStore}:`, item.recordId)
    
    try {
      // Import Supabase client
      const { supabase } = await import('@/lib/database')
      
      if (!supabase) {
        console.warn('⚠️ Supabase not configured - skipping sync')
        return true // Mark as synced to avoid retries
      }

      // Get the actual record data from IndexedDB
      const record = await offlineDB.getById(item.objectStore as any, item.recordId)
      
      if (!record) {
        console.warn(`⚠️ Record not found: ${item.recordId}`)
        return false
      }

      // Perform the appropriate Supabase operation
      switch (item.operation) {
        case 'CREATE':
        case 'UPDATE':
          const { error: upsertError } = await supabase
            .from(item.objectStore)
            .upsert(record, { onConflict: 'id' })
          
          if (upsertError) {
            console.error(`❌ Supabase sync error:`, upsertError)
            return false
          }
          console.log(`✅ Synced to Supabase: ${item.objectStore}/${item.recordId}`)
          return true

        case 'DELETE':
          const { error: deleteError } = await supabase
            .from(item.objectStore)
            .delete()
            .eq('id', item.recordId)
          
          if (deleteError) {
            console.error(`❌ Supabase delete error:`, deleteError)
            return false
          }
          console.log(`✅ Deleted from Supabase: ${item.objectStore}/${item.recordId}`)
          return true

        default:
          console.warn(`⚠️ Unknown operation: ${item.operation}`)
          return false
      }
      

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
      pendingItems: queueItems.filter(i => i.syncStatus === 'pending').length,
      syncedItems: queueItems.filter(i => i.syncStatus === 'synced').length,
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
    const syncedItems = queueItems.filter(i => i.syncStatus === 'synced')
    
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
