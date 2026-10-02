import { NextResponse } from 'next/server'
import { findById, updateById, insert } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isPaystackConfigured } from '@/lib/paystack'
import { extendProExpiry, PRO_PLAN_PRICE_NAIRA } from '@/lib/subscription'
import { notify } from '@/lib/notify'
import type { User } from '@/lib/types'

// Dev-only stand-in for the Paystack subscription callback.
export async function POST() {
  if (isPaystackConfigured()) {
    return NextResponse.json({ error: 'Paystack is configured; use the real checkout flow' }, { status: 403 })
  }

  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const user = await findById<User>('User', authData.userId)
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await updateById<User>('User', authData.userId, { plan: 'pro', planExpiresAt: extendProExpiry(user.planExpiresAt) })

  await insert('SubscriptionPayment', { userId: authData.userId, plan: 'pro', amount: PRO_PLAN_PRICE_NAIRA, reference: `SIM-${Date.now()}`, status: 'success', rawResponse: JSON.stringify({ simulated: true }) })

  await notify(authData.userId, {
    type: 'SUBSCRIPTION_ACTIVATED',
    title: 'You are now on Pro',
    message: 'Your TapConnect Pro subscription is active. Enjoy the extra customization, analytics and lead capture.',
    link: '/dashboard/subscription',
  })

  return NextResponse.json({ user: updated })
}
