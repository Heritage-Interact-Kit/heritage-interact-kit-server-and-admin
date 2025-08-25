import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Partial<ResponseCookie>) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: Partial<ResponseCookie>) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('🚨 MIDDLEWARE - User found:', !!user, user?.email)
  console.log('🚨 MIDDLEWARE - User metadata:', user?.user_metadata)

  
  const publicUrls = ['/login', '/auth/callback', '/', '/admin-manage']
  const isPublicRoute = publicUrls.includes(request.nextUrl.pathname)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  
  // Define API routes that should be excluded from activation checks
  const excludedApiRoutes = [
    '/api/mobile/', // Mobile APIs don't need activation checks
    '/api/admin/users/', // Admin user management has separate auth
    '/api/admin/verify-page-secret', // Admin verification
    '/api/auth/confirm', // Auth callback
    '/api/auth/signout', // Signout
  ]
  
  const isExcludedApiRoute = excludedApiRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // If no user and trying to access protected route
  if (!user && !isPublicRoute && !isExcludedApiRoute) {
    if (isApiRoute) {
      // For API routes, return JSON error instead of redirect
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user exists, check activation status on all routes (including API routes)
  if (user) {
    const isActive = user.user_metadata?.is_active !== false

    console.log('🚨 MIDDLEWARE - isActive:', isActive);
    
    if (!isActive) {
      // Deactivated user detected
      console.log('Deactivated user detected:', user.email)
      
      // Clear the session
      await supabase.auth.signOut()
      
      // Handle deactivated users differently for API vs web routes
      if (isApiRoute && !isExcludedApiRoute) {
        // For API routes, return JSON error
        return NextResponse.json({ 
          error: 'Account deactivated. Please contact an administrator.' 
        }, { status: 403 })
      }
      
      // For web routes, handle as before
      // If already on login page, don't redirect (avoid loop)
      if (request.nextUrl.pathname === '/login') {
        return response
      }
      
      // Redirect to login with deactivation message
      return NextResponse.redirect(new URL('/login?message=account_deactivated', request.url))
    }
    
    // User is active and authenticated
    // If on login page, redirect to dashboard (they shouldn't be on login if already logged in)
    if (request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/'
  ],
}