import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/session',
  '/api/database/init',
]

const PUBLIC_PREFIXES = [
  '/_next',
  '/favicon',
  '/icons',
  '/sw.js',
  '/manifest.json',
  '/apple-icon',
  '/form/',
]

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  return PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // If Supabase isn't configured, allow everything (local dev / offline-only mode)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseAnonKey) {
    return NextResponse.next()
  }

  // Create Supabase server client for cookie-based auth
  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // API routes → 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    // Page routes → redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon\\.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
