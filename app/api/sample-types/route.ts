import { NextRequest, NextResponse } from 'next/server'

// OFFLINE-FIRST: This API route is for future cloud sync integration
// For now, all sample type operations are handled via IndexedDB in the component
export async function GET() {
  try {
    // Return empty array - client uses IndexedDB directly
    return NextResponse.json({ 
      success: true, 
      data: [],
      count: 0,
      message: 'Using IndexedDB - no cloud sync configured'
    })
  } catch (error) {
    console.error('Error fetching sample types:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sample types' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // OFFLINE-FIRST: All operations handled via IndexedDB in component
    // This route will be used for cloud sync when configured
    return NextResponse.json({ 
      success: true, 
      message: 'Using IndexedDB - operation handled client-side'
    })
  } catch (error) {
    console.error('Error creating sample type:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create sample type' },
      { status: 500 }
    )
  }
}
