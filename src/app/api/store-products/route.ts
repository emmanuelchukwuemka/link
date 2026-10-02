import { NextRequest, NextResponse } from 'next/server'
import { findMany, insert } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { StoreProduct } from '@/lib/types'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const products = await findMany<StoreProduct>('StoreProduct', { where: { userId: authData.userId }, orderBy: '`position` ASC' })

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

    const [last] = await findMany<StoreProduct>('StoreProduct', { where: { userId: authData.userId }, orderBy: '`position` DESC', limit: 1 })
    const position = last ? last.position + 1 : 0

    const product = await insert<StoreProduct>('StoreProduct', {
      name: name || 'New Product',
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      price: typeof price === 'number' ? price : parseFloat(price) || 0,
      discountPrice: discountPrice ? (typeof discountPrice === 'number' ? discountPrice : parseFloat(discountPrice)) : null,
      category: category ?? null,
      availability: availability || 'available',
      position,
      userId: authData.userId,
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
