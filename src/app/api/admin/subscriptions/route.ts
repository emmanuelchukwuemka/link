import { NextResponse } from 'next/server'
import { findMany, query } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { User, Business, SubscriptionPayment } from '@/lib/types'

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [proUserRows, businessSubRows, paymentRows, successfulPayments, revenueRows] = await Promise.all([
    findMany<User>('User', { where: { plan: 'pro' }, orderBy: '`planExpiresAt` DESC' }),
    query<Business>('SELECT * FROM `Business` WHERE `plan` != ? ORDER BY `planExpiresAt` DESC', ['free']),
    findMany<SubscriptionPayment>('SubscriptionPayment', { orderBy: '`createdAt` DESC', limit: 100 }),
    findMany<SubscriptionPayment>('SubscriptionPayment', { where: { status: 'success' }, orderBy: '`createdAt` DESC' }),
    query<{ total: number }>('SELECT SUM(`amount`) as total FROM `SubscriptionPayment` WHERE `status` = ?', ['success']),
  ])

  const proUsers = proUserRows.map((u) => ({ id: u.id, username: u.username, displayName: u.displayName, email: u.email, planExpiresAt: u.planExpiresAt }))
  const businessSubs = businessSubRows.map((b) => ({ id: b.id, name: b.name, email: b.email, plan: b.plan, planExpiresAt: b.planExpiresAt }))

  const paymentUserIds = [...new Set(paymentRows.map((p) => p.userId).filter((v): v is string => !!v))]
  const paymentBusinessIds = [...new Set(paymentRows.map((p) => p.businessId).filter((v): v is string => !!v))]
  const [paymentUsers, paymentBusinesses] = await Promise.all([
    paymentUserIds.length ? findMany<User>('User', { where: { id: paymentUserIds } }) : Promise.resolve([]),
    paymentBusinessIds.length ? findMany<Business>('Business', { where: { id: paymentBusinessIds } }) : Promise.resolve([]),
  ])
  const paymentUserMap = new Map(paymentUsers.map((u) => [u.id, u]))
  const paymentBusinessMap = new Map(paymentBusinesses.map((b) => [b.id, b]))
  const payments = paymentRows.map((p) => ({
    ...p,
    user: p.userId && paymentUserMap.has(p.userId) ? { username: paymentUserMap.get(p.userId)!.username } : null,
    business: p.businessId && paymentBusinessMap.has(p.businessId) ? { name: paymentBusinessMap.get(p.businessId)!.name } : null,
  }))
  const revenueAgg = { _sum: { amount: Number(revenueRows[0]?.total ?? 0) } }

  // Most recent successful payment per user/business = when their current active period started.
  const latestStartByUser = new Map<string, Date>()
  const latestStartByBusiness = new Map<string, Date>()
  for (const p of successfulPayments) {
    if (p.userId && !latestStartByUser.has(p.userId)) latestStartByUser.set(p.userId, p.createdAt)
    if (p.businessId && !latestStartByBusiness.has(p.businessId)) latestStartByBusiness.set(p.businessId, p.createdAt)
  }

  const now = new Date()
  const withStatus = <T extends { id: string; planExpiresAt: Date | null }>(items: T[], starts: Map<string, Date>) =>
    items.map((i) => ({ ...i, active: !i.planExpiresAt || i.planExpiresAt > now, startDate: starts.get(i.id) || null }))

  return NextResponse.json({
    proUsers: withStatus(proUsers, latestStartByUser),
    businessSubs: withStatus(businessSubs, latestStartByBusiness),
    payments,
    totalRevenue: revenueAgg._sum.amount || 0,
  })
}
