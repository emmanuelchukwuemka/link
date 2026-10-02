import { NextRequest, NextResponse } from 'next/server'
import { findOne, updateWhere, withTransaction } from '@/lib/db'
import { isPaystackConfigured } from '@/lib/paystack'
import { notify } from '@/lib/notify'
import type { Order } from '@/lib/types'

// Dev-only stand-in for the Paystack callback, used while PAYSTACK_SECRET_KEY
// is unset so the checkout -> profile-setup -> order pipeline stays testable.
// Refuses to run once real Paystack keys are configured.
export async function POST(req: NextRequest) {
  if (isPaystackConfigured()) {
    return NextResponse.json({ error: 'Paystack is configured; use the real checkout flow' }, { status: 403 })
  }

  const { orderNumber } = await req.json()
  const order = await findOne<Order>('Order', { orderNumber })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  await withTransaction(async (tx) => {
    await updateWhere('Payment', { reference: orderNumber }, { status: 'success', rawResponse: JSON.stringify({ simulated: true }) }, tx)
    await updateWhere('Order', { id: order.id }, { paymentStatus: 'paid', status: 'profile_setup_required' }, tx)
  })

  if (order.userId) {
    await notify(order.userId, {
      type: 'ORDER_PAID',
      title: 'Payment confirmed',
      message: `Your TapConnect order #${order.orderNumber} has been paid for. Set up your profile to continue.`,
      link: `/orders/${order.orderNumber}`,
    })
  }

  return NextResponse.json({ ok: true })
}
