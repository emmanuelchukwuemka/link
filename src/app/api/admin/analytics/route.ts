import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { BUSINESS_PLANS, BusinessPlanName } from '@/lib/subscription'

async function countRows(sql: string, params: unknown[]): Promise<number> {
  const rows = await query<{ c: number }>(sql, params)
  return Number(rows[0]?.c ?? 0)
}

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

  const bizTypes = ['business_admin', 'employee']
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
    countRows('SELECT COUNT(*) as c FROM `User`', []),
    countRows('SELECT COUNT(*) as c FROM `User` WHERE `accountType` IN (?)', [bizTypes]),
    countRows('SELECT COUNT(*) as c FROM `Lead`', []),
    countRows('SELECT COUNT(*) as c FROM `User` WHERE `createdAt` >= ? AND `createdAt` <= ?', [from, to]),
    countRows('SELECT COUNT(*) as c FROM `User` WHERE `createdAt` >= ? AND `createdAt` <= ?', [priorFrom, priorTo]),
    countRows('SELECT COUNT(*) as c FROM `User` WHERE `accountType` IN (?) AND `createdAt` >= ? AND `createdAt` <= ?', [bizTypes, from, to]),
    countRows('SELECT COUNT(*) as c FROM `User` WHERE `accountType` IN (?) AND `createdAt` >= ? AND `createdAt` <= ?', [bizTypes, priorFrom, priorTo]),
    countRows('SELECT COUNT(*) as c FROM `Lead` WHERE `createdAt` >= ? AND `createdAt` <= ?', [from, to]),
    countRows('SELECT COUNT(*) as c FROM `Lead` WHERE `createdAt` >= ? AND `createdAt` <= ?', [priorFrom, priorTo]),
    countRows('SELECT COUNT(*) as c FROM `SubscriptionPayment` WHERE `status` = ? AND `createdAt` >= ? AND `createdAt` <= ?', ['success', from, to]),
    countRows('SELECT COUNT(*) as c FROM `SubscriptionPayment` WHERE `status` = ? AND `createdAt` >= ? AND `createdAt` <= ?', ['success', priorFrom, priorTo]),
    query<{ planExpiresAt: Date | null }>('SELECT `planExpiresAt` FROM `User` WHERE `plan` != ?', ['free']),
    query<{ plan: string; planExpiresAt: Date | null }>('SELECT `plan`, `planExpiresAt` FROM `Business` WHERE `plan` != ?', ['free']),
    query<{ createdAt: Date; accountType: string }>('SELECT `createdAt`, `accountType` FROM `User` WHERE `createdAt` >= ? AND `createdAt` <= ?', [from, to]),
    query<{ createdAt: Date }>('SELECT `createdAt` FROM `Lead` WHERE `createdAt` >= ? AND `createdAt` <= ?', [from, to]),
    query<{ amount: number; createdAt: Date }>('SELECT `amount`, `createdAt` FROM `Payment` WHERE `status` = ? AND `createdAt` >= ? AND `createdAt` <= ?', ['success', from, to]),
    query<{ amount: number; createdAt: Date }>('SELECT `amount`, `createdAt` FROM `SubscriptionPayment` WHERE `status` = ? AND `createdAt` >= ? AND `createdAt` <= ?', ['success', from, to]),
    query<{ source: string; c: number }>('SELECT `source`, COUNT(*) as c FROM `Lead` WHERE `createdAt` >= ? AND `createdAt` <= ? GROUP BY `source`', [from, to]),
    countRows('SELECT COUNT(*) as c FROM `User` WHERE `createdAt` < ?', [from]),
  ])

  const activeIndividualPro = proUsers.filter((u) => !u.planExpiresAt || new Date(u.planExpiresAt) > now).length
  const activeBusinesses = paidBusinesses.filter((b) => !b.planExpiresAt || new Date(b.planExpiresAt) > now)
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
    .map((row) => ({ label: row.source, value: Number(row.c), color: SOURCE_COLORS[row.source] || '#6b7280' }))
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
