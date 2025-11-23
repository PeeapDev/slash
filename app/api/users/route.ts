import { NextResponse } from 'next/server'

// API route disabled - App uses IndexedDB-first architecture

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'This app uses IndexedDB-first architecture. User data is stored locally in IndexedDB.',
    architecture: 'offline-first',
    data: []
  })
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'This app uses IndexedDB-first architecture. Please use IndexedDB for user operations.',
    architecture: 'offline-first'
  })
}

/* ORIGINAL CODE - DISABLED FOR VERCEL DEPLOYMENT
export async function GET_DISABLED(request: NextRequest) {
  try {
    // Get all users from Neon database
    const users = await UserService.getAllUsers_DISABLED()
    
    // Remove sensitive information
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      regionId: user.region_id,
      districtId: user.district_id,
      isActive: user.is_active,
      createdAt: user.created_at
    }))

    return NextResponse.json({ 
      success: true, 
      data: sanitizedUsers,
      count: sanitizedUsers.length
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
  try {
    const body = await request.json()
    const { 
      email, 
      password, 
      fullName, 
      role, 
      regionId, 
      districtId,
      createdBy 
    } = body

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create user using AuthService (handles both Supabase and Neon)
    const result = await AuthService.registerUser({
      email,
      password,
      fullName,
      role,
      regionId,
      districtId
    })

    if (result.success) {
      // Log the user creation by admin
      if (createdBy) {
        await LogService.logAction({
          userId: createdBy,
          action: 'USER_CREATED_BY_ADMIN',
          entityType: 'user',
          entityId: result.user?.id,
          details: { 
            createdUserEmail: email, 
            role, 
            region: regionId,
            district: districtId
          }
        })
      }

      return NextResponse.json({ 
        success: true, 
        data: {
          id: result.user?.id,
          email: result.user?.email,
          fullName: result.user?.full_name,
          role: result.user?.role,
          regionId: result.user?.region_id,
          districtId: result.user?.district_id
        },
        message: 'User created successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
*/
