import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { findOne, insert, count, withTransaction } from '@/lib/db'
import { verifyOtp } from '@/lib/otp'
import { hashPassword, generateToken } from '@/lib/auth'
import type { User, Business } from '@/lib/types'

async function uniqueUsernameFromEmail(email: string): Promise<string> {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'user'
  let candidate = base
  let suffix = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const taken = await count('User', { username: candidate })
    if (taken === 0) return candidate
    suffix += 1
    candidate = `${base}${suffix}`
  }
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const { email, code, businessName } = await req.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const trimmedCode = String(code || '').trim()
    const trimmedBusinessName = String(businessName || '').trim()

    if (!normalizedEmail || !trimmedCode) {
      return NextResponse.json({ error: 'Missing email or code' }, { status: 400 })
    }

    const result = await verifyOtp(normalizedEmail, trimmedCode, 'register')
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const existing = await findOne<User>('User', { email: normalizedEmail })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 409 })
    }

    const username = await uniqueUsernameFromEmail(normalizedEmail)
    // OTP verification proves email ownership, so no password is collected
    // up front (matches the simplified signup flow). A random hash is stored
    // to satisfy the column constraint; users can set a real password anytime
    // via the existing forgot-password flow.
    const randomPassword = randomBytes(32).toString('hex')
    const hashedPassword = await hashPassword(randomPassword)

    const user = await withTransaction(async (tx) => {
      const createdUser = await insert<User>('User', {
        email: normalizedEmail,
        username,
        password: hashedPassword,
        displayName: trimmedBusinessName || username,
        accountType: trimmedBusinessName ? 'business_admin' : 'individual',
      }, undefined, tx)

      if (trimmedBusinessName) {
        const baseSlug = slugify(trimmedBusinessName) || 'business'
        let slug = baseSlug
        let suffix = 1
        while (await findOne<Business>('Business', { slug }, tx)) {
          slug = `${baseSlug}-${suffix++}`
        }
        await insert('Business', { name: trimmedBusinessName, slug, ownerId: createdUser.id }, undefined, tx)
      }

      return createdUser
    })

    const token = generateToken(user.id)
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, accountType: user.accountType },
    }, { status: 201 })
  } catch (error) {
    console.error('OTP verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
