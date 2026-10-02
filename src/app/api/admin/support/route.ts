import { NextResponse } from 'next/server'
import { findMany } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { SupportMessage, User } from '@/lib/types'

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const messageRows = await findMany<SupportMessage>('SupportMessage', { orderBy: '`createdAt` DESC' })
  const userIds = [...new Set(messageRows.map((m) => m.userId))]
  const users = userIds.length ? await findMany<User>('User', { where: { id: userIds } }) : []
  const userMap = new Map(users.map((u) => [u.id, { id: u.id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl, accountType: u.accountType }]))
  const messages = messageRows.map((m) => ({ ...m, user: userMap.get(m.userId) }))

  const byUser = new Map<string, typeof messages>()
  for (const m of messages) {
    if (!byUser.has(m.userId)) byUser.set(m.userId, [])
    byUser.get(m.userId)!.push(m)
  }

  const conversations = [...byUser.values()].map((msgs) => ({
    user: msgs[0].user,
    lastMessage: msgs[0].body,
    lastSender: msgs[0].sender,
    updatedAt: msgs[0].createdAt,
    unreadCount: msgs.filter((m) => m.sender === 'user' && !m.read).length,
  })).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return NextResponse.json({ conversations })
}
