import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Marks the mandatory post-payment profile setup step as done. The physical
// card cannot go into production while this is outstanding.
export async function PATCH(req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { orderNumber } = await params
  const order = await prisma.order.findUnique({ where: { orderNumber } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.paymentStatus !== 'paid') {
    return NextResponse.json({ error: 'Order has not been paid for yet' }, { status: 409 })
  }
  if (order.userId && order.userId !== authData.userId) {
    return NextResponse.json({ error: 'This order belongs to a different account' }, { status: 403 })
  }

  const updated = await prisma.order.update({
    where: { orderNumber },
    data: { userId: authData.userId, profileSetupRequired: false, status: 'profile_completed' },
  })

  return NextResponse.json({ order: updated })
}
