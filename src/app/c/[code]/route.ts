import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public NFC tap destination: what a TapConnect card's NFC chip is programmed to open.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const normalized = code.trim().toUpperCase()

  const card = await prisma.card.findUnique({
    where: { code: normalized },
    include: { user: { select: { id: true, username: true } } },
  })

  if (!card || card.status === 'deactivated') {
    return NextResponse.redirect(new URL('/card-not-active', req.url))
  }

  if (card.user) {
    try {
      await prisma.analyticsEvent.create({
        data: { userId: card.user.id, type: 'NFC_TAP', meta: JSON.stringify({ cardCode: normalized }) },
      })
    } catch (err) {
      console.error('NFC tap analytics error:', err)
    }
    return NextResponse.redirect(new URL(`/${card.user.username}?src=nfc`, req.url))
  }

  return NextResponse.redirect(new URL(`/activate-card?code=${normalized}`, req.url))
}
