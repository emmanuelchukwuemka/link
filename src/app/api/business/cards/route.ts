import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET() {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { ownerId: admin.id } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const employees = await prisma.user.findMany({ where: { businessId: business.id }, select: { id: true } })
  const employeeIds = employees.map((u) => u.id)

  const cards = await prisma.card.findMany({
    where: {
      OR: [
        { businessId: business.id },
        { userId: { in: employeeIds } },
      ],
    },
    include: { user: { select: { id: true, username: true, displayName: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ cards })
}
