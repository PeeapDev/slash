"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function SyncSettings() {
  const [syncConfig, setSyncConfig] = useState({
    autoSync: true,
    syncInterval: "30",
    backgroundSync: true,
  })

  const [syncStatus, setSyncStatus] = useState([
    { region: "Northern", lastSync: "2024-01-15 14:32", pending: 5, status: "synced" },
    { region: "Southern", lastSync: "2024-01-15 13:45", pending: 12, status: "pending" },
    { region: "Eastern", lastSync: "2024-01-15 15:12", pending: 0, status: "synced" },
    { region: "Western", lastSync: "2024-01-14 09:20", pending: 8, status: "pending" },
  ])

  const [cacheInfo] = useState({
    totalSize: "245 MB",
    lastUpdated: "2024-01-15 10:30",
    itemsCount: 12450,
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">Admin / Offline & Sync</div>
        <h1 className="text-2xl font-bold mt-1">Offline Sync Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage data synchronization and offline caching</p>
      </div>

      {/* Sync Configuration */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Synchronization Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Enable Auto Sync</label>
              <p className="text-sm text-muted-foreground">Automatically sync data at regular intervals</p>
            </div>
            <input
              type="checkbox"
              checked={syncConfig.autoSync}
              onChange={(e) => setSyncConfig((prev) => ({ ...prev, autoSync: e.target.checked }))}
              className="w-5 h-5"
            />
          </div>

          {syncConfig.autoSync && (
            <div>
              <label className="block text-sm font-medium mb-2">Sync Interval (minutes)</label>
              <input
                type="number"
                value={syncConfig.syncInterval}
                onChange={(e) => setSyncConfig((prev) => ({ ...prev, syncInterval: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Background Sync</label>
              <p className="text-sm text-muted-foreground">Allow syncing when app is in background</p>
            </div>
            <input
              type="checkbox"
              checked={syncConfig.backgroundSync}
              onChange={(e) => setSyncConfig((prev) => ({ ...prev, backgroundSync: e.target.checked }))}
              className="w-5 h-5"
            />
          </div>

          <Button className="w-full">Save Sync Settings</Button>
        </div>
      </Card>

      {/* Force Sync */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Manual Sync Control</h2>
        <Button className="gap-2" onClick={() => alert("Sync initiated for all regions")}>
          <RefreshCw size={18} />
          Force Sync All Regions
        </Button>
      </Card>

      {/* Regional Sync Status */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Sync Status by Region</h2>
        <div className="space-y-3">
          {syncStatus.map((sync) => (
            <div key={sync.region} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <div className="font-medium">{sync.region} Region</div>
                <div className="text-sm text-muted-foreground">Last sync: {sync.lastSync}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium">{sync.pending} pending</div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      sync.status === "synced" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {sync.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Local Cache Management */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Local Database Cache</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Cache Size</div>
              <div className="text-lg font-bold mt-1">{cacheInfo.totalSize}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Items Cached</div>
              <div className="text-lg font-bold mt-1">{cacheInfo.itemsCount.toLocaleString()}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Last Update</div>
              <div className="text-lg font-bold mt-1">{cacheInfo.lastUpdated}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => alert("Cache reloaded")}>
              Reload Cache
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => alert("Cache cleared")}>
              Clear Cache
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent">
              Inspect Cache
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
