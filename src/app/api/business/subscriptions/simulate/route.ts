import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { isPaystackConfigured } from '@/lib/paystack'
import { extendProExpiry } from '@/lib/subscription'
import { notify } from '@/lib/notify'

export async function POST(req: NextRequest) {
  if (isPaystackConfigured()) {
    return NextResponse.json({ error: 'Paystack is configured; use the real checkout flow' }, { status: 403 })
  }

  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { reference } = await req.json()
  const pending = await prisma.subscriptionPayment.findUnique({ where: { reference } })
  if (!pending || !pending.businessId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const business = await prisma.business.findUnique({ where: { id: pending.businessId } })
  if (!business || business.ownerId !== admin.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.business.update({
    where: { id: business.id },
    data: { plan: pending.plan, planExpiresAt: extendProExpiry(business.planExpiresAt) },
  })
  await prisma.subscriptionPayment.update({
    where: { reference },
    data: { status: 'success', rawResponse: JSON.stringify({ simulated: true }) },
  })

  await notify(admin.id, {
    type: 'SUBSCRIPTION_ACTIVATED',
    title: 'Business plan upgraded',
    message: `Your business is now on the ${pending.plan} plan.`,
    link: '/dashboard/business',
  })

  return NextResponse.json({ ok: true })
}
