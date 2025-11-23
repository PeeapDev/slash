"use client"

import { indexedDBService } from './indexdb-service'

// Migration service to transition from localStorage to IndexedDB
class MigrationService {
  private migrated = false

  // localStorage keys that need to be migrated
  private readonly localStorageKeys = {
    // Forms
    forms: 'slash_forms',
    form_responses: 'slash_form_responses',
    
    // Data collections
    household_data: 'slash_household_data',
    participant_data: 'slash_participant_data', 
    sample_collection_data: 'slash_sample_collection_data',
    lab_analysis: 'slash_lab_analysis',
    audit_flags: 'slash_audit_flags',
    sync_status: 'slash_sync_status',
    
    // Admin data
    admin_users: 'admin_users',
    regions: 'regions',
    districts: 'districts', 
    audit_logs: 'audit_logs',
    projects: 'projects',
    
    // Settings
    ai_settings: 'slash-ai-settings',
    app_settings: 'slash_app_settings'
  }

  async migrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return
    if (this.migrated) return

    console.log('🚀 Starting migration from localStorage to IndexedDB...')

    try {
      // Check if migration has already been done
      const migrationFlag = localStorage.getItem('indexdb_migration_completed')
      if (migrationFlag === 'true') {
        console.log('✅ Migration already completed')
        this.migrated = true
        return
      }

      // Initialize IndexedDB
      await indexedDBService.init()

      let migratedCount = 0
      const totalKeys = Object.keys(this.localStorageKeys).length

      // Migrate each data type
      for (const [storeName, localStorageKey] of Object.entries(this.localStorageKeys)) {
        try {
          const localData = localStorage.getItem(localStorageKey)
          
          if (localData) {
            const parsedData = JSON.parse(localData)
            
            if (Array.isArray(parsedData)) {
              // Migrate array data
              await indexedDBService.setAll(storeName as any, parsedData)
              console.log(`✅ Migrated ${parsedData.length} items from ${storeName}`)
            } else {
              // Migrate single object data (like settings)
              const dataWithId = { id: 'main', ...parsedData }
              await indexedDBService.set(storeName as any, dataWithId)
              console.log(`✅ Migrated settings from ${storeName}`)
            }
            
            migratedCount++
          } else {
            console.log(`⏭️  No data found for ${storeName}`)
          }
        } catch (error) {
          console.error(`❌ Error migrating ${storeName}:`, error)
        }
      }

      // Initialize sync metadata
      await indexedDBService.updateSyncMetadata({
        lastSync: new Date().toISOString(),
        pendingActions: 0,
        connectionStatus: navigator.onLine ? 'online' : 'offline'
      })

      // Mark migration as complete
      localStorage.setItem('indexdb_migration_completed', 'true')
      this.migrated = true

      console.log(`🎉 Migration completed! Migrated ${migratedCount}/${totalKeys} data stores`)
      
      // Optional: Clear localStorage after successful migration
      // await this.clearLocalStorageAfterMigration()

    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }

  async clearLocalStorageAfterMigration(): Promise<void> {
    if (typeof window === 'undefined') return

    console.log('🧹 Clearing localStorage after successful migration...')
    
    try {
      // Clear specific keys we migrated
      Object.values(this.localStorageKeys).forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log('✅ localStorage cleared successfully')
    } catch (error) {
      console.error('❌ Error clearing localStorage:', error)
    }
  }

  async exportLocalStorageForBackup(): Promise<Record<string, any>> {
    if (typeof window === 'undefined') return {}

    const backup: Record<string, any> = {}

    Object.entries(this.localStorageKeys).forEach(([storeName, localStorageKey]) => {
      const data = localStorage.getItem(localStorageKey)
      if (data) {
        try {
          backup[storeName] = JSON.parse(data)
        } catch (error) {
          backup[storeName] = data // Store as string if not JSON
        }
      }
    })

    return backup
  }

  async rollbackToLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return

    console.log('🔄 Rolling back to localStorage...')

    try {
      // Export data from IndexedDB
      const data = await indexedDBService.exportData()

      // Convert back to localStorage format
      Object.entries(data).forEach(([storeName, storeData]) => {
        const localStorageKey = this.localStorageKeys[storeName as keyof typeof this.localStorageKeys]
        if (localStorageKey && storeData) {
          localStorage.setItem(localStorageKey, JSON.stringify(storeData))
        }
      })

      // Remove migration flag
      localStorage.removeItem('indexdb_migration_completed')
      
      console.log('✅ Rollback completed')
    } catch (error) {
      console.error('❌ Rollback failed:', error)
      throw error
    }
  }

  isMigrated(): boolean {
    return this.migrated || localStorage.getItem('indexdb_migration_completed') === 'true'
  }

  async getMigrationStatus(): Promise<{
    completed: boolean
    localStorageSize: number
    indexedDBSize: number
    availableData: string[]
  }> {
    const status = {
      completed: this.isMigrated(),
      localStorageSize: 0,
      indexedDBSize: 0,
      availableData: [] as string[]
    }

    if (typeof window === 'undefined') return status

    // Calculate localStorage size
    Object.values(this.localStorageKeys).forEach(key => {
      const data = localStorage.getItem(key)
      if (data) {
        status.localStorageSize += data.length
        status.availableData.push(key)
      }
    })

    // Calculate IndexedDB size (approximate)
    try {
      const data = await indexedDBService.exportData()
      const jsonString = JSON.stringify(data)
      status.indexedDBSize = jsonString.length
    } catch (error) {
      console.error('Error calculating IndexedDB size:', error)
    }

    return status
  }
}

// Singleton instance
export const migrationService = new MigrationService()

// Auto-migrate on module load (browser only)
if (typeof window !== 'undefined') {
  // Run migration after a short delay to avoid blocking initial render
  setTimeout(() => {
    migrationService.migrateFromLocalStorage()
      .then(() => console.log('🎉 Auto-migration completed'))
      .catch((error) => console.error('❌ Auto-migration failed:', error))
  }, 1000)
}

export default migrationService
