import { NextRequest, NextResponse } from 'next/server'
import { findOne, insert } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { CARD_PRODUCTS } from '@/lib/cards'
import type { Card } from '@/lib/types'

// Platform admin: create a single card with a pre-set code (CSV import path,
// for chips that were already manufactured with pre-printed IDs).
export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { code, product, color } = await req.json().catch(() => ({}))
  const normalized = String(code || '').trim().toUpperCase()
  if (!normalized) return NextResponse.json({ error: 'code is required' }, { status: 400 })

  const existing = await findOne<Card>('Card', { code: normalized })
  if (existing) return NextResponse.json({ error: 'That code already exists' }, { status: 409 })

  const card = await insert<Card>('Card', {
    code: normalized,
    product: CARD_PRODUCTS.includes(product) ? product : 'standard',
    color: color || null,
  })

  return NextResponse.json({ card }, { status: 201 })
}
