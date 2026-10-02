import { NextRequest, NextResponse } from 'next/server'
import { findById } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { initializeTransaction, isPaystackConfigured } from '@/lib/paystack'
import { PRO_PLAN_PRICE_NAIRA } from '@/lib/subscription'
import type { User } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await findById<User>('User', authData.userId)
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!isPaystackConfigured()) {
      return NextResponse.json({ devMode: true })
    }

    const reference = `SUB-${user.id}-${Date.now()}`
    const origin = req.nextUrl.origin
    const tx = await initializeTransaction({
      email: user.email,
      amountNaira: PRO_PLAN_PRICE_NAIRA,
      reference,
      callbackUrl: `${origin}/api/subscriptions/verify`,
    })

    return NextResponse.json({ authorizationUrl: tx.authorization_url })
  } catch (error) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
