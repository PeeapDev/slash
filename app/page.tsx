"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import OdkLayout from "@/components/odk-layout"
import { indexedDBService } from "@/lib/indexdb-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { user, isAuthenticated, supabaseConfigured, logout } = useAuth()

  // Supabase not configured → offline mode
  if (!supabaseConfigured) {
    return <OfflineHome />
  }

  // Authenticated → dashboard
  if (isAuthenticated && user) {
    return <AuthenticatedApp user={user} logout={logout} />
  }

  // Not authenticated (or still loading) → show login form immediately
  return <InlineLogin />
}

function AuthenticatedApp({ user, logout }: { user: NonNullable<ReturnType<typeof useAuth>['user']>; logout: () => Promise<void> }) {
  const handleLogout = useCallback(async () => {
    await logout()
    try {
      await indexedDBService.delete('app_settings', 'current_user')
    } catch { /* ignore */ }
  }, [logout])

  return (
    <div className="min-h-screen bg-background">
      <OdkLayout
        user={{
          id: user.id,
          name: user.full_name,
          role: user.role,
        }}
        onLogout={handleLogout}
      />
    </div>
  )
}

function InlineLogin() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Timeout after 10 seconds so it never hangs forever
      const loginPromise = login(email, password)
      const timeoutPromise = new Promise<{ success: false; error: string }>((resolve) =>
        setTimeout(() => resolve({ success: false, error: "Login timed out. Please try again." }), 10000)
      )
      const result = await Promise.race([loginPromise, timeoutPromise])
      if (!result.success) {
        setError(result.error || "Login failed")
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">SLASH</CardTitle>
          <CardDescription>Health Data Collection Platform</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function OfflineHome() {
  const [localUser, setLocalUser] = useState<any>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const storedUser = await indexedDBService.get<{ id: string; name: string; role: string }>('app_settings', 'current_user')
        if (storedUser) setLocalUser(storedUser)
      } catch { /* ignore */ }
      setReady(true)
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

  if (!ready) {
    return <InlineLogin />
  }

  if (!localUser) {
    return <InlineLogin />
  }

  return (
    <div className="min-h-screen bg-background">
      <OdkLayout user={localUser} onLogout={handleLogout} />
    </div>
  )
}
