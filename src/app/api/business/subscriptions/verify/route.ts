import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTransaction } from '@/lib/paystack'
import { extendProExpiry } from '@/lib/subscription'
import { notify } from '@/lib/notify'

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference') || req.nextUrl.searchParams.get('trxref')
  const dashboardUrl = new URL('/dashboard/business', req.url)

  if (!reference) return NextResponse.redirect(dashboardUrl)

  const pending = await prisma.subscriptionPayment.findUnique({ where: { reference } })
  if (!pending || !pending.businessId) return NextResponse.redirect(dashboardUrl)

  try {
    const result = await verifyTransaction(reference)
    if (result.status === 'success') {
      const business = await prisma.business.findUnique({ where: { id: pending.businessId } })
      if (business) {
        await prisma.business.update({
          where: { id: business.id },
          data: { plan: pending.plan, planExpiresAt: extendProExpiry(business.planExpiresAt) },
        })
        await prisma.subscriptionPayment.update({
          where: { reference },
          data: { status: 'success', rawResponse: JSON.stringify(result) },
        })
        await notify(business.ownerId, {
          type: 'SUBSCRIPTION_ACTIVATED',
          title: 'Business plan upgraded',
          message: `Your business is now on the ${pending.plan} plan.`,
          link: '/dashboard/business',
        })
        dashboardUrl.searchParams.set('upgraded', '1')
      }
    } else {
      await prisma.subscriptionPayment.update({
        where: { reference },
        data: { status: 'failed', rawResponse: JSON.stringify(result) },
      })
      dashboardUrl.searchParams.set('failed', '1')
    }
  } catch (error) {
    console.error('Business subscription verify error:', error)
    dashboardUrl.searchParams.set('failed', '1')
  }

  return NextResponse.redirect(dashboardUrl)
}
