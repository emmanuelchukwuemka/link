import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const message = await prisma.contactMessage.findUnique({ where: { id } })
  if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

  if (message.status === 'new') {
    await prisma.contactMessage.update({ where: { id }, data: { status: 'read' } })
    message.status = 'read'
  }

  return NextResponse.json({ message })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { status } = await req.json()
  if (!['new', 'read', 'responded'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const existing = await prisma.contactMessage.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

  const message = await prisma.contactMessage.update({ where: { id }, data: { status } })
  return NextResponse.json({ message })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const existing = await prisma.contactMessage.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

  await prisma.contactMessage.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
