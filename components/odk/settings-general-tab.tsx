"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-sm text-muted-foreground mt-1">Core application and organization settings.</p>
      </div>

      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Application</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Application Name</label>
            <input
              type="text"
              defaultValue="SLASH Data Capture Tool"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Organization</label>
            <input
              type="text"
              defaultValue="SLASH Initiative"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Support Email</label>
            <input
              type="email"
              defaultValue="support@slash.org"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
            />
          </div>
        </div>
        <Button size="sm" className="mt-5">Save Settings</Button>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Offline & Sync Defaults</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">Enable offline mode</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">Auto-sync when connection available</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Require password for sync</span>
          </label>
        </div>
        <Button size="sm" className="mt-5">Save Settings</Button>
      </Card>
    </div>
  )
}
