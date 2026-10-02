import { NextRequest, NextResponse } from 'next/server'
import { findOne, insert } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { initializeTransaction, isPaystackConfigured } from '@/lib/paystack'
import { BUSINESS_PLANS, BusinessPlanName } from '@/lib/subscription'
import type { Business } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole('business_admin')
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const business = await findOne<Business>('Business', { ownerId: admin.id })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const { plan } = await req.json()
    const planConfig = BUSINESS_PLANS[plan as BusinessPlanName]
    if (!planConfig || planConfig.priceNaira === null) {
      return NextResponse.json({ error: 'Invalid plan. Contact sales for Enterprise.' }, { status: 400 })
    }

    const reference = `BIZSUB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    if (!isPaystackConfigured()) {
      // Still record the pending intent so the dev-mode simulate route has
      // something to look up and confirm, exactly like the real flow would.
      await insert('SubscriptionPayment', { businessId: business.id, plan, amount: planConfig.priceNaira, reference, status: 'pending' })
      return NextResponse.json({ devMode: true, reference })
    }

    const origin = req.nextUrl.origin
    const tx = await initializeTransaction({
      email: admin.email,
      amountNaira: planConfig.priceNaira,
      reference,
      callbackUrl: `${origin}/api/business/subscriptions/verify`,
    })

    await insert('SubscriptionPayment', { businessId: business.id, plan, amount: planConfig.priceNaira, reference, status: 'pending' })

    return NextResponse.json({ authorizationUrl: tx.authorization_url })
  } catch (error) {
    console.error('Business subscription checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
