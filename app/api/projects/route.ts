import { NextRequest, NextResponse } from 'next/server'
// External database services disabled for pure IndexedDB testing
// import { ProjectService } from '@/lib/sample-services'

export async function GET() {
  try {
    console.log('📥 API: Pure IndexedDB mode - no external database')
    
    // In pure IndexedDB mode, we return empty array since data is client-side only
    // Client should use IndexedDB directly, not this API
    const projects: any[] = []
    
    console.log('✅ API: IndexedDB mode - returning empty array (use client-side IndexedDB)')
    
    return NextResponse.json({ 
      success: true, 
      data: projects,
      count: projects.length,
      message: 'Pure IndexedDB mode - use client-side offlineDB directly'
    })
  } catch (error) {
    console.error('❌ API: Error in IndexedDB mode:', error)
    return NextResponse.json(
      { success: false, error: `API disabled in IndexedDB mode` },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 API POST: Pure IndexedDB mode - external database disabled')
    
    // In pure IndexedDB mode, we don't create projects via API
    // Projects should be created directly in client-side IndexedDB
    return NextResponse.json({ 
      success: false, 
      error: 'API disabled in IndexedDB mode - use client-side offlineDB.create() directly',
      message: 'Create projects using offlineDB.create("project_metadata", projectData) in client-side code'
    }, { status: 501 })
    
  } catch (error) {
    console.error('❌ API POST: Error in IndexedDB mode:', error)
    return NextResponse.json(
      { success: false, error: 'API disabled in IndexedDB mode' },
      { status: 500 }
    )
  }
}
