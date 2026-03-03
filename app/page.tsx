"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import LoginPage from "@/components/login-page"
import OdkLayout from "@/components/odk-layout"
import { indexedDBService } from "@/lib/indexdb-service"

export default function Home() {
  const { user, isAuthenticated, isLoading, supabaseConfigured, logout } = useAuth()

  // Supabase not configured → offline mode with IndexedDB local auth
  if (!supabaseConfigured) {
    return <OfflineHome />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={async () => {}} />
  }

  const handleLogout = async () => {
    await logout()
    try {
      await indexedDBService.delete('app_settings', 'current_user')
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-background">
      <OdkLayout
        user={{
          id: user!.id,
          name: user!.full_name,
          role: user!.role,
        }}
        onLogout={handleLogout}
      />
    </div>
  )
}

function OfflineHome() {
  const [localUser, setLocalUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const storedUser = await indexedDBService.get<{ id: string; name: string; role: string }>('app_settings', 'current_user')
        if (storedUser) setLocalUser(storedUser)
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [])

  const handleLogin = async () => {
    const userData = { id: 'current_user', name: "Admin User", role: "superadmin" }
    setLocalUser(userData)
    try { await indexedDBService.set('app_settings', userData) } catch { /* ignore */ }
  }

  const handleLogout = async () => {
    setLocalUser(null)
    try { await indexedDBService.delete('app_settings', 'current_user') } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!localUser) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-background">
      <OdkLayout user={localUser} onLogout={handleLogout} />
    </div>
  )
}
