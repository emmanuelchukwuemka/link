import { NextRequest, NextResponse } from 'next/server'
import { findOne, updateWhere, findById } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Card, User, Business } from '@/lib/types'

// Platform admin: reassign/deactivate a card
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { code } = await params
  const body = await req.json()

  const card = await findOne<Card>('Card', { code })
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

  await updateWhere('Card', { code }, data)
  const updated = await findById<Card>('Card', card.id)
  return NextResponse.json({ card: updated })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { code } = await params
  const card = await findOne<Card>('Card', { code })
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const [user, business] = await Promise.all([
    card.userId ? findById<User>('User', card.userId) : null,
    card.businessId ? findById<Business>('Business', card.businessId) : null,
  ])

  return NextResponse.json({
    card: {
      ...card,
      user: user ? { id: user.id, username: user.username, displayName: user.displayName } : null,
      business: business ? { id: business.id, name: business.name } : null,
    },
  })
}
