import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { notify } from '@/lib/notify'

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await params
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true, avatarUrl: true, accountType: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const messages = await prisma.supportMessage.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
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

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const message = await prisma.supportMessage.create({
    data: { userId, sender: 'admin', body: body.trim() },
  })

  await notify(userId, {
    type: 'SUPPORT_REPLY',
    title: 'New reply from support',
    message: body.trim().slice(0, 140),
    link: '/dashboard',
  })

  return NextResponse.json({ message }, { status: 201 })
}
