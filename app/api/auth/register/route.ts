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
    const { email, password, fullName, role, regionId, districtId } = body

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, password, fullName, role' },
        { status: 400 }
      )
    }

    const result = await AuthService.registerUser({
      email, password, fullName, role, regionId, districtId,
    })

    if (result.success) {
      LogService.logAction({
        userId: result.user?.id,
        action: 'USER_REGISTERED',
        entityType: 'auth',
        details: { email, role, device: parseDevice(ua) },
        ipAddress: ip,
        userAgent: ua,
      }).catch(() => {})

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

    LogService.logAction({
      action: 'REGISTER_FAILED',
      entityType: 'auth',
      details: { email, role, reason: result.error, device: parseDevice(ua) },
      ipAddress: ip,
      userAgent: ua,
    }).catch(() => {})

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    )
  } catch (error) {
    LogService.logAction({
      action: 'REGISTER_ERROR',
      entityType: 'auth',
      details: { error: error instanceof Error ? error.message : 'Unknown' },
      ipAddress: ip,
      userAgent: ua,
    }).catch(() => {})

    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
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
