import { NextResponse } from 'next/server'
import { query, findMany, count } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { AnalyticsEvent, Lead, Order, OrderItem, Link } from '@/lib/types'

const CLICK_TYPES = ['CONTACT_SAVE', 'PHONE_CLICK', 'WHATSAPP_CLICK', 'EMAIL_CLICK', 'WEBSITE_CLICK', 'SOCIAL_CLICK']

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const ACTIVITY_LABELS: Record<string, (meta: Record<string, unknown> | null) => string> = {
  PROFILE_VIEW: () => 'New profile view',
  NFC_TAP: () => 'NFC card tapped',
  QR_SCAN: () => 'QR code scanned',
  CONTACT_SAVE: () => 'Contact saved',
  PHONE_CLICK: () => 'Phone number clicked',
  WHATSAPP_CLICK: () => 'WhatsApp clicked',
  EMAIL_CLICK: () => 'Email clicked',
  WEBSITE_CLICK: () => 'Link clicked (Website)',
  SOCIAL_CLICK: (meta) => `Social clicked${meta?.platform ? ` (${meta.platform})` : ''}`,
  PRODUCT_VIEW: () => 'Product viewed',
  ADD_TO_CART: () => 'Product order started',
  LEAD_CREATED: () => 'New lead received',
  SERVICE_REQUEST: () => 'Service enquiry received',
}

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const userId = authData.userId

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const [currentEvents, previousEvents, currentLeads, previousLeads, recentEvents, recentLeads, recentOrders, links, cardCount] = await Promise.all([
      query<{ type: string; c: number }>(
        'SELECT `type`, COUNT(*) as c FROM `AnalyticsEvent` WHERE `userId` = ? AND `createdAt` >= ? GROUP BY `type`',
        [userId, sevenDaysAgo]
      ),
      query<{ type: string; c: number }>(
        'SELECT `type`, COUNT(*) as c FROM `AnalyticsEvent` WHERE `userId` = ? AND `createdAt` >= ? AND `createdAt` < ? GROUP BY `type`',
        [userId, fourteenDaysAgo, sevenDaysAgo]
      ),
      query<{ c: number }>('SELECT COUNT(*) as c FROM `Lead` WHERE `ownerId` = ? AND `createdAt` >= ?', [userId, sevenDaysAgo]).then((r) => Number(r[0]?.c ?? 0)),
      query<{ c: number }>('SELECT COUNT(*) as c FROM `Lead` WHERE `ownerId` = ? AND `createdAt` >= ? AND `createdAt` < ?', [userId, fourteenDaysAgo, sevenDaysAgo]).then((r) => Number(r[0]?.c ?? 0)),
      findMany<AnalyticsEvent>('AnalyticsEvent', { where: { userId }, orderBy: '`createdAt` DESC', limit: 8 }),
      findMany<Lead>('Lead', { where: { ownerId: userId }, orderBy: '`createdAt` DESC', limit: 3 }),
      findMany<Order>('Order', { where: { userId }, orderBy: '`createdAt` DESC', limit: 3 }),
      findMany<Link>('Link', { where: { userId }, orderBy: '`clicks` DESC', limit: 5 }),
      count('Card', { userId }),
    ])

    const orderIds = recentOrders.map((o) => o.id)
    const orderItems = orderIds.length
      ? await query<OrderItem & { productName: string }>(
          'SELECT oi.*, p.`name` as productName FROM `OrderItem` oi JOIN `Product` p ON p.`id` = oi.`productId` WHERE oi.`orderId` IN (?)',
          [orderIds]
        )
      : []

    const curr: Record<string, number> = {}
    for (const e of currentEvents) curr[e.type] = Number(e.c)
    const prev: Record<string, number> = {}
    for (const e of previousEvents) prev[e.type] = Number(e.c)

    const currClicks = CLICK_TYPES.reduce((s, t) => s + (curr[t] || 0), 0)
    const prevClicks = CLICK_TYPES.reduce((s, t) => s + (prev[t] || 0), 0)

    const stats = {
      views: { value: curr.PROFILE_VIEW || 0, change: pctChange(curr.PROFILE_VIEW || 0, prev.PROFILE_VIEW || 0) },
      nfcTaps: { value: curr.NFC_TAP || 0, change: pctChange(curr.NFC_TAP || 0, prev.NFC_TAP || 0) },
      linkClicks: { value: currClicks, change: pctChange(currClicks, prevClicks) },
      leads: { value: currentLeads, change: pctChange(currentLeads, previousLeads) },
    }

    // 7-day daily series for each of the four headline stats, all from the
    // same underlying event/lead rows already loaded for the period totals.
    const [sevenDayEvents, sevenDayLeads] = await Promise.all([
      query<{ type: string; createdAt: Date }>('SELECT `type`, `createdAt` FROM `AnalyticsEvent` WHERE `userId` = ? AND `createdAt` >= ?', [userId, sevenDaysAgo]),
      query<{ createdAt: Date }>('SELECT `createdAt` FROM `Lead` WHERE `ownerId` = ? AND `createdAt` >= ?', [userId, sevenDaysAgo]),
    ])

    const emptyDayBuckets = () => {
      const b: Record<string, number> = {}
      for (let i = 6; i >= 0; i--) b[dayKey(new Date(now.getTime() - i * 24 * 60 * 60 * 1000))] = 0
      return b
    }
    const viewBuckets = emptyDayBuckets()
    const nfcBuckets = emptyDayBuckets()
    const clickBuckets = emptyDayBuckets()
    const leadBuckets = emptyDayBuckets()

    for (const e of sevenDayEvents) {
      const key = dayKey(e.createdAt)
      if (!(key in viewBuckets)) continue
      if (e.type === 'PROFILE_VIEW') viewBuckets[key]++
      else if (e.type === 'NFC_TAP') nfcBuckets[key]++
      else if (CLICK_TYPES.includes(e.type)) clickBuckets[key]++
    }
    for (const l of sevenDayLeads) {
      const key = dayKey(l.createdAt)
      if (key in leadBuckets) leadBuckets[key]++
    }

    const days = Object.keys(viewBuckets)
    const series = {
      views: days.map((date) => viewBuckets[date]),
      nfcTaps: days.map((date) => nfcBuckets[date]),
      linkClicks: days.map((date) => clickBuckets[date]),
      leads: days.map((date) => leadBuckets[date]),
      dates: days,
    }

    // Top links: blend of custom Link clicks and named contact-action types
    const topLinks = [
      ...links.filter((l) => l.clicks > 0).map((l) => ({ label: l.title || 'Untitled Link', value: l.clicks })),
      { label: 'WhatsApp', value: curr.WHATSAPP_CLICK || 0 },
      { label: 'Website', value: curr.WEBSITE_CLICK || 0 },
      { label: 'Products', value: curr.PRODUCT_VIEW || 0 },
      { label: 'Email', value: curr.EMAIL_CLICK || 0 },
      { label: 'Phone', value: curr.PHONE_CLICK || 0 },
    ]
      .filter((l) => l.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const activity = [
      ...recentEvents.map((e) => ({
        id: e.id,
        label: ACTIVITY_LABELS[e.type]?.(e.meta ? JSON.parse(e.meta) : null) || e.type,
        createdAt: e.createdAt,
      })),
      ...recentLeads.map((l) => ({ id: l.id, label: 'New lead received', createdAt: l.createdAt })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6)

    return NextResponse.json({
      stats,
      series,
      topLinks,
      activity,
      orders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        createdAt: o.createdAt,
        items: orderItems.filter((i) => i.orderId === o.id).map((i) => ({ name: i.productName, quantity: i.quantity })),
      })),
      cardCount,
    })
  } catch (error) {
    console.error('Dashboard overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
