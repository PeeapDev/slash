"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  type TeamRole,
  type RolePermissions,
  hasPermission as checkPermission,
  canManageRole as checkCanManageRole,
} from './team-roles'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: TeamRole
  region_id?: string
  district_id?: string
  is_active: boolean
  employment_status?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: UserProfile | null
  role: TeamRole
  isAuthenticated: boolean
  isLoading: boolean
  supabaseConfigured: boolean
  hasPermission: (perm: keyof RolePermissions) => boolean
  canManageRole: (targetRole: TeamRole) => boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: { email: string; password: string; fullName: string; role: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'superadmin',
  isAuthenticated: false,
  isLoading: false,
  supabaseConfigured: false,
  hasPermission: () => true,
  canManageRole: () => true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)

  const role: TeamRole = user?.role ?? 'superadmin'

  const hasPermission = useCallback(
    (perm: keyof RolePermissions) => checkPermission(role, perm),
    [role]
  )

  const canManageRole = useCallback(
    (targetRole: TeamRole) => checkCanManageRole(role, targetRole),
    [role]
  )

  // Check if server has Supabase configured + restore session
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('/api/auth/session')
        if (res.status === 503) {
          setSupabaseConfigured(false)
          return
        }
        setSupabaseConfigured(true)
        const data = await res.json()
        if (data.success && data.user) {
          setUser(data.user)
        }
      } catch {
        setSupabaseConfigured(false)
      }
    }
    checkServer()
  }, [])

  // Login via server API — no client-side Supabase SDK
  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (data.success && data.user) {
        // Map API response to UserProfile
        setUser({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.fullName,
          role: data.user.role,
          region_id: data.user.regionId,
          district_id: data.user.districtId,
          is_active: data.user.isActive ?? true,
          employment_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        return { success: true }
      }

      return { success: false, error: data.error || 'Login failed' }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error' }
    }
  }, [])

  const register = useCallback(async (regData: {
    email: string; password: string; fullName: string; role: string
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      })
      const data = await res.json()
      return data.success
        ? { success: true }
        : { success: false, error: data.error || 'Registration failed' }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' })
    } catch { /* ignore */ }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isAuthenticated: !!user,
      isLoading,
      supabaseConfigured,
      hasPermission,
      canManageRole,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
