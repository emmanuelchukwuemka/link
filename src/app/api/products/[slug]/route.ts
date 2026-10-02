import { NextResponse } from 'next/server'
import { findOne } from '@/lib/db'
import type { Product } from '@/lib/types'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await findOne<Product>('Product', { slug })
  if (!product || product.availability === 'hidden') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ product })
}
