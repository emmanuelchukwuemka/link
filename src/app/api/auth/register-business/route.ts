import { NextRequest, NextResponse } from 'next/server'
import { query, findOne, insert, withTransaction } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import type { User, Business } from '@/lib/types'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const { email, username, password, displayName, businessName, phone } = await req.json()

    if (!email || !username || !password || !businessName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existingUsers = await query<User>('SELECT * FROM `User` WHERE `email` = ? OR `username` = ? LIMIT 1', [email, username])
    if (existingUsers[0]) {
      return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 409 })
    }

    const baseSlug = slugify(businessName) || 'business'
    let slug = baseSlug
    let suffix = 1
    while (await findOne<Business>('Business', { slug })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const hashedPassword = await hashPassword(password)

    const user = await withTransaction(async (tx) => {
      const createdUser = await insert<User>(
        'User',
        {
          email,
          username,
          password: hashedPassword,
          displayName: displayName || username,
          phone: phone || null,
          accountType: 'business_admin',
        },
        undefined,
        tx
      )

      await insert('Business', { name: businessName, slug, ownerId: createdUser.id }, undefined, tx)

      return createdUser
    })

    const token = generateToken(user.id)
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, accountType: user.accountType }
    }, { status: 201 })
  } catch (error) {
    console.error('Business registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
