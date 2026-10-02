import { NextResponse } from 'next/server'
import { findOne, findMany, query } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Business, User } from '@/lib/types'

export async function GET() {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await findOne<Business>('Business', { ownerId: admin.id })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const employees = await findMany<User>('User', { where: { businessId: business.id } })
  const employeeIds = employees.map((e) => e.id)

  if (employeeIds.length === 0) {
    return NextResponse.json({ employees: [], totals: { views: 0, nfcTaps: 0, qrScans: 0, leads: 0 } })
  }

  const events = await query<{ userId: string; type: string; c: number }>(
    'SELECT `userId`, `type`, COUNT(*) as c FROM `AnalyticsEvent` WHERE `userId` IN (?) GROUP BY `userId`, `type`',
    [employeeIds]
  )

  const leadRows = await query<{ ownerId: string; c: number }>(
    'SELECT `ownerId`, COUNT(*) as c FROM `Lead` WHERE `ownerId` IN (?) GROUP BY `ownerId`',
    [employeeIds]
  )
  const leadMap = new Map(leadRows.map((l) => [l.ownerId, Number(l.c)]))

  const perEmployee = employees.map((emp) => {
    const empEvents = events.filter((e) => e.userId === emp.id)
    const get = (type: string) => Number(empEvents.find((e) => e.type === type)?.c || 0)
    return {
      ...emp,
      views: get('PROFILE_VIEW'),
      nfcTaps: get('NFC_TAP'),
      qrScans: get('QR_SCAN'),
      leads: leadMap.get(emp.id) || 0,
    }
  })

  const totals = perEmployee.reduce(
    (acc, e) => ({
      views: acc.views + e.views,
      nfcTaps: acc.nfcTaps + e.nfcTaps,
      qrScans: acc.qrScans + e.qrScans,
      leads: acc.leads + e.leads,
    }),
    { views: 0, nfcTaps: 0, qrScans: 0, leads: 0 }
  )

  return NextResponse.json({ employees: perEmployee, totals })
}
