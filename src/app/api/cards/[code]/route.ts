import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// Platform admin: reassign/deactivate a card
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { code } = await params
  const body = await req.json()

  const card = await prisma.card.findUnique({ where: { code } })
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const data: Record<string, unknown> = {}

  if (body.status && ['unassigned', 'active', 'deactivated'].includes(body.status)) {
    data.status = body.status
  }
  if ('userId' in body) {
    data.userId = body.userId || null
    data.businessId = null
    data.assignedAt = body.userId ? new Date() : null
    if (body.userId) data.status = 'active'
  }
  if ('businessId' in body) {
    data.businessId = body.businessId || null
    data.userId = null
    data.assignedAt = body.businessId ? new Date() : null
  }

  const updated = await prisma.card.update({ where: { code }, data })
  return NextResponse.json({ card: updated })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { code } = await params
  const card = await prisma.card.findUnique({
    where: { code },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
      business: { select: { id: true, name: true } },
    },
  })
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  return NextResponse.json({ card })
}
