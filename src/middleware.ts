import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseMiddleware } from '@/lib/supabase/middleware'

// Fully public routes (no auth needed)
const PUBLIC_PATHS = new Set(['/login', '/unauthorized', '/auth/callback'])

// Prefixes that are always public (static assets, Next internals)
const PUBLIC_PREFIXES = ['/_next/', '/favicon', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Skip Next.js internals and static files
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // 2. Create a response we can mutate (needed to refresh auth cookies)
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createSupabaseMiddleware(request, response)

  // 3. Refresh session — this keeps the cookie alive
  const { data: { session } } = await supabase.auth.getSession()

  // 4. If route is public — allow, but redirect authenticated users away from /login
  if (PUBLIC_PATHS.has(pathname)) {
    if (session && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // 5. Root → dashboard redirect
  if (pathname === '/') {
    if (session) return NextResponse.redirect(new URL('/dashboard', request.url))
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 6. Protected route: no session → redirect to login
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the intended destination so we can redirect back after login
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 7. Authenticated — pass through with refreshed cookies
  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (Next.js static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public asset extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
