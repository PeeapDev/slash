"use client"

import React, { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RotateCw, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { syncEngine } from '@/lib/sync-queue-engine'

interface SyncStatusProps {
  compact?: boolean
}

export default function SyncStatus({ compact = false }: SyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState({
    totalItems: 0,
    pendingItems: 0,
    syncedItems: 0,
    failedItems: 0,
    isOnline: false,
    isRunning: false
  })
  const [isLoading, setIsLoading] = useState(false)

  const loadSyncStatus = async () => {
    try {
      const status = await syncEngine.getSyncStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error('❌ Error loading sync status:', error)
    }
  }

  useEffect(() => {
    loadSyncStatus()
    
    // Refresh every 10 seconds
    const interval = setInterval(loadSyncStatus, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const handleForceSync = async () => {
    if (!syncStatus.isOnline) {
      alert('Cannot sync while offline')
      return
    }

    setIsLoading(true)
    try {
      await syncEngine.forceSyncNow()
      await loadSyncStatus()
      console.log('✅ Manual sync completed')
    } catch (error) {
      console.error('❌ Manual sync failed:', error)
      alert('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearSynced = async () => {
    try {
      await syncEngine.clearSyncedItems()
      await loadSyncStatus()
      console.log('✅ Cleared synced items')
    } catch (error) {
      console.error('❌ Error clearing synced items:', error)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className={`flex items-center gap-1 ${syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
          {syncStatus.isRunning ? (
            <RotateCw size={14} className="animate-spin" />
          ) : (
            <Clock size={14} />
          )}
          <span>{syncStatus.pendingItems} queued</span>
        </div>
        
        {syncStatus.pendingItems > 0 && syncStatus.isOnline && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleForceSync}
            disabled={isLoading}
            className="h-6 px-2"
          >
            {isLoading ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <RotateCw size={12} />
            )}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Sync Queue Status</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          syncStatus.isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {syncStatus.isRunning ? (
            <RotateCw size={14} className="animate-spin" />
          ) : (
            <Clock size={14} />
          )}
          <span>{syncStatus.isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold text-blue-600">{syncStatus.pendingItems}</div>
          <div className="text-sm text-blue-600">Pending</div>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-green-600">{syncStatus.syncedItems}</div>
          <div className="text-sm text-green-600">Synced</div>
        </div>

        <div className="text-center p-4 bg-red-50 rounded-lg">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <div className="text-2xl font-bold text-red-600">{syncStatus.failedItems}</div>
          <div className="text-sm text-red-600">Failed</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <RotateCw className="w-8 h-8 mx-auto mb-2 text-gray-600" />
          <div className="text-2xl font-bold text-gray-600">{syncStatus.totalItems}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleForceSync}
          disabled={!syncStatus.isOnline || isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <RotateCw size={16} />
          )}
          {isLoading ? 'Syncing...' : 'Force Sync Now'}
        </Button>

        <Button
          variant="outline"
          onClick={handleClearSynced}
          disabled={syncStatus.syncedItems === 0}
          className="gap-2"
        >
          <CheckCircle size={16} />
          Clear Synced ({syncStatus.syncedItems})
        </Button>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          Sync engine is {syncStatus.isRunning ? 'running' : 'stopped'}. 
          {syncStatus.pendingItems > 0 && syncStatus.isOnline && 
            ' Items will automatically sync every 2 minutes when online.'
          }
        </p>
      </div>
    </Card>
  )
}
