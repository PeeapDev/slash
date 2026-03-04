import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/database'
import { AuthService } from '@/lib/auth-service'
import { LogService } from '@/lib/database-services'

function getClientIP(req: NextRequest): string {
  return req.headers.get('cf-connecting-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' },
      { status: 503 }
    )
  }

  const ip = getClientIP(request)
  const ua = request.headers.get('user-agent') || 'unknown'

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
      // Log successful login with IP and device
      LogService.logAction({
        userId: result.user?.id,
        action: 'USER_LOGIN',
        entityType: 'auth',
        details: { email, device: parseDevice(ua) },
        ipAddress: ip,
        userAgent: ua,
      }).catch(() => {})

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

    // Log failed login attempt
    LogService.logAction({
      action: 'LOGIN_FAILED',
      entityType: 'auth',
      details: { email, reason: result.error, device: parseDevice(ua) },
      ipAddress: ip,
      userAgent: ua,
    }).catch(() => {})

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 401 }
    )
  } catch (error) {
    // Log error
    LogService.logAction({
      action: 'LOGIN_ERROR',
      entityType: 'auth',
      details: { error: error instanceof Error ? error.message : 'Unknown error', device: parseDevice(ua) },
      ipAddress: ip,
      userAgent: ua,
    }).catch(() => {})

    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}

function parseDevice(ua: string): string {
  if (/mobile|android|iphone|ipad/i.test(ua)) return 'Mobile'
  if (/tablet|ipad/i.test(ua)) return 'Tablet'
  if (/windows/i.test(ua)) return 'Windows'
  if (/macintosh|mac os/i.test(ua)) return 'Mac'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Unknown'
}
