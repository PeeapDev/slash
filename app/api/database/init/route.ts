import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, checkDatabaseHealth } from '@/lib/database'

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
    // Initialize database tables
    const initialized = await initializeDatabase()
    
    if (initialized) {
      return NextResponse.json({ 
        success: true, 
        message: 'Database initialized successfully' 
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
