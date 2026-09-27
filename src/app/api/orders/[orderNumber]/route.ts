import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isPaystackConfigured } from '@/lib/paystack'

export async function GET(req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { include: { product: true } }, payments: true },
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  return NextResponse.json({ order, devMode: !isPaystackConfigured() })
}
