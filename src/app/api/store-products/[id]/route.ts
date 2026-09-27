import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { id } = await params
    const { name, description, imageUrl, price, discountPrice, category, availability, variants } = await req.json()

    const existing = await prisma.storeProduct.findUnique({ where: { id } })
    if (!existing || existing.userId !== authData.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const product = await prisma.storeProduct.update({
      where: { id },
      data: {
        name,
        description,
        imageUrl,
        price: price !== undefined ? (typeof price === 'number' ? price : parseFloat(price) || 0) : undefined,
        discountPrice: discountPrice !== undefined ? (discountPrice ? (typeof discountPrice === 'number' ? discountPrice : parseFloat(discountPrice)) : null) : undefined,
        category,
        availability,
        variants,
      }
    })

    return NextResponse.json({ product })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { id } = await params

    const existing = await prisma.storeProduct.findUnique({ where: { id } })
    if (!existing || existing.userId !== authData.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.storeProduct.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
