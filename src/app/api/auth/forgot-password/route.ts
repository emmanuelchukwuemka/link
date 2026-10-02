import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { findOne, insert } from '@/lib/db'
import { sendEmail } from '@/lib/notify'
import type { User } from '@/lib/types'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await findOne<User>('User', { email })

    let devResetUrl: string | undefined

    // Always respond the same way whether or not the account exists, so this
    // endpoint can't be used to enumerate registered emails.
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      await insert('PasswordResetToken', { userId: user.id, token, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) })

      const resetUrl = `${req.nextUrl.origin}/reset-password?token=${token}`
      await sendEmail(email, 'Reset your TapConnect password', `Reset your password: ${resetUrl} (expires in 1 hour)`)

      // No real email provider is configured yet (see lib/notify.ts) — surface
      // the link directly outside production so the flow stays testable.
      if (process.env.NODE_ENV !== 'production') {
        devResetUrl = resetUrl
      }
    }

    return NextResponse.json({ ok: true, devResetUrl })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
