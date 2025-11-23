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
  try {
    const participants = await ParticipantService.getAllParticipants()
    return NextResponse.json({ success: true, data: participants })
  } catch (error) {
    console.error('Error fetching participants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch participants' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      participantId,
      householdId,
      fullName,
      dateOfBirth,
      gender,
      relationshipToHead,
      phoneNumber,
      educationLevel,
      occupation,
      healthStatus,
      riskLevel,
      createdBy
    } = body

    // Validate required fields
    if (!participantId || !householdId || !fullName || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const participant = await ParticipantService.createParticipant({
      participantId,
      householdId,
      fullName,
      dateOfBirth,
      gender,
      relationshipToHead,
      phoneNumber,
      educationLevel,
      occupation,
      healthStatus,
      riskLevel,
      createdBy
    })

    // Log the action
    await LogService.logAction({
      userId: createdBy,
      action: 'CREATE_PARTICIPANT',
      entityType: 'participant',
      entityId: participant.id,
      details: { 
        participantId: participant.participant_id, 
        householdId,
        healthStatus: healthStatus || 'unknown',
        riskLevel: riskLevel || 'low'
      }
    })

    return NextResponse.json({ success: true, data: participant })
  } catch (error) {
    console.error('Error creating participant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create participant' },
      { status: 500 }
    )
  }
}
*/
