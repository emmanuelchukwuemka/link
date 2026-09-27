import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function emptyDayBuckets(now: number, days: number): Record<string, number> {
  const b: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) b[dayKey(new Date(now - i * 24 * 60 * 60 * 1000))] = 0
  return b
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

const ORDER_STATUS_GROUPS: Record<string, 'pending' | 'processing' | 'shipped' | 'delivered'> = {
  order_placed: 'pending',
  payment_confirmed: 'pending',
  profile_setup_required: 'pending',
  profile_completed: 'pending',
  preparing: 'processing',
  in_production: 'processing',
  quality_check: 'processing',
  shipped: 'shipped',
  out_for_delivery: 'shipped',
  delivered: 'delivered',
  activated: 'delivered',
}

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const now = Date.now()
    const d7 = now - 7 * 24 * 60 * 60 * 1000
    const d30 = now - 30 * 24 * 60 * 60 * 1000
    const d60 = now - 60 * 24 * 60 * 60 * 1000
    const d14Future = new Date(now + 14 * 24 * 60 * 60 * 1000)

    const [
      totalUsers, totalBusinesses, totalEmployees, totalOrdersPaid,
      cardsSoldAgg, revenueOrdersAgg, revenueSubsAgg,
      usersCurr, usersPrev, businessesCurr, businessesPrev, employeesCurr, employeesPrev,
      ordersCurr, ordersPrev, cardsCurrAgg, cardsPrevAgg,
      revenueOrdersCurrAgg, revenueOrdersPrevAgg, revenueSubsCurrAgg, revenueSubsPrevAgg,
      usersLast7, businessesLast7, ordersLast7, cardItemsLast7, paymentsLast7, subsLast7,
      paymentsLast30, subsLast30,
      recentUsers, recentOrders, paidOrderItems,
      proUsers, paidBusinesses, orderStatusCounts, eventCounts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.user.count({ where: { accountType: 'employee' } }),
      prisma.order.count({ where: { paymentStatus: 'paid' } }),
      prisma.orderItem.aggregate({ _sum: { quantity: true }, where: { order: { paymentStatus: 'paid' } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid' } }),
      prisma.subscriptionPayment.aggregate({ _sum: { amount: true }, where: { status: 'success' } }),

      prisma.user.count({ where: { createdAt: { gte: new Date(d30) } } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(d60), lt: new Date(d30) } } }),
      prisma.business.count({ where: { createdAt: { gte: new Date(d30) } } }),
      prisma.business.count({ where: { createdAt: { gte: new Date(d60), lt: new Date(d30) } } }),
      prisma.user.count({ where: { accountType: 'employee', createdAt: { gte: new Date(d30) } } }),
      prisma.user.count({ where: { accountType: 'employee', createdAt: { gte: new Date(d60), lt: new Date(d30) } } }),
      prisma.order.count({ where: { paymentStatus: 'paid', createdAt: { gte: new Date(d30) } } }),
      prisma.order.count({ where: { paymentStatus: 'paid', createdAt: { gte: new Date(d60), lt: new Date(d30) } } }),
      prisma.orderItem.aggregate({ _sum: { quantity: true }, where: { order: { paymentStatus: 'paid', createdAt: { gte: new Date(d30) } } } }),
      prisma.orderItem.aggregate({ _sum: { quantity: true }, where: { order: { paymentStatus: 'paid', createdAt: { gte: new Date(d60), lt: new Date(d30) } } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid', createdAt: { gte: new Date(d30) } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid', createdAt: { gte: new Date(d60), lt: new Date(d30) } } }),
      prisma.subscriptionPayment.aggregate({ _sum: { amount: true }, where: { status: 'success', createdAt: { gte: new Date(d30) } } }),
      prisma.subscriptionPayment.aggregate({ _sum: { amount: true }, where: { status: 'success', createdAt: { gte: new Date(d60), lt: new Date(d30) } } }),

      prisma.user.findMany({ where: { createdAt: { gte: new Date(d7) } }, select: { createdAt: true, accountType: true } }),
      prisma.business.findMany({ where: { createdAt: { gte: new Date(d7) } }, select: { createdAt: true } }),
      prisma.order.findMany({ where: { paymentStatus: 'paid', createdAt: { gte: new Date(d7) } }, select: { createdAt: true } }),
      prisma.orderItem.findMany({ where: { order: { paymentStatus: 'paid', createdAt: { gte: new Date(d7) } } }, select: { quantity: true, order: { select: { createdAt: true } } } }),
      prisma.payment.findMany({ where: { status: 'success', createdAt: { gte: new Date(d7) } }, select: { amount: true, createdAt: true } }),
      prisma.subscriptionPayment.findMany({ where: { status: 'success', createdAt: { gte: new Date(d7) } }, select: { amount: true, createdAt: true } }),

      prisma.payment.findMany({ where: { status: 'success', createdAt: { gte: new Date(d30) } }, select: { amount: true, createdAt: true } }),
      prisma.subscriptionPayment.findMany({ where: { status: 'success', createdAt: { gte: new Date(d30) } }, select: { amount: true, createdAt: true } }),

      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, username: true, displayName: true, email: true, accountType: true, createdAt: true, isActive: true } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' }, take: 5,
        select: { id: true, orderNumber: true, customerName: true, total: true, status: true, items: { select: { quantity: true, product: { select: { name: true } } } } },
      }),
      prisma.orderItem.findMany({
        where: { order: { paymentStatus: 'paid' } },
        select: { quantity: true, unitPrice: true, product: { select: { id: true, name: true, images: true } } },
      }),

      prisma.user.findMany({ where: { plan: { not: 'free' } }, select: { planExpiresAt: true } }),
      prisma.business.findMany({ where: { plan: { not: 'free' } }, select: { planExpiresAt: true } }),
      prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.analyticsEvent.groupBy({ by: ['type'], _count: { type: true } }),
    ])

    const totalRevenue = (revenueOrdersAgg._sum.total || 0) + (revenueSubsAgg._sum.amount || 0)
    const revenueCurr = (revenueOrdersCurrAgg._sum.total || 0) + (revenueSubsCurrAgg._sum.amount || 0)
    const revenuePrev = (revenueOrdersPrevAgg._sum.total || 0) + (revenueSubsPrevAgg._sum.amount || 0)

    const userBuckets = emptyDayBuckets(now, 7)
    const businessBuckets = emptyDayBuckets(now, 7)
    const employeeBuckets = emptyDayBuckets(now, 7)
    const orderBuckets = emptyDayBuckets(now, 7)
    const cardBuckets = emptyDayBuckets(now, 7)
    const revenueBuckets7 = emptyDayBuckets(now, 7)

    for (const u of usersLast7) {
      const key = dayKey(u.createdAt)
      if (u.accountType === 'employee') { if (key in employeeBuckets) employeeBuckets[key]++ }
      else if (u.accountType === 'individual') { if (key in userBuckets) userBuckets[key]++ }
    }
    for (const b of businessesLast7) { const key = dayKey(b.createdAt); if (key in businessBuckets) businessBuckets[key]++ }
    for (const o of ordersLast7) { const key = dayKey(o.createdAt); if (key in orderBuckets) orderBuckets[key]++ }
    for (const i of cardItemsLast7) { const key = dayKey(i.order.createdAt); if (key in cardBuckets) cardBuckets[key] += i.quantity }
    for (const p of paymentsLast7) { const key = dayKey(p.createdAt); if (key in revenueBuckets7) revenueBuckets7[key] += p.amount }
    for (const s of subsLast7) { const key = dayKey(s.createdAt); if (key in revenueBuckets7) revenueBuckets7[key] += s.amount }

    const days7 = Object.keys(userBuckets)

    const productSalesBuckets30 = emptyDayBuckets(now, 30)
    const subsBuckets30 = emptyDayBuckets(now, 30)
    for (const p of paymentsLast30) { const key = dayKey(p.createdAt); if (key in productSalesBuckets30) productSalesBuckets30[key] += p.amount }
    for (const s of subsLast30) { const key = dayKey(s.createdAt); if (key in subsBuckets30) subsBuckets30[key] += s.amount }
    const days30 = Object.keys(productSalesBuckets30)

    const productMap = new Map<string, { id: string; name: string; image: string | null; unitsSold: number; revenue: number }>()
    for (const item of paidOrderItems) {
      const existing = productMap.get(item.product.id)
      const images: string[] = item.product.images ? JSON.parse(item.product.images) : []
      const revenue = item.quantity * item.unitPrice
      if (existing) {
        existing.unitsSold += item.quantity
        existing.revenue += revenue
      } else {
        productMap.set(item.product.id, { id: item.product.id, name: item.product.name, image: images[0] || null, unitsSold: item.quantity, revenue })
      }
    }
    const topProducts = Array.from(productMap.values()).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5)

    let active = 0, expiringSoon = 0, expired = 0
    for (const p of [...proUsers, ...paidBusinesses]) {
      if (!p.planExpiresAt) { active++; continue }
      if (p.planExpiresAt <= new Date()) expired++
      else if (p.planExpiresAt <= d14Future) expiringSoon++
      else active++
    }

    const orderStatusOverview = { pending: 0, processing: 0, shipped: 0, delivered: 0 }
    for (const row of orderStatusCounts) {
      const group = ORDER_STATUS_GROUPS[row.status]
      if (group) orderStatusOverview[group] += row._count.status
    }

    const eventMap: Record<string, number> = {}
    for (const e of eventCounts) eventMap[e.type] = e._count.type
    const nfcTap = eventMap.NFC_TAP || 0
    const qrCode = eventMap.QR_SCAN || 0
    const website = Math.max((eventMap.PROFILE_VIEW || 0) - nfcTap - qrCode, 0)

    return NextResponse.json({
      stats: {
        users: { value: totalUsers, change: pctChange(usersCurr, usersPrev), series: days7.map(d => userBuckets[d]) },
        businesses: { value: totalBusinesses, change: pctChange(businessesCurr, businessesPrev), series: days7.map(d => businessBuckets[d]) },
        employees: { value: totalEmployees, change: pctChange(employeesCurr, employeesPrev), series: days7.map(d => employeeBuckets[d]) },
        orders: { value: totalOrdersPaid, change: pctChange(ordersCurr, ordersPrev), series: days7.map(d => orderBuckets[d]) },
        cardsSold: { value: cardsSoldAgg._sum.quantity || 0, change: pctChange(cardsCurrAgg._sum.quantity || 0, cardsPrevAgg._sum.quantity || 0), series: days7.map(d => cardBuckets[d]) },
        revenue: { value: totalRevenue, change: pctChange(revenueCurr, revenuePrev), series: days7.map(d => revenueBuckets7[d]) },
      },
      revenueChart: { dates: days30, productSales: days30.map(d => productSalesBuckets30[d]), subscriptions: days30.map(d => subsBuckets30[d]) },
      userGrowthChart: { dates: days7, individuals: days7.map(d => userBuckets[d]), businesses: days7.map(d => businessBuckets[d]), employees: days7.map(d => employeeBuckets[d]) },
      recentUsers: recentUsers.map(u => ({ id: u.id, name: u.displayName || u.username, username: u.username, email: u.email, accountType: u.accountType, createdAt: u.createdAt, isActive: u.isActive })),
      recentOrders: recentOrders.map(o => ({
        id: o.id, orderNumber: o.orderNumber, customerName: o.customerName, total: o.total, status: o.status,
        productSummary: o.items.length === 1 ? o.items[0].product.name : o.items.length > 1 ? `${o.items[0].product.name} +${o.items.length - 1} more` : '—',
      })),
      topProducts,
      subscriptionOverview: { active, expiringSoon, expired, total: active + expiringSoon + expired },
      orderStatusOverview,
      trafficSources: { nfcTap, qrCode, website, total: nfcTap + qrCode + website },
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
