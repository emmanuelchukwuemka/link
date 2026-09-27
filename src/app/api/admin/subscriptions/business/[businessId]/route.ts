import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { BUSINESS_PLANS, BusinessPlanName } from '@/lib/subscription'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { businessId } = await params
  const { plan, planExpiresAt } = await req.json()

  if (!Object.keys(BUSINESS_PLANS).includes(plan)) {
    return NextResponse.json({ error: 'Invalid business plan' }, { status: 400 })
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: { plan: plan as BusinessPlanName, planExpiresAt: plan === 'free' ? null : planExpiresAt ? new Date(planExpiresAt) : null },
    select: { id: true, name: true, email: true, plan: true, planExpiresAt: true },
  })

  return NextResponse.json({ business: updated })
}
