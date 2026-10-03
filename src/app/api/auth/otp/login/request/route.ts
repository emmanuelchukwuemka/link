import { NextRequest, NextResponse } from 'next/server'
import { findOne } from '@/lib/db'
import { requestOtp } from '@/lib/otp'
import type { User } from '@/lib/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!EMAIL_RE.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const user = await findOne<User>('User', { email: normalizedEmail })
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email. Please sign up instead.' }, { status: 404 })
    }
    if (!user.isActive) {
      return NextResponse.json({ error: 'This account has been suspended. Contact support if you believe this is a mistake.' }, { status: 403 })
    }

    const result = await requestOtp(normalizedEmail, 'login')
    if (!result.ok) {
      return NextResponse.json({ error: result.error, retryAfterSeconds: result.retryAfterSeconds }, { status: 429 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('OTP login request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
