import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { User, Order, OrderItem, Product } from '@/lib/types'

async function countRows(sql: string, params: unknown[]): Promise<number> {
  const rows = await query<{ c: number }>(sql, params)
  return Number(rows[0]?.c ?? 0)
}
async function sumRows(sql: string, params: unknown[]): Promise<number> {
  const rows = await query<{ s: number | null }>(sql, params)
  return Number(rows[0]?.s ?? 0)
}

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
      cardsSoldSum, revenueOrdersSum, revenueSubsSum,
      usersCurr, usersPrev, businessesCurr, businessesPrev, employeesCurr, employeesPrev,
      ordersCurr, ordersPrev, cardsCurrSum, cardsPrevSum,
      revenueOrdersCurrSum, revenueOrdersPrevSum, revenueSubsCurrSum, revenueSubsPrevSum,
      usersLast7, businessesLast7, ordersLast7, cardItemsLast7, paymentsLast7, subsLast7,
      paymentsLast30, subsLast30,
      recentUsers, recentOrderRows, paidOrderItemRows,
      proUsers, paidBusinesses, orderStatusCounts, eventCounts,
    ] = await Promise.all([
      countRows('SELECT COUNT(*) as c FROM `User`', []),
      countRows('SELECT COUNT(*) as c FROM `Business`', []),
      countRows('SELECT COUNT(*) as c FROM `User` WHERE `accountType` = ?', ['employee']),
      countRows('SELECT COUNT(*) as c FROM `Order` WHERE `paymentStatus` = ?', ['paid']),
      sumRows('SELECT SUM(oi.`quantity`) as s FROM `OrderItem` oi JOIN `Order` o ON o.`id` = oi.`orderId` WHERE o.`paymentStatus` = ?', ['paid']),
      sumRows('SELECT SUM(`total`) as s FROM `Order` WHERE `paymentStatus` = ?', ['paid']),
      sumRows('SELECT SUM(`amount`) as s FROM `SubscriptionPayment` WHERE `status` = ?', ['success']),

      countRows('SELECT COUNT(*) as c FROM `User` WHERE `createdAt` >= ?', [new Date(d30)]),
      countRows('SELECT COUNT(*) as c FROM `User` WHERE `createdAt` >= ? AND `createdAt` < ?', [new Date(d60), new Date(d30)]),
      countRows('SELECT COUNT(*) as c FROM `Business` WHERE `createdAt` >= ?', [new Date(d30)]),
      countRows('SELECT COUNT(*) as c FROM `Business` WHERE `createdAt` >= ? AND `createdAt` < ?', [new Date(d60), new Date(d30)]),
      countRows('SELECT COUNT(*) as c FROM `User` WHERE `accountType` = ? AND `createdAt` >= ?', ['employee', new Date(d30)]),
      countRows('SELECT COUNT(*) as c FROM `User` WHERE `accountType` = ? AND `createdAt` >= ? AND `createdAt` < ?', ['employee', new Date(d60), new Date(d30)]),
      countRows('SELECT COUNT(*) as c FROM `Order` WHERE `paymentStatus` = ? AND `createdAt` >= ?', ['paid', new Date(d30)]),
      countRows('SELECT COUNT(*) as c FROM `Order` WHERE `paymentStatus` = ? AND `createdAt` >= ? AND `createdAt` < ?', ['paid', new Date(d60), new Date(d30)]),
      sumRows('SELECT SUM(oi.`quantity`) as s FROM `OrderItem` oi JOIN `Order` o ON o.`id` = oi.`orderId` WHERE o.`paymentStatus` = ? AND o.`createdAt` >= ?', ['paid', new Date(d30)]),
      sumRows('SELECT SUM(oi.`quantity`) as s FROM `OrderItem` oi JOIN `Order` o ON o.`id` = oi.`orderId` WHERE o.`paymentStatus` = ? AND o.`createdAt` >= ? AND o.`createdAt` < ?', ['paid', new Date(d60), new Date(d30)]),
      sumRows('SELECT SUM(`total`) as s FROM `Order` WHERE `paymentStatus` = ? AND `createdAt` >= ?', ['paid', new Date(d30)]),
      sumRows('SELECT SUM(`total`) as s FROM `Order` WHERE `paymentStatus` = ? AND `createdAt` >= ? AND `createdAt` < ?', ['paid', new Date(d60), new Date(d30)]),
      sumRows('SELECT SUM(`amount`) as s FROM `SubscriptionPayment` WHERE `status` = ? AND `createdAt` >= ?', ['success', new Date(d30)]),
      sumRows('SELECT SUM(`amount`) as s FROM `SubscriptionPayment` WHERE `status` = ? AND `createdAt` >= ? AND `createdAt` < ?', ['success', new Date(d60), new Date(d30)]),

      query<{ createdAt: Date; accountType: string }>('SELECT `createdAt`, `accountType` FROM `User` WHERE `createdAt` >= ?', [new Date(d7)]),
      query<{ createdAt: Date }>('SELECT `createdAt` FROM `Business` WHERE `createdAt` >= ?', [new Date(d7)]),
      query<{ createdAt: Date }>('SELECT `createdAt` FROM `Order` WHERE `paymentStatus` = ? AND `createdAt` >= ?', ['paid', new Date(d7)]),
      query<{ quantity: number; orderCreatedAt: Date }>(
        'SELECT oi.`quantity` as quantity, o.`createdAt` as orderCreatedAt FROM `OrderItem` oi JOIN `Order` o ON o.`id` = oi.`orderId` WHERE o.`paymentStatus` = ? AND o.`createdAt` >= ?',
        ['paid', new Date(d7)]
      ),
      query<{ amount: number; createdAt: Date }>('SELECT `amount`, `createdAt` FROM `Payment` WHERE `status` = ? AND `createdAt` >= ?', ['success', new Date(d7)]),
      query<{ amount: number; createdAt: Date }>('SELECT `amount`, `createdAt` FROM `SubscriptionPayment` WHERE `status` = ? AND `createdAt` >= ?', ['success', new Date(d7)]),

      query<{ amount: number; createdAt: Date }>('SELECT `amount`, `createdAt` FROM `Payment` WHERE `status` = ? AND `createdAt` >= ?', ['success', new Date(d30)]),
      query<{ amount: number; createdAt: Date }>('SELECT `amount`, `createdAt` FROM `SubscriptionPayment` WHERE `status` = ? AND `createdAt` >= ?', ['success', new Date(d30)]),

      query<User>('SELECT * FROM `User` ORDER BY `createdAt` DESC LIMIT 5', []),
      query<Order>('SELECT * FROM `Order` ORDER BY `createdAt` DESC LIMIT 5', []),
      query<OrderItem>('SELECT oi.* FROM `OrderItem` oi JOIN `Order` o ON o.`id` = oi.`orderId` WHERE o.`paymentStatus` = ?', ['paid']),

      query<{ planExpiresAt: Date | null }>('SELECT `planExpiresAt` FROM `User` WHERE `plan` != ?', ['free']),
      query<{ planExpiresAt: Date | null }>('SELECT `planExpiresAt` FROM `Business` WHERE `plan` != ?', ['free']),
      query<{ status: string; c: number }>('SELECT `status`, COUNT(*) as c FROM `Order` GROUP BY `status`', []),
      query<{ type: string; c: number }>('SELECT `type`, COUNT(*) as c FROM `AnalyticsEvent` GROUP BY `type`', []),
    ])

    // recentOrders/paidOrderItems need product names — batch-load separately
    const recentOrderIds = recentOrderRows.map((o) => o.id)
    const recentOrderItems = recentOrderIds.length
      ? await query<OrderItem & { productName: string }>(
          'SELECT oi.*, p.`name` as productName FROM `OrderItem` oi JOIN `Product` p ON p.`id` = oi.`productId` WHERE oi.`orderId` IN (?)',
          [recentOrderIds]
        )
      : []
    const productIds = [...new Set(paidOrderItemRows.map((i) => i.productId))]
    const products = productIds.length ? await query<Product>('SELECT * FROM `Product` WHERE `id` IN (?)', [productIds]) : []
    const productMapById = new Map(products.map((p) => [p.id, p]))
    const paidOrderItems = paidOrderItemRows.map((i) => ({ ...i, product: productMapById.get(i.productId) }))
    const recentOrders = recentOrderRows.map((o) => ({ ...o, items: recentOrderItems.filter((i) => i.orderId === o.id).map((i) => ({ quantity: i.quantity, product: { name: i.productName } })) }))

    const totalRevenue = revenueOrdersSum + revenueSubsSum
    const revenueCurr = revenueOrdersCurrSum + revenueSubsCurrSum
    const revenuePrev = revenueOrdersPrevSum + revenueSubsPrevSum

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
    for (const i of cardItemsLast7) { const key = dayKey(i.orderCreatedAt); if (key in cardBuckets) cardBuckets[key] += i.quantity }
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
      if (!item.product) continue
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
      const expiresAt = new Date(p.planExpiresAt)
      if (expiresAt <= new Date()) expired++
      else if (expiresAt <= d14Future) expiringSoon++
      else active++
    }

    const orderStatusOverview = { pending: 0, processing: 0, shipped: 0, delivered: 0 }
    for (const row of orderStatusCounts) {
      const group = ORDER_STATUS_GROUPS[row.status]
      if (group) orderStatusOverview[group] += Number(row.c)
    }

    const eventMap: Record<string, number> = {}
    for (const e of eventCounts) eventMap[e.type] = Number(e.c)
    const nfcTap = eventMap.NFC_TAP || 0
    const qrCode = eventMap.QR_SCAN || 0
    const website = Math.max((eventMap.PROFILE_VIEW || 0) - nfcTap - qrCode, 0)

    return NextResponse.json({
      stats: {
        users: { value: totalUsers, change: pctChange(usersCurr, usersPrev), series: days7.map(d => userBuckets[d]) },
        businesses: { value: totalBusinesses, change: pctChange(businessesCurr, businessesPrev), series: days7.map(d => businessBuckets[d]) },
        employees: { value: totalEmployees, change: pctChange(employeesCurr, employeesPrev), series: days7.map(d => employeeBuckets[d]) },
        orders: { value: totalOrdersPaid, change: pctChange(ordersCurr, ordersPrev), series: days7.map(d => orderBuckets[d]) },
        cardsSold: { value: cardsSoldSum, change: pctChange(cardsCurrSum, cardsPrevSum), series: days7.map(d => cardBuckets[d]) },
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
