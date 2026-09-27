import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const products = await prisma.product.findMany({
    where: { availability: { not: 'hidden' } },
    orderBy: { priceRegular: 'asc' },
  })
  return NextResponse.json({ products })
}
