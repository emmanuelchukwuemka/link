import { NextRequest, NextResponse } from 'next/server'
import { query, insert } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import type { User } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { email, username, password, displayName, phone } = await req.json()

    if (!email || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user exists
    const existingUsers = await query<User>('SELECT * FROM `User` WHERE `email` = ? OR `username` = ? LIMIT 1', [email, username])

    if (existingUsers[0]) {
      return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await insert<User>('User', {
      email,
      username,
      password: hashedPassword,
      displayName: displayName || username,
      phone: phone || null,
      accountType: 'individual',
    })

    const token = generateToken(user.id)
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, accountType: user.accountType }
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
