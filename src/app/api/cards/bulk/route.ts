import { NextRequest, NextResponse } from 'next/server'
import { findMany, withTransaction, updateWhere } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Card, Business } from '@/lib/types'

// Platform admin: apply one lifecycle action to many cards at once.
export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { codes, action, businessId } = await req.json().catch(() => ({}))
  if (!Array.isArray(codes) || codes.length === 0) {
    return NextResponse.json({ error: 'codes is required' }, { status: 400 })
  }

  const owned = await findMany<Card>('Card', { where: { code: codes } })
  if (owned.length === 0) return NextResponse.json({ error: 'No matching cards' }, { status: 404 })

  let data: Record<string, unknown>
  switch (action) {
    case 'reserve':
      if (!businessId) return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
      { const business = await findMany<Business>('Business', { where: { id: businessId }, limit: 1 })
        if (!business[0]) return NextResponse.json({ error: 'Business not found' }, { status: 404 }) }
      data = { businessId, userId: null, status: 'reserved', assignedAt: new Date() }
      break
    case 'deactivate':
      data = { status: 'deactivated' }
      break
    case 'unassign':
      data = { userId: null, businessId: null, status: 'unassigned', assignedAt: null }
      break
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  await withTransaction(async (tx) => {
    for (const card of owned) {
      await updateWhere('Card', { id: card.id }, data, tx)
    }
  })

  return NextResponse.json({ updated: owned.length })
}
