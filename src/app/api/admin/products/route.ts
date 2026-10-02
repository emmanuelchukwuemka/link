import { NextRequest, NextResponse } from 'next/server'
import { findMany, findOne, insert } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Product } from '@/lib/types'

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function GET() {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const products = await findMany<Product>('Product', { orderBy: '`createdAt` DESC' })
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const data = await req.json()
  if (!data.name || !data.priceRegular) {
    return NextResponse.json({ error: 'Name and regular price are required' }, { status: 400 })
  }

  const baseSlug = slugify(data.name) || 'product'
  let slug = baseSlug
  let suffix = 1
  while (await findOne<Product>('Product', { slug })) {
    slug = `${baseSlug}-${suffix++}`
  }

  const product = await insert<Product>('Product', {
    name: data.name,
    slug,
    subtitle: data.subtitle || null,
    category: data.category || 'NFC Cards',
    sku: data.sku || null,
    stock: data.stock !== undefined ? parseInt(data.stock, 10) || 0 : 0,
    description: data.description ?? null,
    length: data.length ? parseFloat(data.length) : null,
    width: data.width ? parseFloat(data.width) : null,
    colors: data.colors ? JSON.stringify(data.colors) : null,
    images: data.images ? JSON.stringify(data.images) : null,
    priceRegular: parseFloat(data.priceRegular),
    priceSale: data.priceSale ? parseFloat(data.priceSale) : null,
    productionTime: data.productionTime || '3-5 business days',
    availability: data.availability || 'available',
    customizationPrice: data.customizationPrice !== undefined ? parseFloat(data.customizationPrice) : 5000,
  })

  return NextResponse.json({ product }, { status: 201 })
}
