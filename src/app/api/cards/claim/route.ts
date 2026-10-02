import { NextRequest, NextResponse } from 'next/server'
import { findOne, updateWhere, findById } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { Card } from '@/lib/types'

// Authenticated user connects a physical card to their own profile.
export async function POST(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: 'Card code is required' }, { status: 400 })

    const normalized = String(code).trim().toUpperCase()
    const card = await findOne<Card>('Card', { code: normalized })

    if (!card) {
      return NextResponse.json({ error: 'We could not find a card with that code' }, { status: 404 })
    }
    if (card.status === 'deactivated') {
      return NextResponse.json({ error: 'This card has been deactivated' }, { status: 409 })
    }
    if (card.userId && card.userId !== authData.userId) {
      return NextResponse.json({ error: 'This card is already connected to another profile' }, { status: 409 })
    }

    await updateWhere('Card', { code: normalized }, { userId: authData.userId, businessId: null, status: 'active', assignedAt: new Date() })
    const updated = await findById<Card>('Card', card.id)

    return NextResponse.json({ card: updated })
  } catch (error) {
    console.error('Card claim error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
