import { NextRequest, NextResponse } from 'next/server'
import { findOne, insert } from '@/lib/db'
import type { Card, User } from '@/lib/types'

// Public NFC tap destination: what a TapConnect card's NFC chip is programmed to open.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const normalized = code.trim().toUpperCase()

  const card = await findOne<Card>('Card', { code: normalized })
  const cardUser = card?.userId ? await findOne<User>('User', { id: card.userId }) : null

  if (!card || card.status === 'deactivated') {
    return NextResponse.redirect(new URL('/card-not-active', req.url))
  }

  if (cardUser) {
    try {
      await insert('AnalyticsEvent', { userId: cardUser.id, type: 'NFC_TAP', meta: JSON.stringify({ cardCode: normalized }) })
    } catch (err) {
      console.error('NFC tap analytics error:', err)
    }
    return NextResponse.redirect(new URL(`/${cardUser.username}?src=nfc`, req.url))
  }

  return NextResponse.redirect(new URL(`/activate-card?code=${normalized}`, req.url))
}
