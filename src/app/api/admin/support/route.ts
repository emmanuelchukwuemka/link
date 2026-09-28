import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const messages = await prisma.supportMessage.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, accountType: true } } },
  })

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
