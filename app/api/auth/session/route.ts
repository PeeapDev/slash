import { NextResponse } from 'next/server'

// API route disabled - App uses IndexedDB-first architecture with local authentication

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'This app uses IndexedDB-first architecture with local authentication.',
    architecture: 'offline-first',
    session: null
  })
}
