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
    const { email, password, fullName, role, regionId, districtId } = body

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, password, fullName, role' },
        { status: 400 }
      )
    }

    const result = await AuthService.registerUser({
      email,
      password,
      fullName,
      role,
      regionId,
      districtId,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          id: result.user?.id,
          email: result.user?.email,
          fullName: result.user?.full_name,
          role: result.user?.role,
        },
        message: result.message,
      })
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}
