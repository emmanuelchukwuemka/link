import { NextResponse } from 'next/server'
import { findMany } from '@/lib/db'
import { attachOrderItems } from '@/lib/orders'
import { getCurrentUser } from '@/lib/auth'
import type { Order } from '@/lib/types'

export async function GET() {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const orderRows = await findMany<Order>('Order', { where: { userId: authData.userId }, orderBy: '`createdAt` DESC' })
  const orders = await attachOrderItems(orderRows)

  return NextResponse.json({ orders })
}
