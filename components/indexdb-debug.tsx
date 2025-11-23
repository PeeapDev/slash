"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Database, 
  RefreshCw, 
  Eye, 
  Trash2,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react"
import { indexedDBService } from "@/lib/indexdb-service"

interface DBStore {
  name: string
  count: number
  data: any[]
}

export default function IndexedDBDebug() {
  const [stores, setStores] = useState<DBStore[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStore, setSelectedStore] = useState<string | null>(null)
  const [dbExists, setDbExists] = useState(false)

  const storeNames = [
    'forms', 'form_responses', 'household_data', 'participant_data',
    'sample_collection_data', 'lab_analysis', 'audit_flags', 'sync_status',
    'admin_users', 'regions', 'districts', 'audit_logs', 'projects',
    'ai_settings', 'app_settings', 'offline_queue', 'sync_metadata'
  ]

  useEffect(() => {
    loadStoreData()
    checkDBExists()
  }, [])

  const checkDBExists = async () => {
    if (typeof window === 'undefined' || !indexedDB) return
    
    try {
      const databases = await indexedDB.databases()
      const slashDB = databases.find(db => db.name === 'SLASH_PWA_DB')
      setDbExists(!!slashDB)
    } catch (error) {
      console.error('Error checking database existence:', error)
    }
  }

  const loadStoreData = async () => {
    if (typeof window === 'undefined') return
    
    setIsLoading(true)
    try {
      await indexedDBService.init()
      
      const storeData: DBStore[] = []
      
      for (const storeName of storeNames) {
        try {
          const data = await indexedDBService.getAll(storeName as any)
          storeData.push({
            name: storeName,
            count: data.length,
            data: data
          })
        } catch (error) {
          console.error(`Error loading ${storeName}:`, error)
          storeData.push({
            name: storeName,
            count: 0,
            data: []
          })
        }
      }
      
      setStores(storeData)
    } catch (error) {
      console.error('Error loading store data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearStore = async (storeName: string) => {
    if (!confirm(`Are you sure you want to clear all data from ${storeName}?`)) {
      return
    }
    
    try {
      await indexedDBService.clear(storeName as any)
      await loadStoreData()
      console.log(`✅ Cleared ${storeName}`)
    } catch (error) {
      console.error(`Error clearing ${storeName}:`, error)
    }
  }

  const initializeDB = async () => {
    try {
      await indexedDBService.init()
      await loadStoreData()
      await checkDBExists()
      console.log('✅ IndexedDB initialized')
    } catch (error) {
      console.error('Error initializing IndexedDB:', error)
    }
  }

  const selectedStoreData = stores.find(s => s.name === selectedStore)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <h3 className="font-semibold">IndexedDB Debug Console</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStoreData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={initializeDB}
            >
              <Database className="w-4 h-4 mr-1" />
              Initialize DB
            </Button>
          </div>
        </div>

        {/* Database Status */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Database:</span>
            {dbExists ? (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                SLASH_PWA_DB Exists
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Found
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Browser Support:</span>
            {typeof indexedDB !== 'undefined' ? (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Supported
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Supported
              </Badge>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">How to view IndexedDB in Browser:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Open Browser DevTools (F12)</li>
                <li>Go to "Application" tab (Chrome) or "Storage" tab (Firefox)</li>
                <li>Look for "IndexedDB" in the left sidebar</li>
                <li>Expand "SLASH_PWA_DB" to see all stores</li>
                <li>Click any store to view its data</li>
              </ol>
            </div>
          </div>
        </div>
      </Card>

      {/* Store List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h4 className="font-semibold mb-4">Data Stores ({stores.length})</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stores.map((store) => (
              <div
                key={store.name}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStore === store.name 
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-200' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedStore(store.name)}
              >
                <div>
                  <div className="font-medium text-sm">{store.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {store.count} {store.count === 1 ? 'item' : 'items'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={store.count > 0 ? 'default' : 'secondary'}>
                    {store.count}
                  </Badge>
                  {store.count > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearStore(store.name)
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Store Data Viewer */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4" />
            <h4 className="font-semibold">
              {selectedStore ? `${selectedStore} Data` : 'Select a Store'}
            </h4>
          </div>
          
          {selectedStoreData ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedStoreData.data.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No data in this store</p>
                </div>
              ) : (
                selectedStoreData.data.map((item, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="text-xs font-mono">
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Click a store to view its data</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
