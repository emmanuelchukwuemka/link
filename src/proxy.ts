import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { findById } from '@/lib/db'
import type { User } from '@/lib/types'

const JWT_SECRET = process.env.JWT_SECRET || 'tapconnect-secret-key-change-in-production-2026'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  let payload: { userId: string } | null = null
  if (token) {
    try {
      payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    } catch {
      payload = null
    }
  }

  if (!payload) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/admin')) {
    // Was a self-fetch to /api/auth/me using request.url as the base — behind
    // Passenger's reverse proxy that URL's origin doesn't reliably resolve to
    // a reachable address (ECONNREFUSED 127.0.0.1:3000). Query the DB
    // directly instead, same as requireRole() does for API routes.
    const user = await findById<User>('User', payload.userId)
    if (!user || !user.isActive) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user.accountType !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
