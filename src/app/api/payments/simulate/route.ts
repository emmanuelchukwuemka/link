import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isPaystackConfigured } from '@/lib/paystack'
import { notify } from '@/lib/notify'

// Dev-only stand-in for the Paystack callback, used while PAYSTACK_SECRET_KEY
// is unset so the checkout -> profile-setup -> order pipeline stays testable.
// Refuses to run once real Paystack keys are configured.
export async function POST(req: NextRequest) {
  if (isPaystackConfigured()) {
    return NextResponse.json({ error: 'Paystack is configured; use the real checkout flow' }, { status: 403 })
  }

  const { orderNumber } = await req.json()
  const order = await prisma.order.findUnique({ where: { orderNumber } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.payment.update({
      where: { reference: orderNumber },
      data: { status: 'success', rawResponse: JSON.stringify({ simulated: true }) },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'paid', status: 'profile_setup_required' },
    }),
  ])

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
