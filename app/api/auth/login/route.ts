import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/database'
import { AuthService } from '@/lib/auth-service'

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const result = await AuthService.loginUser(email, password)

    if (result.success) {
      return NextResponse.json({
        success: true,
        user: {
          id: result.user?.id,
          email: result.user?.email,
          fullName: result.user?.full_name,
          role: result.user?.role,
          regionId: result.user?.region_id,
          districtId: result.user?.district_id,
          isActive: result.user?.is_active,
        },
        message: result.message,
      })
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
