import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTransaction } from '@/lib/paystack'
import { extendProExpiry, PRO_PLAN_PRICE_NAIRA } from '@/lib/subscription'
import { notify } from '@/lib/notify'

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference') || req.nextUrl.searchParams.get('trxref')
  const dashboardUrl = new URL('/dashboard/subscription', req.url)

  if (!reference || !reference.startsWith('SUB-')) {
    return NextResponse.redirect(dashboardUrl)
  }

  const userId = reference.split('-')[1]

  try {
    const result = await verifyTransaction(reference)
    if (result.status === 'success') {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user) {
        await prisma.user.update({
          where: { id: userId },
          data: { plan: 'pro', planExpiresAt: extendProExpiry(user.planExpiresAt) },
        })
        await prisma.subscriptionPayment.create({
          data: { userId, plan: 'pro', amount: PRO_PLAN_PRICE_NAIRA, reference, status: 'success', rawResponse: JSON.stringify(result) },
        }).catch(() => {})
        await notify(userId, {
          type: 'SUBSCRIPTION_ACTIVATED',
          title: 'You are now on Pro',
          message: 'Your TapConnect Pro subscription is active. Enjoy the extra customization, analytics and lead capture.',
          link: '/dashboard/subscription',
        })
        dashboardUrl.searchParams.set('upgraded', '1')
      }
    } else {
      await notify(userId, {
        type: 'PAYMENT_FAILED',
        title: 'Payment failed',
        message: 'We could not confirm your Pro subscription payment. Please try again.',
        link: '/dashboard/subscription',
      })
      dashboardUrl.searchParams.set('failed', '1')
    }
  } catch (error) {
    console.error('Subscription verify error:', error)
    dashboardUrl.searchParams.set('failed', '1')
  }

  return NextResponse.redirect(dashboardUrl)
}
