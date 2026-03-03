import { NextResponse } from 'next/server'
import { checkDatabaseHealth, isSupabaseConfigured } from '@/lib/database'

export async function GET() {
  try {
    const health = await checkDatabaseHealth()
    return NextResponse.json({
      success: true,
      health,
      configured: isSupabaseConfigured(),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Health check failed' },
      { status: 500 }
    )
  }
}
