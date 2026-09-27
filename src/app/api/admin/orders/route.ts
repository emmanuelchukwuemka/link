import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orders = await prisma.order.findMany({
    include: { items: { include: { product: true } }, payments: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ orders })
}
