import { NextRequest, NextResponse } from 'next/server'
import { findOne } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import type { User } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await findOne<User>('User', { email })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'This account has been suspended. Contact support if you believe this is a mistake.' }, { status: 403 })
    }

    const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 1 * 24 * 60 * 60
    const token = generateToken(user.id, rememberMe ? '30d' : '1d')
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, accountType: user.accountType }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
