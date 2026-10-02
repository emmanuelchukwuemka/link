import { NextRequest, NextResponse } from 'next/server'
import { findOne, updateWhere } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { isPaystackConfigured } from '@/lib/paystack'
import { extendProExpiry } from '@/lib/subscription'
import { notify } from '@/lib/notify'
import type { SubscriptionPayment, Business } from '@/lib/types'

export async function POST(req: NextRequest) {
  if (isPaystackConfigured()) {
    return NextResponse.json({ error: 'Paystack is configured; use the real checkout flow' }, { status: 403 })
  }

  const admin = await requireRole('business_admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { reference } = await req.json()
  const pending = await findOne<SubscriptionPayment>('SubscriptionPayment', { reference })
  if (!pending || !pending.businessId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const business = await findOne<Business>('Business', { id: pending.businessId })
  if (!business || business.ownerId !== admin.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await updateWhere('Business', { id: business.id }, { plan: pending.plan, planExpiresAt: extendProExpiry(business.planExpiresAt) })
  await updateWhere('SubscriptionPayment', { reference }, { status: 'success', rawResponse: JSON.stringify({ simulated: true }) })

  await notify(admin.id, {
    type: 'SUBSCRIPTION_ACTIVATED',
    title: 'Business plan upgraded',
    message: `Your business is now on the ${pending.plan} plan.`,
    link: '/dashboard/business',
  })

  return NextResponse.json({ ok: true })
}
