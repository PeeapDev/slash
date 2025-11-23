import { NextResponse } from 'next/server'

// This API route is disabled for Vercel deployment
// The app uses IndexedDB-first architecture and doesn't require PostgreSQL

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'This app uses IndexedDB-first architecture. No server database required.',
    architecture: 'offline-first'
  })
}

export async function POST() {
  return NextResponse.json({ 
    success: true, 
    message: 'This app uses IndexedDB-first architecture. No server database initialization needed.',
    architecture: 'offline-first'
  })
}
