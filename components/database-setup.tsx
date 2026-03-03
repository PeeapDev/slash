"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  XCircle,
  Database,
  Loader2,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface DatabaseHealth {
  supabase: boolean
  indexedDB: boolean
  timestamp: string
  supabaseError?: string
}

export default function DatabaseSetup() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [showSetupHelp, setShowSetupHelp] = useState(false)

  const checkDatabaseHealth = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/database/init')
      const data = await response.json()

      if (data.health) {
        setHealth(data.health)
      }
      setConfigured(data.configured ?? false)
    } catch (error) {
      console.error('Error checking database health:', error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkDatabaseHealth()
  }, [])

  const renderConnectionStatus = (name: string, status: boolean, description: string, errorMsg?: string) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <Database className="w-5 h-5" />
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          {errorMsg && <p className="text-xs text-red-500 mt-1">{errorMsg}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {status ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
          </>
        ) : (
          <>
            <XCircle className="w-5 h-5 text-red-500" />
            <Badge variant="destructive">Disconnected</Badge>
          </>
        )}
      </div>
    </div>
  )

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Database Health</h2>
        </div>

        {configured === false && (
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              Supabase not configured
            </div>
            <p>
              The app is running in offline-only mode (IndexedDB). To enable cloud sync,
              user management, and authentication, add Supabase environment variables.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSetupHelp(!showSetupHelp)}
              className="text-amber-700"
            >
              {showSetupHelp ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
              {showSetupHelp ? 'Hide' : 'Show'} setup instructions
            </Button>
            {showSetupHelp && (
              <div className="mt-2 p-3 bg-white rounded border border-amber-100 text-xs space-y-2 font-mono">
                <p className="font-sans font-semibold text-sm">Required environment variables:</p>
                <div className="space-y-1">
                  <p><span className="text-blue-600">NEXT_PUBLIC_SUPABASE_URL</span> = https://xxx.supabase.co</p>
                  <p><span className="text-blue-600">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> = eyJ...</p>
                </div>
                <p className="font-sans text-xs text-muted-foreground mt-2">
                  1. Create a project at supabase.com<br />
                  2. Run the migration SQL in the SQL Editor<br />
                  3. Add these variables in Vercel Dashboard or .env.local
                </p>
              </div>
            )}
          </div>
        )}

        {/* Database Health Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Connection Status</h3>
            <Button
              onClick={checkDatabaseHealth}
              disabled={isChecking}
              variant="outline"
              size="sm"
            >
              {isChecking ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Refresh Status
            </Button>
          </div>

          {health ? (
            <div className="space-y-3">
              {renderConnectionStatus(
                "Supabase",
                health.supabase,
                "Cloud database, authentication, and sync server",
                health.supabaseError
              )}
              {renderConnectionStatus(
                "IndexedDB",
                health.indexedDB,
                "Offline-first local storage (always available)"
              )}
              <div className="text-xs text-muted-foreground">
                Last checked: {new Date(health.timestamp).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Checking database connections...</span>
            </div>
          )}
        </div>

        {/* Database Schema Info */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Database Schema</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              'users_profile', 'households', 'participants', 'sample_collections',
              'samples', 'lab_results', 'surveys', 'forms', 'ai_analysis',
              'system_logs', 'sample_types', 'projects'
            ].map((table) => (
              <div key={table} className="flex items-center gap-2 p-2 bg-muted rounded">
                <Database className="w-4 h-4" />
                <span className="font-mono text-xs">{table}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
