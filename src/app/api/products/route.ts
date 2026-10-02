import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { Product } from '@/lib/types'

export async function GET() {
  const products = await query<Product>('SELECT * FROM `Product` WHERE `availability` != ? ORDER BY `priceRegular` ASC', ['hidden'])
  return NextResponse.json({ products })
}
