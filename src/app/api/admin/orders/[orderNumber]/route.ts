import { NextRequest, NextResponse } from 'next/server'
import { findOne, updateWhere } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { notify } from '@/lib/notify'
import type { Order } from '@/lib/types'

const VALID_STATUSES = [
  'order_placed', 'payment_confirmed', 'profile_setup_required', 'profile_completed',
  'preparing', 'in_production', 'quality_check', 'shipped', 'out_for_delivery', 'delivered', 'activated',
]

// Statuses that mean the physical card has moved into production/fulfillment.
// The spec is explicit that a card cannot enter production before the profile
// is set up, so this is enforced here — not just nudged in the UI.
const PRODUCTION_STATUSES = new Set([
  'preparing', 'in_production', 'quality_check', 'shipped', 'out_for_delivery', 'delivered', 'activated',
])

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { orderNumber } = await params
  const { status, courierName, trackingNumber } = await req.json()

  const existing = await findOne<Order>('Order', { orderNumber })
  if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    if (PRODUCTION_STATUSES.has(status) && existing.profileSetupRequired) {
      return NextResponse.json(
        { error: 'This order cannot move into production until the customer completes their profile setup.' },
        { status: 409 }
      )
    }
    data.status = status
    if (status === 'shipped') data.shippedAt = new Date()
    if (status === 'delivered') data.deliveredAt = new Date()
  }
  if (courierName !== undefined) data.courierName = courierName
  if (trackingNumber !== undefined) data.trackingNumber = trackingNumber

  await updateWhere('Order', { orderNumber }, data)
  const order = await findOne<Order>('Order', { orderNumber })

  if (status && order?.userId) {
    const label = status.replace(/_/g, ' ')
    await notify(order.userId, {
      type: 'ORDER_STATUS_CHANGED',
      title: `Order #${order.orderNumber} update`,
      message: `Your TapConnect order is now: ${label}.`,
      link: `/orders/${order.orderNumber}`,
    })
  }

  return NextResponse.json({ order })
}
