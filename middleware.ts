// src/middleware.ts
import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // Check for session cookie (better-auth default cookie name)
  const sessionCookie = 
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('__Secure-better-auth.session_token')

  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = ['/history', '/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // If accessing protected route without session, redirect to home
  if (isProtectedRoute && !sessionCookie) {
    const url = new URL('/', request.url)
    url.searchParams.set('authRequired', 'true')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/history', '/dashboard'],
}