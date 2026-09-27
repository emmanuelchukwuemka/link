import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { ownerId: admin.id } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { code } = await params
  const { employeeId } = await req.json()

  const card = await prisma.card.findUnique({ where: { code } })
  if (!card || card.businessId !== business.id) {
    return NextResponse.json({ error: 'This card is not part of your business pool' }, { status: 404 })
  }

  if (employeeId) {
    const employee = await prisma.user.findUnique({ where: { id: employeeId } })
    if (!employee || employee.businessId !== business.id) {
      return NextResponse.json({ error: 'That employee is not on your team' }, { status: 400 })
    }
  }

  const updated = await prisma.card.update({
    where: { code },
    data: employeeId
      ? { userId: employeeId, status: 'active', assignedAt: new Date() }
      : { userId: null, status: 'unassigned', assignedAt: null },
  })

  return NextResponse.json({ card: updated })
}
