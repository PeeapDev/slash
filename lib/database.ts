import { createClient, SupabaseClient } from '@supabase/supabase-js'

// --- Supabase client (safe for both server and client) ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

const isSupabaseValid = supabaseUrl.length > 0 && !supabaseUrl.includes('placeholder') && supabaseAnonKey.length > 0

export const supabase: SupabaseClient | null = isSupabaseValid
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function isSupabaseConfigured(): boolean {
  return supabase !== null
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const err: any = new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    err.code = 'SUPABASE_NOT_CONFIGURED'
    throw err
  }
  return supabase
}

// Health check — Supabase + IndexedDB only
export const checkDatabaseHealth = async () => {
  const result: {
    supabase: boolean
    indexedDB: boolean
    timestamp: string
    supabaseError?: string
  } = {
    supabase: false,
    indexedDB: true,
    timestamp: new Date().toISOString(),
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase!.auth.getSession()
      result.supabase = !error
      if (error) result.supabaseError = error.message
    } catch (e: any) {
      result.supabaseError = e.message
    }
  }

  return result
}

export default { supabase, checkDatabaseHealth }
