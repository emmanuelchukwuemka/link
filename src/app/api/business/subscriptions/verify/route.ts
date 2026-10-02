import { NextRequest, NextResponse } from 'next/server'
import { findOne, updateWhere } from '@/lib/db'
import { verifyTransaction } from '@/lib/paystack'
import { extendProExpiry } from '@/lib/subscription'
import { notify } from '@/lib/notify'
import type { SubscriptionPayment, Business } from '@/lib/types'

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference') || req.nextUrl.searchParams.get('trxref')
  const dashboardUrl = new URL('/dashboard/business', req.url)

  if (!reference) return NextResponse.redirect(dashboardUrl)

  const pending = await findOne<SubscriptionPayment>('SubscriptionPayment', { reference })
  if (!pending || !pending.businessId) return NextResponse.redirect(dashboardUrl)

  try {
    const result = await verifyTransaction(reference)
    if (result.status === 'success') {
      const business = await findOne<Business>('Business', { id: pending.businessId })
      if (business) {
        await updateWhere('Business', { id: business.id }, { plan: pending.plan, planExpiresAt: extendProExpiry(business.planExpiresAt) })
        await updateWhere('SubscriptionPayment', { reference }, { status: 'success', rawResponse: JSON.stringify(result) })
        await notify(business.ownerId, {
          type: 'SUBSCRIPTION_ACTIVATED',
          title: 'Business plan upgraded',
          message: `Your business is now on the ${pending.plan} plan.`,
          link: '/dashboard/business',
        })
        dashboardUrl.searchParams.set('upgraded', '1')
      }
    } else {
      await updateWhere('SubscriptionPayment', { reference }, { status: 'failed', rawResponse: JSON.stringify(result) })
      dashboardUrl.searchParams.set('failed', '1')
    }
  } catch (error) {
    console.error('Business subscription verify error:', error)
    dashboardUrl.searchParams.set('failed', '1')
  }

  return NextResponse.redirect(dashboardUrl)
}
