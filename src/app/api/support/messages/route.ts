import { NextRequest, NextResponse } from 'next/server'
import { findMany, findById, count, insert } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { notify } from '@/lib/notify'
import type { SupportMessage, User } from '@/lib/types'

export async function GET() {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const [messages, unreadCount] = await Promise.all([
    findMany<SupportMessage>('SupportMessage', { where: { userId: authData.userId }, orderBy: '`createdAt` ASC' }),
    count('SupportMessage', { userId: authData.userId, sender: 'admin', read: false }),
  ])

  return NextResponse.json({ messages, unreadCount })
}

export async function POST(req: NextRequest) {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { body } = await req.json()
  if (!body || !body.trim()) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  }

  const message = await insert<SupportMessage>('SupportMessage', { userId: authData.userId, sender: 'user', body: body.trim() })

  const user = await findById<User>('User', authData.userId)
  const admins = await findMany<User>('User', { where: { accountType: 'admin' } })
  await Promise.all(admins.map((a) => notify(a.id, {
    type: 'SUPPORT_MESSAGE',
    title: `New support message from ${user?.displayName || user?.username}`,
    message: body.trim().slice(0, 140),
    link: `/admin/support/${authData.userId}`,
  })))

  return NextResponse.json({ message }, { status: 201 })
}
