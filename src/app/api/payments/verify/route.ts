import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTransaction } from '@/lib/paystack'
import { notify } from '@/lib/notify'

// Paystack redirects the browser here after checkout. The frontend result is
// never trusted — payment success is only recorded once verified server-side
// against Paystack's API directly.
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference') || req.nextUrl.searchParams.get('trxref')

  if (!reference) {
    return NextResponse.redirect(new URL('/marketplace', req.url))
  }

  try {
    const result = await verifyTransaction(reference)
    const payment = await prisma.payment.findUnique({ where: { reference } })

    if (!payment) {
      return NextResponse.redirect(new URL('/marketplace', req.url))
    }

    if (result.status === 'success') {
      const [, updatedOrder] = await prisma.$transaction([
        prisma.payment.update({
          where: { reference },
          data: { status: 'success', rawResponse: JSON.stringify(result) },
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: 'paid', status: 'profile_setup_required' },
        }),
      ])
      if (updatedOrder.userId) {
        await notify(updatedOrder.userId, {
          type: 'ORDER_PAID',
          title: 'Payment confirmed',
          message: `Your TapConnect order #${updatedOrder.orderNumber} has been paid for. Set up your profile to continue.`,
          link: `/orders/${updatedOrder.orderNumber}`,
        })
      }
    } else {
      const failedPayment = await prisma.payment.update({
        where: { reference },
        data: { status: 'failed', rawResponse: JSON.stringify(result) },
        include: { order: true },
      })
      if (failedPayment.order.userId) {
        await notify(failedPayment.order.userId, {
          type: 'PAYMENT_FAILED',
          title: 'Payment failed',
          message: `We couldn't confirm payment for order #${failedPayment.order.orderNumber}. Please try again.`,
          link: `/orders/${failedPayment.order.orderNumber}`,
        })
      }
    }
  } catch (error) {
    console.error('Payment verification error:', error)
  }

  const order = await prisma.payment.findUnique({ where: { reference }, include: { order: true } })
  const orderNumber = order?.order.orderNumber || reference

  return NextResponse.redirect(new URL(`/orders/${orderNumber}`, req.url))
}
