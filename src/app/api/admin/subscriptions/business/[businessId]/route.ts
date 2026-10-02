import { NextRequest, NextResponse } from 'next/server'
import { findById, updateById } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { BUSINESS_PLANS, BusinessPlanName } from '@/lib/subscription'
import type { Business } from '@/lib/types'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { businessId } = await params
  const { plan, planExpiresAt } = await req.json()

  if (!Object.keys(BUSINESS_PLANS).includes(plan)) {
    return NextResponse.json({ error: 'Invalid business plan' }, { status: 400 })
  }

  const business = await findById<Business>('Business', businessId)
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const updatedRow = await updateById<Business>('Business', businessId, {
    plan: plan as BusinessPlanName,
    planExpiresAt: plan === 'free' ? null : planExpiresAt ? new Date(planExpiresAt) : null,
  })
  const updated = updatedRow && { id: updatedRow.id, name: updatedRow.name, email: updatedRow.email, plan: updatedRow.plan, planExpiresAt: updatedRow.planExpiresAt }

  return NextResponse.json({ business: updated })
}
