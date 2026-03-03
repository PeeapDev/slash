import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from './database'
import { type TeamRole, type RolePermissions, hasPermission } from './team-roles'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

export interface AuthenticatedUser {
  id: string
  email: string
  full_name: string
  role: TeamRole
  region_id?: string
  district_id?: string
  is_active: boolean
}

// Extract and verify the Supabase session from the request, then fetch the profile
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  if (!isSupabaseConfigured()) return null

  // Get access token from Authorization header or cookie
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) return null

  const sb = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null

  // Fetch profile
  const { data: profile } = await sb
    .from('users_profile')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) return null

  return profile as AuthenticatedUser
}

// Require a specific permission — returns the user or a 401/403 response
export async function requirePermission(
  request: NextRequest,
  permission: keyof RolePermissions
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' },
      { status: 503 }
    )
  }

  const user = await getAuthenticatedUser(request)

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

  if (!hasPermission(user.role, permission)) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  return { user }
}

// Require just authentication (any valid user)
export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' },
      { status: 503 }
    )
  }

  const user = await getAuthenticatedUser(request)

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

  return { user }
}
