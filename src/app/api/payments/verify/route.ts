import { NextRequest, NextResponse } from 'next/server'
import { findOne, updateWhere, withTransaction } from '@/lib/db'
import { verifyTransaction } from '@/lib/paystack'
import { notify } from '@/lib/notify'
import type { Payment, Order } from '@/lib/types'

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
    const payment = await findOne<Payment>('Payment', { reference })

    if (!payment) {
      return NextResponse.redirect(new URL('/marketplace', req.url))
    }

    if (result.status === 'success') {
      const updatedOrder = await withTransaction(async (tx) => {
        await updateWhere('Payment', { reference }, { status: 'success', rawResponse: JSON.stringify(result) }, tx)
        await updateWhere('Order', { id: payment.orderId }, { paymentStatus: 'paid', status: 'profile_setup_required' }, tx)
        return findOne<Order>('Order', { id: payment.orderId }, tx)
      })
      if (updatedOrder?.userId) {
        await notify(updatedOrder.userId, {
          type: 'ORDER_PAID',
          title: 'Payment confirmed',
          message: `Your TapConnect order #${updatedOrder.orderNumber} has been paid for. Set up your profile to continue.`,
          link: `/orders/${updatedOrder.orderNumber}`,
        })
      }
    } else {
      await updateWhere('Payment', { reference }, { status: 'failed', rawResponse: JSON.stringify(result) })
      const failedOrder = await findOne<Order>('Order', { id: payment.orderId })
      if (failedOrder?.userId) {
        await notify(failedOrder.userId, {
          type: 'PAYMENT_FAILED',
          title: 'Payment failed',
          message: `We couldn't confirm payment for order #${failedOrder.orderNumber}. Please try again.`,
          link: `/orders/${failedOrder.orderNumber}`,
        })
      }
    }
  } catch (error) {
    console.error('Payment verification error:', error)
  }

  const paymentRow = await findOne<Payment>('Payment', { reference })
  const orderRow = paymentRow ? await findOne<Order>('Order', { id: paymentRow.orderId }) : null
  const orderNumber = orderRow?.orderNumber || reference

  return NextResponse.redirect(new URL(`/orders/${orderNumber}`, req.url))
}
