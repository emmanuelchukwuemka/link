import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ALLOWED_TYPES = new Set([
  'PROFILE_VIEW', 'NFC_TAP', 'QR_SCAN', 'CONTACT_SAVE', 'PHONE_CLICK',
  'WHATSAPP_CLICK', 'EMAIL_CLICK', 'WEBSITE_CLICK', 'SOCIAL_CLICK',
  'PRODUCT_VIEW', 'ADD_TO_CART', 'CHECKOUT_STARTED', 'ORDER_CREATED',
  'LEAD_CREATED', 'BOOKING_REQUEST', 'SERVICE_REQUEST',
])

export async function POST(req: NextRequest) {
  try {
    const { username, type, meta } = await req.json()

    if (!username || !type || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { username }, select: { id: true } })
    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        type,
        meta: meta ? JSON.stringify(meta).slice(0, 2000) : null,
      }
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('Analytics track error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
