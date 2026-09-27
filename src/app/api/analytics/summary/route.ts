import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

function rangeStart(range: string | null): Date | undefined {
  const now = new Date()
  switch (range) {
    case 'today': {
      const d = new Date(now)
      d.setHours(0, 0, 0, 0)
      return d
    }
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    default:
      return undefined // lifetime
  }
}

export async function GET(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range')
    const since = rangeStart(range)

    const events = await prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: {
        userId: authData.userId,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      _count: { type: true },
    })

    const counts: Record<string, number> = {}
    for (const e of events) counts[e.type] = e._count.type

    const leadCount = await prisma.lead.count({
      where: {
        ownerId: authData.userId,
        ...(since ? { createdAt: { gte: since } } : {}),
      }
    })

    const views = counts.PROFILE_VIEW || 0
    const clicks = ['CONTACT_SAVE', 'PHONE_CLICK', 'WHATSAPP_CLICK', 'EMAIL_CLICK', 'WEBSITE_CLICK', 'SOCIAL_CLICK']
      .reduce((sum, t) => sum + (counts[t] || 0), 0)

    return NextResponse.json({
      range: range || 'lifetime',
      views,
      nfcTaps: counts.NFC_TAP || 0,
      qrScans: counts.QR_SCAN || 0,
      clicks,
      contactSaves: counts.CONTACT_SAVE || 0,
      whatsappClicks: counts.WHATSAPP_CLICK || 0,
      phoneClicks: counts.PHONE_CLICK || 0,
      emailClicks: counts.EMAIL_CLICK || 0,
      websiteClicks: counts.WEBSITE_CLICK || 0,
      socialClicks: counts.SOCIAL_CLICK || 0,
      productViews: counts.PRODUCT_VIEW || 0,
      addToCart: counts.ADD_TO_CART || 0,
      leads: leadCount,
      ctr: views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0,
    })
  } catch (error) {
    console.error('Analytics summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
