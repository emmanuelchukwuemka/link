import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// One-time production cleanup: removes a pending test order and the two
// placeholder catalog products that leaked into the real Product table via
// the (now-removed) orders API's auto-insert-on-order fallback. Gated by
// BOOTSTRAP_SECRET like /api/admin/bootstrap — remove this route once run.
export async function POST(req: NextRequest) {
  const secret = process.env.BOOTSTRAP_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  const { secret: provided } = await req.json().catch(() => ({}))
  if (provided !== secret) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const orders = await query<{ id: string; orderNumber: string }>(
    'SELECT `id`, `orderNumber` FROM `Order` WHERE `orderNumber` = ?',
    ['TCMURNDE2PLMPX']
  )

  for (const order of orders) {
    await query('DELETE FROM `OrderItem` WHERE `orderId` = ?', [order.id])
    await query('DELETE FROM `Payment` WHERE `orderId` = ?', [order.id])
    await query('DELETE FROM `Order` WHERE `id` = ?', [order.id])
  }

  await query('DELETE FROM `Product` WHERE `id` IN (?, ?)', ['prod-001', 'prod-060'])

  return NextResponse.json({ ok: true, removedOrders: orders.map((o) => o.orderNumber) })
}
