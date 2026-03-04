import { NextResponse } from 'next/server'
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/database'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured' },
      { status: 503 }
    )
  }

  try {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('system_logs')
      .select('*, users_profile!user_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      // Table might not exist — return empty rather than error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ success: true, data: [] })
      }
      throw error
    }

    const logs = (data || []).map((l: any) => ({
      ...l,
      user_name: l.users_profile?.full_name ?? null,
      user_email: l.users_profile?.email ?? null,
      users_profile: undefined,
    }))

    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    console.error('Logs fetch error:', error)
    return NextResponse.json({ success: true, data: [] })
  }
}
