"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertCircle, ScrollText } from "lucide-react"
import { format } from "date-fns"

interface SystemLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  details: any
  created_at: string
  user_name?: string
  user_email?: string
}

export default function SystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [serverAvailable, setServerAvailable] = useState(false)
  const [filterAction, setFilterAction] = useState("all")
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/database/init')
      if (!res.ok) {
        setServerAvailable(false)
        setLoading(false)
        return
      }
      const data = await res.json()
      if (!data.success || !data.health?.supabase) {
        setServerAvailable(false)
        setLoading(false)
        return
      }
      setServerAvailable(true)

      // Fetch logs from API
      const logsRes = await fetch('/api/logs')
      if (logsRes.ok) {
        const logsData = await logsRes.json()
        if (logsData.success) {
          setLogs(logsData.data || [])
        }
      }
    } catch {
      setServerAvailable(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const actions = Array.from(new Set(logs.map(l => l.action)))

  const filteredLogs = filterAction === "all"
    ? logs
    : logs.filter(l => l.action === filterAction)

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (action.includes('LOGOUT')) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    if (action.includes('REGISTER')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    if (action.includes('UPDATE')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    if (action.includes('ERROR') || action.includes('FAIL')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }

  if (!serverAvailable && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-sm text-muted-foreground">Admin / System Logs</div>
          <h1 className="text-2xl font-bold mt-1">System Logs & Audit Trail</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Supabase not configured. System logs require a cloud connection.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Admin / System Logs</div>
          <h1 className="text-2xl font-bold mt-1">System Logs & Audit Trail</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time system activities and user actions</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter */}
      {actions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={filterAction === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterAction("all")}
          >
            All ({logs.length})
          </Badge>
          {actions.map(action => (
            <Badge
              key={action}
              variant={filterAction === action ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterAction(action)}
            >
              {action.replace(/_/g, ' ')} ({logs.filter(l => l.action === action).length})
            </Badge>
          ))}
        </div>
      )}

      {/* Logs */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="p-12 text-center">
          <ScrollText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {logs.length === 0 ? 'No system logs yet. Logs are recorded when users log in, register, and perform actions.' : 'No logs match the selected filter.'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Time</th>
                <th className="text-left py-3 px-4 font-semibold">User</th>
                <th className="text-left py-3 px-4 font-semibold">Action</th>
                <th className="text-left py-3 px-4 font-semibold hidden md:table-cell">Entity</th>
                <th className="text-left py-3 px-4 font-semibold hidden lg:table-cell">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                    {log.created_at ? format(new Date(log.created_at), 'MMM d, HH:mm:ss') : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-sm">{log.user_name || '-'}</div>
                      <div className="text-xs text-muted-foreground">{log.user_email || ''}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-sm">
                    {log.entity_type || '-'}
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground text-xs max-w-[300px] truncate">
                    {log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
