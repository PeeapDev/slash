import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'

export async function GET() {
  try {
    const result = await AuthService.getCurrentSession()

    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.full_name,
          role: result.user.role,
          regionId: result.user.region_id,
          districtId: result.user.district_id,
          isActive: result.user.is_active
        } : null,
        session: result.session ? {
          accessToken: result.session.access_token,
          refreshToken: result.session.refresh_token,
          expiresAt: result.session.expires_at
        } : null
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error || result.message },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Session check API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error during session check' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Extract user ID from session if needed (you might want to get this from auth header)
    const result = await AuthService.logoutUser()

    return NextResponse.json({
      success: true,
      message: result.message
    })

  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error during logout' },
      { status: 500 }
    )
  }
}
