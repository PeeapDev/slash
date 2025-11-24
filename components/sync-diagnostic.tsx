"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Loader } from "lucide-react"
import { offlineDB, SyncQueueItem } from "@/lib/offline-first-db"

export default function SyncDiagnostic() {
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  useEffect(() => {
    loadSyncQueue()
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadSyncQueue, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadSyncQueue = async () => {
    try {
      await offlineDB.init()
      const queue = await offlineDB.getAll<SyncQueueItem>('sync_queue')
      setSyncQueue(queue)
      setLastCheck(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Error loading sync queue:', error)
      setLoading(false)
    }
  }

  const forceSyncNow = async () => {
    try {
      setSyncing(true)
      const { syncEngine } = await import('@/lib/sync-queue-engine')
      await syncEngine.forceSyncNow()
      
      // Reload queue after sync
      setTimeout(loadSyncQueue, 1000)
    } catch (error) {
      console.error('Force sync error:', error)
      alert('Failed to force sync. Check console for details.')
    } finally {
      setSyncing(false)
    }
  }

  const clearSyncedItems = async () => {
    try {
      const syncedItems = syncQueue.filter(item => item.syncStatus === 'synced')
      
      for (const item of syncedItems) {
        await offlineDB.delete('sync_queue', item.id)
      }
      
      await loadSyncQueue()
      alert(`Cleared ${syncedItems.length} synced items`)
    } catch (error) {
      console.error('Error clearing synced items:', error)
      alert('Failed to clear synced items')
    }
  }

  const pendingItems = syncQueue.filter(item => item.syncStatus === 'pending')
  const syncedItems = syncQueue.filter(item => item.syncStatus === 'synced')
  const errorItems = syncQueue.filter(item => item.syncStatus === 'error' || (item.retryCount && item.retryCount > 3))

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader className="animate-spin mr-2" size={20} />
          <span>Loading sync diagnostics...</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">🔍 Sync Diagnostic Dashboard</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and troubleshoot data synchronization
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadSyncQueue} variant="outline" size="sm">
              <RefreshCw size={16} className="mr-1" />
              Refresh
            </Button>
            <Button onClick={forceSyncNow} disabled={syncing} size="sm">
              {syncing ? (
                <>
                  <Loader className="animate-spin mr-1" size={16} />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-1" />
                  Force Sync Now
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{syncQueue.length}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </div>
          <div className="border rounded-lg p-4 bg-yellow-50">
            <div className="text-2xl font-bold text-yellow-600">{pendingItems.length}</div>
            <div className="text-sm text-muted-foreground">Pending Sync</div>
          </div>
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="text-2xl font-bold text-green-600">{syncedItems.length}</div>
            <div className="text-sm text-muted-foreground">Synced</div>
          </div>
          <div className="border rounded-lg p-4 bg-red-50">
            <div className="text-2xl font-bold text-red-600">{errorItems.length}</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </div>
        </div>

        {/* Last Check Time */}
        {lastCheck && (
          <div className="text-xs text-muted-foreground mb-4">
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        )}

        {/* Warning if pending items */}
        {pendingItems.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-semibold text-yellow-900">
                {pendingItems.length} items waiting to sync
              </div>
              <div className="text-sm text-yellow-800 mt-1">
                These items are queued and will sync automatically when online. 
                You can also force sync now using the button above.
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {syncedItems.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={clearSyncedItems} variant="outline" size="sm">
              Clear {syncedItems.length} Synced Items
            </Button>
          </div>
        )}
      </Card>

      {/* Detailed Queue Items */}
      {syncQueue.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Sync Queue Details</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {syncQueue.slice(0, 50).map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-3 text-sm ${
                  item.syncStatus === 'synced' ? 'bg-green-50 border-green-200' :
                  item.syncStatus === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.syncStatus === 'synced' ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : item.syncStatus === 'error' ? (
                      <XCircle size={16} className="text-red-600" />
                    ) : (
                      <Loader size={16} className="text-yellow-600" />
                    )}
                    <span className="font-medium">{item.objectStore}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{item.operation}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 ml-6">
                  ID: {item.recordId.substring(0, 20)}...
                </div>
                {item.errorMessage && (
                  <div className="text-xs text-red-600 mt-1 ml-6">
                    Error: {item.errorMessage}
                  </div>
                )}
                {item.retryCount && item.retryCount > 0 && (
                  <div className="text-xs text-orange-600 mt-1 ml-6">
                    Retry count: {item.retryCount}
                  </div>
                )}
              </div>
            ))}
            {syncQueue.length > 50 && (
              <div className="text-center text-sm text-muted-foreground py-2">
                Showing 50 of {syncQueue.length} items
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {syncQueue.length === 0 && (
        <Card className="p-12 text-center">
          <CheckCircle className="mx-auto mb-4 text-green-600" size={48} />
          <h4 className="font-semibold text-lg mb-2">All Synced Up! ✨</h4>
          <p className="text-sm text-muted-foreground">
            No items in the sync queue. All data is synchronized.
          </p>
        </Card>
      )}
    </div>
  )
}
