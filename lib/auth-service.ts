import { supabase, isSupabaseConfigured, getSupabaseClient } from './database'
import { LogService } from './database-services'

// Pure Supabase Auth service — no bcrypt, no Neon
export class AuthService {

  // Register new user via Supabase Auth
  // Trigger auto-creates users_profile row
  static async registerUser(userData: {
    email: string
    password: string
    fullName: string
    role: string
    regionId?: string
    districtId?: string
  }) {
    const { email, password, fullName, role, regionId, districtId } = userData

    try {
      const sb = getSupabaseClient()

      const { data: authData, error: authError } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            region_id: regionId,
            district_id: districtId,
          }
        }
      })

      if (authError) throw new Error(`Auth error: ${authError.message}`)
      if (!authData.user) throw new Error('User creation returned no user')

      // Profile is auto-created by the database trigger.
      // Fetch it to return consistent data.
      const { data: profile } = await sb
        .from('users_profile')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      // Fire-and-forget — don't block registration on logging
      LogService.logAction({
        userId: authData.user.id,
        action: 'USER_REGISTERED',
        entityType: 'user',
        entityId: authData.user.id,
        details: { email, role, region: regionId, district: districtId },
      }).catch(() => {})

      return {
        success: true,
        user: profile,
        message: 'User registered successfully',
      }
    } catch (error) {
      console.error('User registration failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }
    }
  }

  // Login via Supabase Auth
  static async loginUser(email: string, password: string) {
    try {
      const sb = getSupabaseClient()

      // Timeout wrapper to prevent Vercel function hangs
      const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
        Promise.race([
          promise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)),
        ])

      const { data: authData, error: authError } = await withTimeout(
        sb.auth.signInWithPassword({ email, password }),
        8000
      )

      if (authError) throw new Error(`Authentication failed: ${authError.message}`)

      // Get profile from users_profile
      const { data: profile, error: profileError } = await withTimeout(
        sb.from('users_profile').select('*').eq('id', authData.user.id).single(),
        5000
      )

      if (profileError) throw new Error('User profile not found')
      if (!profile.is_active) throw new Error('User account is inactive')

      // Fire-and-forget — don't block login on logging
      LogService.logAction({
        userId: profile.id,
        action: 'USER_LOGIN',
        entityType: 'user',
        entityId: profile.id,
        details: { email, loginTime: new Date().toISOString() },
      }).catch(() => {})

      return {
        success: true,
        user: profile,
        session: authData.session,
        message: 'Login successful',
      }
    } catch (error) {
      console.error('Login failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }
    }
  }

  // Logout
  static async logoutUser(userId?: string) {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase!.auth.signOut()
        if (error) console.warn('Supabase signOut error:', error.message)
      }

      if (userId) {
        await LogService.logAction({
          userId,
          action: 'USER_LOGOUT',
          entityType: 'user',
          entityId: userId,
          details: { logoutTime: new Date().toISOString() },
        })
      }

      return { success: true, message: 'Logged out successfully' }
    } catch (error) {
      console.error('Logout failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      }
    }
  }

  // Get current session + profile (with 5s timeout to avoid hanging)
  static async getCurrentSession() {
    try {
      if (!isSupabaseConfigured()) {
        return { success: false, message: 'Supabase not configured' }
      }

      const timeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
        Promise.race([
          promise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
        ])

      const { data: { session }, error } = await timeout(supabase!.auth.getSession(), 5000)

      if (error) throw new Error(`Session error: ${error.message}`)
      if (!session) return { success: false, message: 'No active session' }

      const { data: profile } = await timeout(
        supabase!
          .from('users_profile')
          .select('*')
          .eq('id', session.user.id)
          .single(),
        5000
      )

      return {
        success: true,
        session,
        user: profile,
      }
    } catch (error) {
      console.error('Session check failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session check failed',
      }
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: {
    fullName?: string
    role?: string
    regionId?: string
    districtId?: string
  }) {
    try {
      const sb = getSupabaseClient()

      const mapped: Record<string, any> = { updated_at: new Date().toISOString() }
      if (updates.fullName) mapped.full_name = updates.fullName
      if (updates.role) mapped.role = updates.role
      if (updates.regionId) mapped.region_id = updates.regionId
      if (updates.districtId) mapped.district_id = updates.districtId

      const { data: updatedProfile, error } = await sb
        .from('users_profile')
        .update(mapped)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Update Supabase user metadata if name changed
      if (updates.fullName) {
        await sb.auth.updateUser({ data: { full_name: updates.fullName } })
      }

      await LogService.logAction({
        userId,
        action: 'USER_PROFILE_UPDATED',
        entityType: 'user',
        entityId: userId,
        details: updates,
      })

      return {
        success: true,
        user: updatedProfile,
        message: 'Profile updated successfully',
      }
    } catch (error) {
      console.error('Profile update failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed',
      }
    }
  }

  // Reset password (Supabase managed)
  static async resetPassword(email: string) {
    try {
      if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured — password reset unavailable' }
      }

      const { error } = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
      })

      if (error) throw new Error(`Password reset failed: ${error.message}`)

      return { success: true, message: 'Password reset email sent' }
    } catch (error) {
      console.error('Password reset failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      }
    }
  }
}
