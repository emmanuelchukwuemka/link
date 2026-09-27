import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

const VALID_STATUSES = ['new', 'contacted', 'interested', 'converted', 'lost']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name, email, phone, message, source, status, notes } = await req.json()

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const existing = await prisma.lead.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      name: name !== undefined ? name : undefined,
      email: email !== undefined ? (email || null) : undefined,
      phone: phone !== undefined ? (phone || null) : undefined,
      message: message !== undefined ? (message || null) : undefined,
      source: source !== undefined ? source : undefined,
      status: status !== undefined ? status : undefined,
      notes: notes !== undefined ? (notes || null) : undefined,
    },
    include: { owner: { select: { username: true, displayName: true } } },
  })

  return NextResponse.json({ lead })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await prisma.lead.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
