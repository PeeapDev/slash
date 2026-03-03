import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/database'
import { AuthService } from '@/lib/auth-service'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' },
      { status: 503 }
    )
  }

  try {
    const result = await AuthService.getCurrentSession()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { success: false, error: 'Session check failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    let userId: string | undefined
    try {
      const body = await request.json()
      userId = body.userId
    } catch {
      // Body may be empty — that's fine
    }

    const result = await AuthService.logoutUser(userId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
