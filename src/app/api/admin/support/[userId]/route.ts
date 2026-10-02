import { NextRequest, NextResponse } from 'next/server'
import { findById, findMany, insert } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { notify } from '@/lib/notify'
import type { User, SupportMessage } from '@/lib/types'

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await params
  const userRow = await findById<User>('User', userId)
  if (!userRow) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const user = { id: userRow.id, username: userRow.username, displayName: userRow.displayName, avatarUrl: userRow.avatarUrl, accountType: userRow.accountType }

  const messages = await findMany<SupportMessage>('SupportMessage', { where: { userId }, orderBy: '`createdAt` ASC' })
  return NextResponse.json({ user, messages })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await params
  const { body } = await req.json()
  if (!body || !body.trim()) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  }

  const user = await findById<User>('User', userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const message = await insert<SupportMessage>('SupportMessage', { userId, sender: 'admin', body: body.trim() })

  await notify(userId, {
    type: 'SUPPORT_REPLY',
    title: 'New reply from support',
    message: body.trim().slice(0, 140),
    link: '/dashboard',
  })

  return NextResponse.json({ message }, { status: 201 })
}
