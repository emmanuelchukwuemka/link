import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { BUSINESS_PLANS, BusinessPlanName } from '@/lib/subscription'

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function eachDay(from: Date, to: Date): string[] {
  const days: string[] = []
  const d = new Date(from)
  while (d <= to) { days.push(dayKey(d)); d.setDate(d.getDate() + 1) }
  return days
}

const SOURCE_COLORS: Record<string, string> = {
  Website: '#3b82f6', Referral: '#16a34a', 'Social Media': '#ec4899', Advertisement: '#a855f7', Other: '#6b7280',
}

export async function GET(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const fromParam = req.nextUrl.searchParams.get('from')
  const toParam = req.nextUrl.searchParams.get('to')
  // Bucketing below (dayKey) always slices the UTC calendar day, so range
  // boundaries must be parsed as UTC too — otherwise a non-UTC server
  // timezone silently drifts the range by a day relative to the buckets.
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
  const from = fromParam ? new Date(`${fromParam}T00:00:00.000Z`) : defaultFrom
  const to = toParam ? new Date(`${toParam}T23:59:59.999Z`) : defaultTo

  const periodMs = to.getTime() - from.getTime()
  const priorFrom = new Date(from.getTime() - periodMs - 1)
  const priorTo = new Date(from.getTime() - 1)

  const [
    totalUsers, businessUsersCount, totalLeads,
    newUsersThisPeriod, newUsersPriorPeriod,
    newBusinessUsersThisPeriod, newBusinessUsersPriorPeriod,
    newLeadsThisPeriod, newLeadsPriorPeriod,
    newSubsThisPeriod, newSubsPriorPeriod,
    proUsers, paidBusinesses,
    usersInRange, leadsInRange, paymentsInRange, subPaymentsInRange,
    leadSourcesInRange, usersBeforeRange,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { accountType: { in: ['business_admin', 'employee'] } } }),
    prisma.lead.count(),
    prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.user.count({ where: { createdAt: { gte: priorFrom, lte: priorTo } } }),
    prisma.user.count({ where: { accountType: { in: ['business_admin', 'employee'] }, createdAt: { gte: from, lte: to } } }),
    prisma.user.count({ where: { accountType: { in: ['business_admin', 'employee'] }, createdAt: { gte: priorFrom, lte: priorTo } } }),
    prisma.lead.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.lead.count({ where: { createdAt: { gte: priorFrom, lte: priorTo } } }),
    prisma.subscriptionPayment.count({ where: { status: 'success', createdAt: { gte: from, lte: to } } }),
    prisma.subscriptionPayment.count({ where: { status: 'success', createdAt: { gte: priorFrom, lte: priorTo } } }),
    prisma.user.findMany({ where: { plan: { not: 'free' } }, select: { planExpiresAt: true } }),
    prisma.business.findMany({ where: { plan: { not: 'free' } }, select: { plan: true, planExpiresAt: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { createdAt: true, accountType: true } }),
    prisma.lead.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { createdAt: true } }),
    prisma.payment.findMany({ where: { status: 'success', createdAt: { gte: from, lte: to } }, select: { amount: true, createdAt: true } }),
    prisma.subscriptionPayment.findMany({ where: { status: 'success', createdAt: { gte: from, lte: to } }, select: { amount: true, createdAt: true } }),
    prisma.lead.groupBy({ by: ['source'], where: { createdAt: { gte: from, lte: to } }, _count: { source: true } }),
    prisma.user.count({ where: { createdAt: { lt: from } } }),
  ])

  const activeIndividualPro = proUsers.filter((u) => !u.planExpiresAt || u.planExpiresAt > now).length
  const activeBusinesses = paidBusinesses.filter((b) => !b.planExpiresAt || b.planExpiresAt > now)
  const activeSubscriptions = activeIndividualPro + activeBusinesses.length

  const days = eachDay(from, to)
  const emptyBuckets = () => Object.fromEntries(days.map((d) => [d, 0])) as Record<string, number>

  const newUsersBuckets = emptyBuckets()
  const individualsBuckets = emptyBuckets()
  const businessesBuckets = emptyBuckets()
  const employeesBuckets = emptyBuckets()
  for (const u of usersInRange) {
    const key = dayKey(u.createdAt)
    if (!(key in newUsersBuckets)) continue
    newUsersBuckets[key]++
    if (u.accountType === 'individual') individualsBuckets[key]++
    else if (u.accountType === 'business_admin') businessesBuckets[key]++
    else if (u.accountType === 'employee') employeesBuckets[key]++
  }

  const leadsBuckets = emptyBuckets()
  for (const l of leadsInRange) { const key = dayKey(l.createdAt); if (key in leadsBuckets) leadsBuckets[key]++ }

  const subsBuckets = emptyBuckets()
  for (const s of subPaymentsInRange) { const key = dayKey(s.createdAt); if (key in subsBuckets) subsBuckets[key]++ }

  const revenueBuckets = emptyBuckets()
  let productSalesTotal = 0
  let subscriptionRevenueTotal = 0
  for (const p of paymentsInRange) { const key = dayKey(p.createdAt); if (key in revenueBuckets) revenueBuckets[key] += p.amount; productSalesTotal += p.amount }
  for (const s of subPaymentsInRange) { const key = dayKey(s.createdAt); if (key in revenueBuckets) revenueBuckets[key] += s.amount; subscriptionRevenueTotal += s.amount }

  let cumulative = usersBeforeRange
  const cumulativeUsersSeries = days.map((d) => { cumulative += newUsersBuckets[d]; return cumulative })

  const topLeadSources = leadSourcesInRange
    .map((row) => ({ label: row.source, value: row._count.source, color: SOURCE_COLORS[row.source] || '#6b7280' }))
    .sort((a, b) => b.value - a.value)

  const subscriptionPlans = [
    { label: 'Individual Pro', value: activeIndividualPro },
    ...(Object.keys(BUSINESS_PLANS) as BusinessPlanName[])
      .filter((p) => p !== 'free')
      .map((p) => ({ label: BUSINESS_PLANS[p].label, value: activeBusinesses.filter((b) => b.plan === p).length })),
  ].filter((p) => p.value > 0)

  return NextResponse.json({
    range: { from: from.toISOString(), to: to.toISOString() },
    stats: {
      totalUsers: { value: totalUsers, change: pctChange(newUsersThisPeriod, newUsersPriorPeriod), newThisPeriod: newUsersThisPeriod },
      businessUsers: { value: businessUsersCount, change: pctChange(newBusinessUsersThisPeriod, newBusinessUsersPriorPeriod), newThisPeriod: newBusinessUsersThisPeriod },
      activeSubscriptions: { value: activeSubscriptions, change: pctChange(newSubsThisPeriod, newSubsPriorPeriod), newThisPeriod: newSubsThisPeriod },
      totalLeads: { value: totalLeads, change: pctChange(newLeadsThisPeriod, newLeadsPriorPeriod), newThisPeriod: newLeadsThisPeriod },
    },
    dates: days,
    newUsersSeries: days.map((d) => newUsersBuckets[d]),
    leadsSeries: days.map((d) => leadsBuckets[d]),
    subscriptionsSeries: days.map((d) => subsBuckets[d]),
    revenueSeries: days.map((d) => revenueBuckets[d]),
    topLeadSources,
    subscriptionPlans,
    revenueBreakdown: { productSales: productSalesTotal, subscriptions: subscriptionRevenueTotal, total: productSalesTotal + subscriptionRevenueTotal },
    growth: {
      individuals: days.map((d) => individualsBuckets[d]),
      businesses: days.map((d) => businessesBuckets[d]),
      employees: days.map((d) => employeesBuckets[d]),
      cumulativeTotal: cumulativeUsersSeries,
    },
  })
}
