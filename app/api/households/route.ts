import { NextResponse } from 'next/server'

// API route disabled - App uses IndexedDB-first architecture

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'This app uses IndexedDB-first architecture. Data is stored locally in IndexedDB.',
    architecture: 'offline-first',
    data: []
  })
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'This app uses IndexedDB-first architecture. Please use IndexedDB for data operations.',
    architecture: 'offline-first'
  })
}

/* ORIGINAL CODE - DISABLED FOR VERCEL DEPLOYMENT
export async function GET_DISABLED() {
  try{
    const households = await HouseholdService.getAllHouseholds()
    return NextResponse.json({ success: true, data: households })
  } catch (error) {
    console.error('Error fetching households:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch households' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      householdId,
      headOfHousehold,
      address,
      region,
      district,
      chiefdom,
      section,
      gpsCoordinates,
      phoneNumber,
      totalMembers,
      createdBy
    } = body

    // Validate required fields
    if (!householdId || !headOfHousehold || !address || !region || !district || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const household = await HouseholdService.createHousehold({
      householdId,
      headOfHousehold,
      address,
      region,
      district,
      chiefdom,
      section,
      gpsCoordinates,
      phoneNumber,
      totalMembers,
      createdBy
    })

    // Log the action
    await LogService.logAction({
      userId: createdBy,
      action: 'CREATE_HOUSEHOLD',
      entityType: 'household',
      entityId: household.id,
      details: { householdId: household.household_id, region, district }
    })

    return NextResponse.json({ success: true, data: household })
  } catch (error) {
    console.error('Error creating household:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create household' },
      { status: 500 }
    )
  }
}
*/
