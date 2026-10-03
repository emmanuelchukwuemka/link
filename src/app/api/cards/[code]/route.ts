import { NextRequest, NextResponse } from 'next/server'
import { findOne, updateWhere, findById } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { CARD_PRODUCTS } from '@/lib/cards'
import type { Card, User, Business } from '@/lib/types'

// Platform admin: edit a card's details, or move it through its lifecycle.
//
// Lifecycle actions (keeps businessId and userId independently meaningful —
// a card assigned to a specific employee still shows which business pool it
// came from, rather than the two being mutually exclusive):
//   assign      { userId }     -> active, keeps existing businessId
//   reserve     { businessId } -> reserved, clears userId
//   unassign    {}             -> unassigned, clears userId + businessId
//   deactivate  {}             -> deactivated (history retained)
//   reactivate  {}             -> back to active/reserved/unassigned based on what's still set
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { code } = await params
  const body = await req.json()

  const card = await findOne<Card>('Card', { code })
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const data: Record<string, unknown> = {}

  switch (body.action) {
    case 'assign':
      if (!body.userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })
      data.userId = body.userId
      data.status = 'active'
      data.assignedAt = new Date()
      break
    case 'reserve':
      if (!body.businessId) return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
      data.businessId = body.businessId
      data.userId = null
      data.status = 'reserved'
      data.assignedAt = new Date()
      break
    case 'unassign':
      data.userId = null
      data.businessId = null
      data.status = 'unassigned'
      data.assignedAt = null
      break
    case 'deactivate':
      data.status = 'deactivated'
      break
    case 'reactivate':
      data.status = card.userId ? 'active' : card.businessId ? 'reserved' : 'unassigned'
      break
    default: {
      // Direct field corrections (no lifecycle change).
      if (body.product !== undefined && CARD_PRODUCTS.includes(body.product)) data.product = body.product
      if (body.color !== undefined) data.color = body.color || null
      if (body.batchLabel !== undefined) data.batchLabel = body.batchLabel || null
      if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: 'No recognized action or fields' }, { status: 400 })
      }
    }
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
