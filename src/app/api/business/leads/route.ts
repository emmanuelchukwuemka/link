import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// Business admins can see leads submitted to any of their employees' profiles
// (per the spec's lead-privacy rule: owner + authorized business admins).
export async function GET() {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { ownerId: admin.id } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const employeeIds = (
    await prisma.user.findMany({ where: { businessId: business.id }, select: { id: true } })
  ).map((u) => u.id)

  const leads = await prisma.lead.findMany({
    where: { ownerId: { in: [...employeeIds, admin.id] } },
    include: { owner: { select: { username: true, displayName: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ leads })
}
