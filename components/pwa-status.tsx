"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RotateCcw, 
  Database, 
  Smartphone, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  HardDrive,
  Cloud,
  Activity
} from "lucide-react"
import { usePWA } from "@/lib/pwa-utils"
import { indexedDBService } from "@/lib/indexdb-service"
import { migrationService } from "@/lib/migration-service"
import { getDataSummary } from "@/lib/offline-data-store"
import IndexedDBDebug from "./indexdb-debug"
import QuickProjectTest from "./quick-project-test"

interface StorageInfo {
  used: number
  quota: number
  percentage: number
}

interface DataSummary {
  households: number
  participants: number
  samples: number
  labResults: number
  auditFlags: number
  pendingSync: number
}

export default function PWAStatus() {
  const pwa = usePWA()
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null)
  const [isMigrated, setIsMigrated] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadStorageInfo()
    loadDataSummary()
    checkMigrationStatus()
  }, [])

  const loadStorageInfo = async () => {
    try {
      const estimate = await pwa.getStorageEstimate()
      if (estimate && estimate.usage && estimate.quota) {
        setStorageInfo({
          used: estimate.usage,
          quota: estimate.quota,
          percentage: (estimate.usage / estimate.quota) * 100
        })
      }
    } catch (error) {
      console.error('Error loading storage info:', error)
    }
  }

  const loadDataSummary = async () => {
    try {
      const summary = await getDataSummary()
      setDataSummary(summary)
    } catch (error) {
      console.error('Error loading data summary:', error)
    }
  }

  const checkMigrationStatus = () => {
    setIsMigrated(migrationService.isMigrated())
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        loadStorageInfo(),
        loadDataSummary(),
        checkMigrationStatus()
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleInstallApp = async () => {
    const success = await pwa.installApp()
    if (success) {
      console.log('App installed successfully')
    }
  }

  const handleUpdateApp = async () => {
    await pwa.updateServiceWorker()
  }

  const handleTriggerSync = async () => {
    await pwa.triggerBackgroundSync()
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getConnectionStatus = () => {
    return pwa.isOnline ? (
      <div className="flex items-center gap-2 text-green-600">
        <Wifi className="w-4 h-4" />
        <span className="text-sm font-medium">Online</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-orange-600">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">Offline</span>
      </div>
    )
  }

  const getStorageStatus = () => {
    if (!storageInfo) return null

    const isLow = storageInfo.percentage > 80
    return (
      <div className="flex items-center gap-2">
        <HardDrive className={`w-4 h-4 ${isLow ? 'text-red-500' : 'text-blue-500'}`} />
        <div className="flex-1">
          <div className="flex justify-between text-sm">
            <span>Storage</span>
            <span>{storageInfo.percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className={`h-2 rounded-full ${
                isLow ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatBytes(storageInfo.used)} of {formatBytes(storageInfo.quota)} used
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* PWA Status Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            <h3 className="font-semibold">PWA Status</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Connection Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Connection</span>
              {getConnectionStatus()}
            </div>
          </div>

          {/* App Installation Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">App Status</span>
              <div className="flex items-center gap-2">
                {pwa.isInstalled ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Installed
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Not Installed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Migration Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Data Migration</span>
              <div className="flex items-center gap-2">
                {isMigrated ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-700">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Updates</span>
              <div className="flex items-center gap-2">
                {pwa.hasUpdate ? (
                  <Badge className="bg-blue-100 text-blue-700">
                    <Download className="w-3 h-3 mr-1" />
                    Available
                  </Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Up to Date
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Storage Information */}
      {storageInfo && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5" />
            <h3 className="font-semibold">Storage Usage</h3>
          </div>
          {getStorageStatus()}
        </Card>
      )}

      {/* Data Summary */}
      {dataSummary && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5" />
            <h3 className="font-semibold">Data Summary</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dataSummary.households}</div>
              <div className="text-sm text-muted-foreground">Households</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dataSummary.participants}</div>
              <div className="text-sm text-muted-foreground">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{dataSummary.samples}</div>
              <div className="text-sm text-muted-foreground">Samples</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{dataSummary.labResults}</div>
              <div className="text-sm text-muted-foreground">Lab Results</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{dataSummary.auditFlags}</div>
              <div className="text-sm text-muted-foreground">Audit Flags</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{dataSummary.pendingSync}</div>
              <div className="text-sm text-muted-foreground">Pending Sync</div>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Actions</h3>
        
        <div className="flex flex-wrap gap-2">
          {pwa.isInstallPromptAvailable && (
            <Button onClick={handleInstallApp} size="sm">
              <Download className="w-4 h-4 mr-1" />
              Install App
            </Button>
          )}
          
          {pwa.hasUpdate && (
            <Button onClick={handleUpdateApp} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-1" />
              Update App
            </Button>
          )}
          
          <Button onClick={handleTriggerSync} size="sm" variant="outline">
            <RotateCcw className="w-4 h-4 mr-1" />
            Sync Data
          </Button>
          
          {pwa.isOnline && dataSummary?.pendingSync && dataSummary.pendingSync > 0 && (
            <Badge className="bg-yellow-100 text-yellow-700">
              <Cloud className="w-3 h-3 mr-1" />
              {dataSummary.pendingSync} items to sync
            </Badge>
          )}
        </div>
      </Card>

      {/* Offline Message */}
      {!pwa.isOnline && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 text-orange-700">
            <WifiOff className="w-5 h-5" />
            <div>
              <h4 className="font-medium">You're offline</h4>
              <p className="text-sm">
                You can continue working. Data will sync when connection is restored.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Sync Pending Message */}
      {pwa.isOnline && dataSummary?.pendingSync && dataSummary.pendingSync > 0 && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-2 text-blue-700">
            <RotateCcw className="w-5 h-5" />
            <div>
              <h4 className="font-medium">Sync in Progress</h4>
              <p className="text-sm">
                {dataSummary.pendingSync} items are being synchronized with the server.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Project Test */}
      <QuickProjectTest />

      {/* IndexedDB Debug Console */}
      <IndexedDBDebug />
    </div>
  )
}
