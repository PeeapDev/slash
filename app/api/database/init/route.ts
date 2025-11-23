import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, checkDatabaseHealth } from '@/lib/database'
import { SampleDatabaseService } from '@/lib/sample-database'

export async function GET() {
  try {
    // Check database health first
    const health = await checkDatabaseHealth()
    
    return NextResponse.json({ 
      success: true, 
      health,
      message: 'Database health check completed' 
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    return NextResponse.json(
      { success: false, error: 'Database health check failed' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // Initialize core database tables
    const initialized = await initializeDatabase()
    
    if (initialized) {
      // Initialize sample management tables
      await SampleDatabaseService.createSampleTables()
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database initialized successfully with sample management tables' 
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Database initialization failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
