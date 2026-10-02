import { NextResponse } from 'next/server'
import { findOne } from '@/lib/db'
import { attachOrderItems, attachPayments } from '@/lib/orders'
import { isPaystackConfigured } from '@/lib/paystack'
import type { Order } from '@/lib/types'

export async function GET(req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params
  const orderRow = await findOne<Order>('Order', { orderNumber })
  if (!orderRow) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  const [withItems] = await attachOrderItems([orderRow])
  const [order] = await attachPayments([withItems])
  return NextResponse.json({ order, devMode: !isPaystackConfigured() })
}
