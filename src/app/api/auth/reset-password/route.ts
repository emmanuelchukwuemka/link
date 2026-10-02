import { NextRequest, NextResponse } from 'next/server'
import { findOne, updateWhere, withTransaction } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import type { PasswordResetToken } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const resetToken = await findOne<PasswordResetToken>('PasswordResetToken', { token })
    if (!resetToken || resetToken.used || new Date(resetToken.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    await withTransaction(async (tx) => {
      await updateWhere('User', { id: resetToken.userId }, { password: hashedPassword }, tx)
      await updateWhere('PasswordResetToken', { token }, { used: true }, tx)
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
