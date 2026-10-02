import { NextResponse } from 'next/server'
import { findMany } from '@/lib/db'
import { attachOrderItems, attachPayments } from '@/lib/orders'
import { requireRole } from '@/lib/auth'
import type { Order } from '@/lib/types'

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orderRows = await findMany<Order>('Order', { orderBy: '`createdAt` DESC' })
  const withItems = await attachOrderItems(orderRows)
  const orders = await attachPayments(withItems)

  return NextResponse.json({ orders })
}
