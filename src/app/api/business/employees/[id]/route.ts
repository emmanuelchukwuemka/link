import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { ownerId: admin.id } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { id } = await params
  const employee = await prisma.user.findUnique({ where: { id } })
  if (!employee || employee.businessId !== business.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { displayName, jobTitle, department } = await req.json()
  const updated = await prisma.user.update({
    where: { id },
    data: { displayName, jobTitle, department },
    select: { id: true, username: true, displayName: true, jobTitle: true, department: true },
  })

  return NextResponse.json({ employee: updated })
}

// Removes the employee from the business (their personal profile is kept intact).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const business = await prisma.business.findUnique({ where: { ownerId: admin.id } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const { id } = await params
  const employee = await prisma.user.findUnique({ where: { id } })
  if (!employee || employee.businessId !== business.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { businessId: null, accountType: 'individual' } }),
    prisma.card.updateMany({ where: { userId: id, businessId: business.id }, data: { userId: null, status: 'unassigned', assignedAt: null } }),
  ])

  return NextResponse.json({ success: true })
}
