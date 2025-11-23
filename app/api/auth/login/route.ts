import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Attempt login using AuthService
    const result = await AuthService.loginUser(email, password)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        user: {
          id: result.user?.id,
          email: result.user?.email,
          fullName: result.user?.full_name,
          role: result.user?.role,
          regionId: result.user?.region_id,
          districtId: result.user?.district_id,
          isActive: result.user?.is_active
        },
        session: {
          accessToken: result.supabaseSession?.access_token,
          refreshToken: result.supabaseSession?.refresh_token,
          expiresAt: result.supabaseSession?.expires_at
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error during login' },
      { status: 500 }
    )
  }
}
