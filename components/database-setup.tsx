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
  Zap
} from "lucide-react"

interface DatabaseHealth {
  neon: boolean
  supabase: boolean
  timestamp: string
}

export default function DatabaseSetup() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [initStatus, setInitStatus] = useState<string | null>(null)

  const checkDatabaseHealth = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/database/init')
      const data = await response.json()
      
      if (data.success) {
        setHealth(data.health)
      } else {
        console.error('Database health check failed:', data.error)
      }
    } catch (error) {
      console.error('Error checking database health:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setInitStatus('Initializing database tables...')
    
    try {
      const response = await fetch('/api/database/init', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setInitStatus('Database initialized successfully! ✅')
        // Refresh health check
        setTimeout(() => checkDatabaseHealth(), 1000)
      } else {
        setInitStatus(`Initialization failed: ${data.error}`)
      }
    } catch (error) {
      setInitStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    checkDatabaseHealth()
  }, [])

  const renderConnectionStatus = (name: string, status: boolean, description: string) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <Database className="w-5 h-5" />
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
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
          <h2 className="text-2xl font-bold">Database Setup & Health</h2>
        </div>

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
                "Neon PostgreSQL",
                health.neon,
                "Primary database for application data"
              )}
              {renderConnectionStatus(
                "Supabase",
                health.supabase,
                "Authentication and real-time features"
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

        {/* Database Initialization */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold">Database Initialization</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Initialize the database with required tables and indexes for the SLASH platform.
            This will create tables for users, households, participants, samples, surveys, and more.
          </p>

          <Button 
            onClick={initializeDatabase}
            disabled={isInitializing || !health?.neon}
            className="w-full"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing Database...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Initialize Database Tables
              </>
            )}
          </Button>

          {initStatus && (
            <div className={`p-3 rounded-lg text-sm ${
              initStatus.includes('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : initStatus.includes('failed') || initStatus.includes('Error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {initStatus}
            </div>
          )}
        </div>

        {/* Database Schema Info */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Database Schema</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              'users', 'households', 'participants', 'sample_collections',
              'lab_results', 'surveys', 'forms', 'ai_analysis', 'system_logs'
            ].map((table) => (
              <div key={table} className="flex items-center gap-2 p-2 bg-muted rounded">
                <Database className="w-4 h-4" />
                <span className="font-mono">{table}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Connection Details */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Configuration</h3>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Database URL:</span>
              <span className="font-mono text-xs">
                {process.env.NEXT_PUBLIC_DATABASE_URL ? '✅ Configured' : '❌ Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Supabase URL:</span>
              <span className="font-mono text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Environment:</span>
              <span className="font-mono text-xs">
                {process.env.NODE_ENV || 'development'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
