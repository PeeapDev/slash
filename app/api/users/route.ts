import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/database'
import { UserService } from '@/lib/database-services'
import { AuthService } from '@/lib/auth-service'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED', data: [] },
      { status: 503 }
    )
  }

  try {
    const users = await UserService.getAllUsers()

    const sanitizedUsers = (users || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      regionId: user.region_id,
      districtId: user.district_id,
      isActive: user.is_active,
      employmentStatus: user.employment_status,
      createdAt: user.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: sanitizedUsers,
      count: sanitizedUsers.length,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

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
        { success: false, error: 'Missing required fields' },
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
          regionId: result.user?.region_id,
          districtId: result.user?.district_id,
        },
        message: 'User created successfully',
      })
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
