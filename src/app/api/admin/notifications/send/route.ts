import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { notify } from '@/lib/notify'

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { username, broadcast, title, message, link } = await req.json()

  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
  }

  if (broadcast) {
    const users = await prisma.user.findMany({ select: { id: true } })
    await Promise.all(users.map((u) => notify(u.id, { type: 'ADMIN_BROADCAST', title, message, link })))
    return NextResponse.json({ sent: users.length })
  }

  if (!username) {
    return NextResponse.json({ error: 'A username or broadcast flag is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } })
  if (!user) return NextResponse.json({ error: `No user found with username "${username}"` }, { status: 404 })

  await notify(user.id, { type: 'ADMIN_MESSAGE', title, message, link })
  return NextResponse.json({ sent: 1 })
}
