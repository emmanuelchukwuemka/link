import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notify } from '@/lib/notify'

export async function GET() {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const [messages, unreadCount] = await Promise.all([
    prisma.supportMessage.findMany({ where: { userId: authData.userId }, orderBy: { createdAt: 'asc' } }),
    prisma.supportMessage.count({ where: { userId: authData.userId, sender: 'admin', read: false } }),
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

  const message = await prisma.supportMessage.create({
    data: { userId: authData.userId, sender: 'user', body: body.trim() },
  })

  const user = await prisma.user.findUnique({ where: { id: authData.userId }, select: { displayName: true, username: true } })
  const admins = await prisma.user.findMany({ where: { accountType: 'admin' }, select: { id: true } })
  await Promise.all(admins.map((a) => notify(a.id, {
    type: 'SUPPORT_MESSAGE',
    title: `New support message from ${user?.displayName || user?.username}`,
    message: body.trim().slice(0, 140),
    link: `/admin/support/${authData.userId}`,
  })))

  return NextResponse.json({ message }, { status: 201 })
}
