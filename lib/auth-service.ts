"use client"

import { supabase } from './database'
import { UserService, LogService } from './database-services'
import bcrypt from 'bcryptjs'

// Authentication service that bridges Supabase auth with Neon database
export class AuthService {
  
  // Register new user (Supabase Auth + Neon Database)
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
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      })

      if (authError) {
        throw new Error(`Supabase Auth Error: ${authError.message}`)
      }

      // 2. Hash password for Neon database
      const passwordHash = await bcrypt.hash(password, 12)

      // 3. Save user data to Neon PostgreSQL
      const dbUser = await UserService.createUser({
        email,
        passwordHash,
        fullName,
        role,
        regionId,
        districtId
      })

      // 4. Log the registration
      await LogService.logAction({
        userId: dbUser.id,
        action: 'USER_REGISTERED',
        entityType: 'user',
        entityId: dbUser.id,
        details: { 
          email, 
          role, 
          region: regionId,
          district: districtId,
          supabaseId: authData.user?.id 
        }
      })

      return {
        success: true,
        user: dbUser,
        supabaseUser: authData.user,
        message: 'User registered successfully'
      }

    } catch (error) {
      console.error('User registration failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }
    }
  }

  // Login user (Supabase Auth + Neon Database sync)
  static async loginUser(email: string, password: string) {
    try {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        throw new Error(`Authentication failed: ${authError.message}`)
      }

      // 2. Get user data from Neon database
      const dbUser = await UserService.getUserByEmail(email)
      
      if (!dbUser) {
        throw new Error('User not found in database')
      }

      if (!dbUser.is_active) {
        throw new Error('User account is inactive')
      }

      // 3. Log the login
      await LogService.logAction({
        userId: dbUser.id,
        action: 'USER_LOGIN',
        entityType: 'user',
        entityId: dbUser.id,
        details: { 
          email,
          supabaseId: authData.user?.id,
          loginTime: new Date().toISOString()
        }
      })

      return {
        success: true,
        user: dbUser,
        supabaseSession: authData.session,
        message: 'Login successful'
      }

    } catch (error) {
      console.error('Login failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }
    }
  }

  // Logout user
  static async logoutUser(userId?: string) {
    try {
      // 1. Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw new Error(`Logout failed: ${error.message}`)
      }

      // 2. Log the logout in Neon database
      if (userId) {
        await LogService.logAction({
          userId,
          action: 'USER_LOGOUT',
          entityType: 'user',
          entityId: userId,
          details: { 
            logoutTime: new Date().toISOString()
          }
        })
      }

      return {
        success: true,
        message: 'Logged out successfully'
      }

    } catch (error) {
      console.error('Logout failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      }
    }
  }

  // Get current session
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        throw new Error(`Session error: ${error.message}`)
      }

      if (!session) {
        return { success: false, message: 'No active session' }
      }

      // Get user data from Neon database
      const dbUser = await UserService.getUserByEmail(session.user.email!)
      
      return {
        success: true,
        session,
        user: dbUser
      }

    } catch (error) {
      console.error('Session check failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session check failed'
      }
    }
  }

  // Update user profile (both Supabase and Neon)
  static async updateUserProfile(userId: string, updates: {
    fullName?: string
    role?: string
    regionId?: string
    districtId?: string
  }) {
    try {
      // 1. Update user in Neon database
      const updatedUser = await UserService.updateUser(userId, {
        fullName: updates.fullName,
        role: updates.role,
        regionId: updates.regionId,
        districtId: updates.districtId
      })

      // 2. Update Supabase user metadata
      if (updates.fullName) {
        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: updates.fullName
          }
        })
        
        if (error) {
          console.warn('Supabase metadata update failed:', error.message)
        }
      }

      // 3. Log the update
      await LogService.logAction({
        userId,
        action: 'USER_PROFILE_UPDATED',
        entityType: 'user',
        entityId: userId,
        details: updates
      })

      return {
        success: true,
        user: updatedUser,
        message: 'Profile updated successfully'
      }

    } catch (error) {
      console.error('Profile update failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed'
      }
    }
  }

  // Sync Supabase users to Neon database (admin function)
  static async syncSupabaseUsers() {
    try {
      // This would typically be called from an admin API endpoint
      const { data: { users }, error } = await supabase.auth.admin.listUsers()
      
      if (error) {
        throw new Error(`Failed to list Supabase users: ${error.message}`)
      }

      const syncResults = []

      for (const supabaseUser of users) {
        try {
          // Check if user exists in Neon database
          const existingUser = await UserService.getUserByEmail(supabaseUser.email!)
          
          if (!existingUser) {
            // Create user in Neon database
            const dbUser = await UserService.createUser({
              email: supabaseUser.email!,
              passwordHash: 'supabase_managed', // Placeholder since Supabase manages auth
              fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email!,
              role: supabaseUser.user_metadata?.role || 'field_collector'
            })

            syncResults.push({ 
              email: supabaseUser.email, 
              status: 'created', 
              userId: dbUser.id 
            })
          } else {
            syncResults.push({ 
              email: supabaseUser.email, 
              status: 'exists', 
              userId: existingUser.id 
            })
          }
        } catch (error) {
          syncResults.push({ 
            email: supabaseUser.email, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }

      return {
        success: true,
        syncResults,
        message: `Synced ${users.length} users from Supabase`
      }

    } catch (error) {
      console.error('User sync failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User sync failed'
      }
    }
  }

  // Reset password (Supabase managed)
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/reset-password`
      })

      if (error) {
        throw new Error(`Password reset failed: ${error.message}`)
      }

      // Log the password reset request
      const user = await UserService.getUserByEmail(email)
      if (user) {
        await LogService.logAction({
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          entityType: 'user',
          entityId: user.id,
          details: { email }
        })
      }

      return {
        success: true,
        message: 'Password reset email sent'
      }

    } catch (error) {
      console.error('Password reset failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed'
      }
    }
  }
}
