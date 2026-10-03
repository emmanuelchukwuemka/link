import { NextRequest, NextResponse } from 'next/server'
import { findOne, updateById } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { User } from '@/lib/types'

const USERNAME_RE = /^[a-z0-9][a-z0-9-]{2,29}$/

export async function PUT(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { username } = await req.json()
    const normalized = String(username || '').trim().toLowerCase()

    if (!USERNAME_RE.test(normalized)) {
      return NextResponse.json({ error: 'Username must be 3-30 characters: lowercase letters, numbers and hyphens only.' }, { status: 400 })
    }

    const existing = await findOne<User>('User', { username: normalized })
    if (existing && existing.id !== authData.userId) {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
    }

    const user = await updateById<User>('User', authData.userId, { username: normalized })
    if (!user) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    const { password: _password, ...safeUser } = user
    void _password
    return NextResponse.json({ user: safeUser })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
