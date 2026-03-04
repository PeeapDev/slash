"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js'
import {
  type TeamRole,
  type RolePermissions,
  ROLE_DEFINITIONS,
  hasPermission as checkPermission,
  canManageRole as checkCanManageRole,
} from './team-roles'

// Client-side Supabase client (singleton)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isConfigured = supabaseUrl.length > 0 && !supabaseUrl.includes('placeholder') && supabaseAnonKey.length > 0

let clientSingleton: SupabaseClient | null = null
function getClientSupabase(): SupabaseClient | null {
  if (!isConfigured) return null
  if (typeof window === 'undefined') return null
  if (!clientSingleton) {
    clientSingleton = createClient(supabaseUrl, supabaseAnonKey)
  }
  return clientSingleton
}

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
  session: Session | null
  role: TeamRole
  isAuthenticated: boolean
  isLoading: boolean
  supabaseConfigured: boolean
  hasPermission: (perm: keyof RolePermissions) => boolean
  canManageRole: (targetRole: TeamRole) => boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: { email: string; password: string; fullName: string; role: string; regionId?: string; districtId?: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const defaultContext: AuthContextType = {
  user: null,
  session: null,
  role: 'superadmin',
  isAuthenticated: false,
  isLoading: true,
  supabaseConfigured: isConfigured,
  hasPermission: () => true,
  canManageRole: () => true,
  login: async () => ({ success: false, error: 'Not initialized' }),
  register: async () => ({ success: false, error: 'Not initialized' }),
  logout: async () => {},
  refreshProfile: async () => {},
}

const AuthContext = createContext<AuthContextType>(defaultContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const sb = getClientSupabase()

  // Derive role — graceful degradation: no Supabase → superadmin for local dev
  const role: TeamRole = user?.role ?? 'superadmin'

  const hasPermission = useCallback(
    (perm: keyof RolePermissions) => checkPermission(role, perm),
    [role]
  )

  const canManageRole = useCallback(
    (targetRole: TeamRole) => checkCanManageRole(role, targetRole),
    [role]
  )

  const fetchProfile = useCallback(async (userId: string) => {
    if (!sb) return null
    const { data } = await sb
      .from('users_profile')
      .select('*')
      .eq('id', userId)
      .single()
    return data as UserProfile | null
  }, [sb])

  const refreshProfile = useCallback(async () => {
    if (!sb || !session?.user?.id) return
    const profile = await fetchProfile(session.user.id)
    if (profile) setUser(profile)
  }, [sb, session, fetchProfile])

  // Initialize: check existing session
  useEffect(() => {
    if (!sb) {
      setIsLoading(false)
      return
    }

    let mounted = true

    const init = async () => {
      try {
        const { data: { session: existingSession } } = await sb.auth.getSession()
        if (!mounted) return

        if (existingSession) {
          setSession(existingSession)
          const profile = await fetchProfile(existingSession.user.id)
          if (mounted) setUser(profile)
        }
      } catch (e) {
        console.error('Auth init failed:', e)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    init()

    // Listen for auth state changes
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return
      setSession(newSession)

      if (newSession?.user) {
        const profile = await fetchProfile(newSession.user.id)
        if (mounted) setUser(profile)
      } else {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [sb, fetchProfile])

  const login = useCallback(async (email: string, password: string) => {
    if (!sb) return { success: false, error: 'Supabase not configured' }
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }

    setSession(data.session)
    const profile = await fetchProfile(data.user.id)
    setUser(profile)

    if (profile && !profile.is_active) {
      await sb.auth.signOut()
      setSession(null)
      setUser(null)
      return { success: false, error: 'Account is inactive' }
    }

    return { success: true }
  }, [sb, fetchProfile])

  const register = useCallback(async (regData: {
    email: string; password: string; fullName: string; role: string; regionId?: string; districtId?: string
  }) => {
    if (!sb) return { success: false, error: 'Supabase not configured' }

    const { data, error } = await sb.auth.signUp({
      email: regData.email,
      password: regData.password,
      options: {
        data: {
          full_name: regData.fullName,
          role: regData.role,
          region_id: regData.regionId,
          district_id: regData.districtId,
        }
      }
    })
    if (error) return { success: false, error: error.message }
    if (!data.user) return { success: false, error: 'Registration failed' }

    return { success: true }
  }, [sb])

  const logout = useCallback(async () => {
    if (sb) await sb.auth.signOut()
    setSession(null)
    setUser(null)
  }, [sb])

  return (
    <AuthContext.Provider value={{
      user,
      session,
      role,
      isAuthenticated: !!user,
      isLoading,
      supabaseConfigured: isConfigured,
      hasPermission,
      canManageRole,
      login,
      register,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
