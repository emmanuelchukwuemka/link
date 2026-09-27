import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

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
    const meRes = await fetch(new URL('/api/auth/me', request.url), {
      headers: { cookie: `auth-token=${token}` },
    })
    if (!meRes.ok) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const data = await meRes.json()
    if (data.user?.accountType !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
