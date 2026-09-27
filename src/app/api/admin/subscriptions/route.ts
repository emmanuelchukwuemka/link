import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [proUsers, businessSubs, payments, successfulPayments, revenueAgg] = await Promise.all([
    prisma.user.findMany({
      where: { plan: 'pro' },
      select: { id: true, username: true, displayName: true, email: true, planExpiresAt: true },
      orderBy: { planExpiresAt: 'desc' },
    }),
    prisma.business.findMany({
      where: { plan: { not: 'free' } },
      select: { id: true, name: true, email: true, plan: true, planExpiresAt: true },
      orderBy: { planExpiresAt: 'desc' },
    }),
    prisma.subscriptionPayment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { username: true } },
        business: { select: { name: true } },
      },
    }),
    prisma.subscriptionPayment.findMany({
      where: { status: 'success' },
      orderBy: { createdAt: 'desc' },
      select: { userId: true, businessId: true, createdAt: true },
    }),
    prisma.subscriptionPayment.aggregate({ _sum: { amount: true }, where: { status: 'success' } }),
  ])

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
