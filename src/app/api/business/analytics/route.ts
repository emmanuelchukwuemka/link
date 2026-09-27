import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET() {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { ownerId: admin.id } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const employees = await prisma.user.findMany({
    where: { businessId: business.id },
    select: { id: true, username: true, displayName: true, jobTitle: true },
  })
  const employeeIds = employees.map((e) => e.id)

  if (employeeIds.length === 0) {
    return NextResponse.json({ employees: [], totals: { views: 0, nfcTaps: 0, qrScans: 0, leads: 0 } })
  }

  const events = await prisma.analyticsEvent.groupBy({
    by: ['userId', 'type'],
    where: { userId: { in: employeeIds } },
    _count: { type: true },
  })

  const leads = await prisma.lead.groupBy({
    by: ['ownerId'],
    where: { ownerId: { in: employeeIds } },
    _count: { ownerId: true },
  })
  const leadMap = new Map(leads.map((l) => [l.ownerId, l._count.ownerId]))

  const perEmployee = employees.map((emp) => {
    const empEvents = events.filter((e) => e.userId === emp.id)
    const get = (type: string) => empEvents.find((e) => e.type === type)?._count.type || 0
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
