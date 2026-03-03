"use client"

import { useState } from "react"
import { Settings, Paintbrush, RefreshCw, Brain, Shield, Database, Smartphone, FileText, Activity } from "lucide-react"
import BrandingSettings from "@/components/branding-settings"
import SyncSettings from "@/components/sync-settings"
import AICredentials from "@/components/ai-credentials"
import AISettings from "@/components/ai-settings"
import SystemLogs from "@/components/system-logs"
import DatabaseSetup from "@/components/database-setup"
import DualDatabaseDemo from "@/components/dual-database-demo"
import PWAStatus from "@/components/pwa-status"
import SyncStatus from "@/components/sync-status"
import SyncDiagnostic from "@/components/sync-diagnostic"
import RolesPermissions from "@/components/odk/settings-roles-tab"
import GeneralSettings from "@/components/odk/settings-general-tab"

const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "branding", label: "Branding", icon: Paintbrush },
  { id: "roles", label: "Roles & Permissions", icon: Shield },
  { id: "ai", label: "AI Integration", icon: Brain },
  { id: "sync", label: "Sync & Data", icon: RefreshCw },
  { id: "database", label: "Database", icon: Database },
  { id: "pwa", label: "PWA", icon: Smartphone },
  { id: "logs", label: "System Logs", icon: FileText },
] as const

type TabId = typeof tabs[number]["id"]

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general")

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your platform configuration</p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar tabs — desktop */}
        <nav className="hidden md:flex flex-col w-56 border-r bg-muted/30 py-2 shrink-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left ${
                activeTab === id
                  ? "bg-primary/10 text-primary border-r-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile tab bar — horizontal scroll */}
        <div className="md:hidden border-b overflow-x-auto">
          <div className="flex px-2 py-1 gap-1 min-w-max">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeTab === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl">
            {activeTab === "general" && <GeneralSettings />}
            {activeTab === "branding" && <BrandingSettings />}
            {activeTab === "roles" && <RolesPermissions />}
            {activeTab === "ai" && <AiIntegrationTab />}
            {activeTab === "sync" && <SyncTab />}
            {activeTab === "database" && <DatabaseTab />}
            {activeTab === "pwa" && <PwaTab />}
            {activeTab === "logs" && <LogsTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Inline tab content wrappers ---------- */

function AiIntegrationTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">AI Provider Credentials</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure API keys for AI providers.</p>
      </div>
      <AICredentials />
      <hr className="border-border" />
      <div>
        <h2 className="text-lg font-semibold">AI Analysis & Automation</h2>
        <p className="text-sm text-muted-foreground mt-1">Run data quality checks and configure analysis settings.</p>
      </div>
      <AISettings />
    </div>
  )
}

function SyncTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Synchronization</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure sync intervals, view queue status, and run diagnostics.</p>
      </div>
      <SyncSettings />
      <hr className="border-border" />
      <SyncStatus />
      <SyncDiagnostic />
    </div>
  )
}

function DatabaseTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Database</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage database connections and monitor health.</p>
      </div>
      <DatabaseSetup />
      <DualDatabaseDemo />
    </div>
  )
}

function PwaTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Progressive Web App</h2>
        <p className="text-sm text-muted-foreground mt-1">Monitor PWA status, offline storage, and installation.</p>
      </div>
      <PWAStatus />
    </div>
  )
}

function LogsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">System Logs</h2>
        <p className="text-sm text-muted-foreground mt-1">View activity logs, errors, and monitoring data.</p>
      </div>
      <SystemLogs />
    </div>
  )
}
