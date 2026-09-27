import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const products = await prisma.storeProduct.findMany({
      where: { userId: authData.userId },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json({ products })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { name, description, imageUrl, price, discountPrice, category, availability } = await req.json()

    const last = await prisma.storeProduct.findFirst({
      where: { userId: authData.userId },
      orderBy: { position: 'desc' }
    })
    const position = last ? last.position + 1 : 0

    const product = await prisma.storeProduct.create({
      data: {
        name: name || 'New Product',
        description,
        imageUrl,
        price: typeof price === 'number' ? price : parseFloat(price) || 0,
        discountPrice: discountPrice ? (typeof discountPrice === 'number' ? discountPrice : parseFloat(discountPrice)) : null,
        category,
        availability: availability || 'available',
        position,
        userId: authData.userId
      }
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
