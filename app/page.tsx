"use client"

import { useState, useEffect } from "react"
import LoginPage from "@/components/login-page"
import OdkLayout from "@/components/odk-layout"
import { indexedDBService } from "@/lib/indexdb-service"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const storedUser = await indexedDBService.get<{ id: string; name: string; role: string }>('app_settings', 'current_user')
        if (storedUser) {
          setUser(storedUser)
        }
      } catch {
        // Fallback: try localStorage for migration
        try {
          const legacy = localStorage.getItem("current_user")
          if (legacy) {
            const parsed = JSON.parse(legacy)
            setUser(parsed)
            await indexedDBService.set('app_settings', { id: 'current_user', ...parsed })
            localStorage.removeItem("current_user")
          }
        } catch { /* ignore */ }
      }
      setIsLoading(false)
    })()
  }, [])

  const handleLogin = async () => {
    const userData = { id: 'current_user', name: "Admin User", role: "superadmin" }
    setUser(userData)
    try {
      await indexedDBService.set('app_settings', userData)
    } catch { /* ignore */ }
  }

  const handleLogout = async () => {
    setUser(null)
    try {
      await indexedDBService.delete('app_settings', 'current_user')
    } catch { /* ignore */ }
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

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-background">
      <OdkLayout user={user} onLogout={handleLogout} />
    </div>
  )
}
