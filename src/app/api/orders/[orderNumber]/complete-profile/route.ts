import { NextResponse } from 'next/server'
import { findOne, updateWhere } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { Order } from '@/lib/types'

// Marks the mandatory post-payment profile setup step as done. The physical
// card cannot go into production while this is outstanding.
export async function PATCH(req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { orderNumber } = await params
  const order = await findOne<Order>('Order', { orderNumber })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.paymentStatus !== 'paid') {
    return NextResponse.json({ error: 'Order has not been paid for yet' }, { status: 409 })
  }
  if (order.userId && order.userId !== authData.userId) {
    return NextResponse.json({ error: 'This order belongs to a different account' }, { status: 403 })
  }

  await updateWhere('Order', { orderNumber }, { userId: authData.userId, profileSetupRequired: false, status: 'profile_completed' })
  const updated = await findOne<Order>('Order', { orderNumber })

  return NextResponse.json({ order: updated })
}
