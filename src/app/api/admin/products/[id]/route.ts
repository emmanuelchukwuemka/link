import { NextRequest, NextResponse } from 'next/server'
import { updateById, removeById } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Product } from '@/lib/types'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const data = await req.json()

  const product = await updateById<Product>('Product', id, {
    name: data.name,
    subtitle: data.subtitle !== undefined ? (data.subtitle || null) : undefined,
    category: data.category,
    sku: data.sku !== undefined ? (data.sku || null) : undefined,
    stock: data.stock !== undefined ? (parseInt(data.stock, 10) || 0) : undefined,
    description: data.description,
    images: data.images !== undefined ? JSON.stringify(data.images) : undefined,
    length: data.length !== undefined ? (data.length ? parseFloat(data.length) : null) : undefined,
    width: data.width !== undefined ? (data.width ? parseFloat(data.width) : null) : undefined,
    colors: data.colors !== undefined ? JSON.stringify(data.colors) : undefined,
    priceRegular: data.priceRegular !== undefined ? parseFloat(data.priceRegular) : undefined,
    priceSale: data.priceSale !== undefined ? (data.priceSale ? parseFloat(data.priceSale) : null) : undefined,
    productionTime: data.productionTime,
    availability: data.availability,
    customizationPrice: data.customizationPrice !== undefined ? parseFloat(data.customizationPrice) : undefined,
  })

  return NextResponse.json({ product })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole('admin')
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  try {
    await removeById('Product', id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'This product has existing orders and cannot be deleted. Hide it instead.' }, { status: 409 })
  }
}
