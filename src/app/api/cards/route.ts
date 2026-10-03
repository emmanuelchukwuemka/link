import { NextRequest, NextResponse } from 'next/server'
import { findMany, insert, query } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { generateUniqueCardCode, getCardTapStats, CARD_PRODUCTS } from '@/lib/cards'
import type { Card, User, Business, Order } from '@/lib/types'

const PAGE_SIZE = 10

// Platform admin: list all cards (filtered, paginated, with computed tap stats),
// or generate a new batch.
export async function GET(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const product = searchParams.get('product') || ''
  const color = searchParams.get('color') || ''
  const businessId = searchParams.get('businessId') || ''
  const search = searchParams.get('search')?.trim() || ''
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)

  // Base dataset (all cards) is needed for the summary tiles regardless of
  // the current filter/search, so stats always reflect the whole fleet.
  const allCards = await findMany<Card>('Card', { orderBy: '`createdAt` DESC' })

  const userIds = [...new Set(allCards.map((c) => c.userId).filter((v): v is string => !!v))]
  const businessIds = [...new Set(allCards.map((c) => c.businessId).filter((v): v is string => !!v))]
  const orderIds = [...new Set(allCards.map((c) => c.orderId).filter((v): v is string => !!v))]
  const [users, businesses, orders] = await Promise.all([
    userIds.length ? findMany<User>('User', { where: { id: userIds } }) : Promise.resolve([]),
    businessIds.length ? findMany<Business>('Business', { where: { id: businessIds } }) : Promise.resolve([]),
    orderIds.length ? findMany<Order>('Order', { where: { id: orderIds } }) : Promise.resolve([]),
  ])
  const userMap = new Map(users.map((u) => [u.id, u]))
  const businessMap = new Map(businesses.map((b) => [b.id, b]))
  const orderMap = new Map(orders.map((o) => [o.id, o]))

  const tapStats = await getCardTapStats(allCards.map((c) => c.code))

  const enriched = allCards.map((c) => {
    const user = c.userId ? userMap.get(c.userId) : null
    const business = c.businessId ? businessMap.get(c.businessId) : null
    const order = c.orderId ? orderMap.get(c.orderId) : null
    const stats = tapStats.get(c.code) || { taps30d: 0, lastTap: null }
    return {
      ...c,
      user: user ? { id: user.id, username: user.username, displayName: user.displayName, jobTitle: user.jobTitle } : null,
      business: business ? { id: business.id, name: business.name } : null,
      order: order ? { id: order.id, orderNumber: order.orderNumber } : null,
      taps30d: stats.taps30d,
      lastTap: stats.lastTap,
      notActivated: c.status === 'active' && stats.taps30d === 0 && !stats.lastTap,
    }
  })

  const stats = {
    all: enriched.length,
    unassigned: enriched.filter((c) => c.status === 'unassigned').length,
    reserved: enriched.filter((c) => c.status === 'reserved').length,
    active: enriched.filter((c) => c.status === 'active').length,
    notActivated: enriched.filter((c) => c.notActivated).length,
    deactivated: enriched.filter((c) => c.status === 'deactivated').length,
  }

  let filtered = enriched
  if (status) filtered = filtered.filter((c) => c.status === status)
  if (product) filtered = filtered.filter((c) => c.product === product)
  if (color) filtered = filtered.filter((c) => (c.color || '').toLowerCase() === color.toLowerCase())
  if (businessId) filtered = filtered.filter((c) => c.businessId === businessId)
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter((c) =>
      c.code.toLowerCase().includes(q) ||
      (c.user?.username || '').toLowerCase().includes(q) ||
      (c.user?.displayName || '').toLowerCase().includes(q)
    )
  }

  const total = filtered.length
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return NextResponse.json({ cards: pageItems, total, page: currentPage, totalPages, pageSize: PAGE_SIZE, stats })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { count: rawCount = 1, product = 'standard', color, businessId, orderId, batchLabel } = body

  const n = Math.min(Math.max(parseInt(rawCount, 10) || 1, 1), 1000)
  const safeProduct = CARD_PRODUCTS.includes(product) ? product : 'standard'

  if (businessId) {
    const business = await query<Business>('SELECT * FROM `Business` WHERE `id` = ? LIMIT 1', [businessId])
    if (!business[0]) return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const codes: string[] = []
  for (let i = 0; i < n; i++) {
    codes.push(await generateUniqueCardCode())
  }

  const cards = await Promise.all(codes.map((code) => insert<Card>('Card', {
    code,
    product: safeProduct,
    color: color || null,
    businessId: businessId || null,
    orderId: orderId || null,
    batchLabel: batchLabel || null,
    status: businessId ? 'reserved' : 'unassigned',
    assignedAt: businessId ? new Date() : null,
  })))

  return NextResponse.json({ cards }, { status: 201 })
}
