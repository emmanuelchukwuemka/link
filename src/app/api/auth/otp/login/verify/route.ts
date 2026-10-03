import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { findOne } from '@/lib/db'
import { verifyOtp } from '@/lib/otp'
import { generateToken } from '@/lib/auth'
import type { User } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const trimmedCode = String(code || '').trim()

    if (!normalizedEmail || !trimmedCode) {
      return NextResponse.json({ error: 'Missing email or code' }, { status: 400 })
    }

    const result = await verifyOtp(normalizedEmail, trimmedCode, 'login')
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const user = await findOne<User>('User', { email: normalizedEmail })
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email.' }, { status: 404 })
    }
    if (!user.isActive) {
      return NextResponse.json({ error: 'This account has been suspended. Contact support if you believe this is a mistake.' }, { status: 403 })
    }

    const token = generateToken(user.id, '30d')
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, accountType: user.accountType },
    })
  } catch (error) {
    console.error('OTP login verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
