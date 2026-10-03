import { Suspense } from 'react'
import { query } from '@/lib/db'
import type { Category, Product } from '@/lib/types'
import { buildCategoryTree } from '@/lib/categoryTree'
import { ShopHeader } from '@/components/ShopHeader'
import { MarketplaceApp } from './MarketplaceApp'
import type { GridProduct } from './ProductCard'

export const metadata = {
  title: 'TapConnect Marketplace | Nigeria’s Premier Smart NFC E-Commerce Store',
  description: 'Shop over 100 smart NFC cards, luxury metal cards, bamboo wooden cards, wristbands, smart rings, desk stands, and accessories. Fast nationwide delivery.',
}

export default async function MarketplacePage() {
  let dbProducts: Product[] = []
  let soldAgg: { productId: string; qty: number }[] = []
  let dbCategories: Category[] = []

  try {
    const [p, s, c] = await Promise.all([
      query<Product>('SELECT * FROM `Product` WHERE `availability` != ? ORDER BY `priceRegular` ASC', ['hidden']),
      query<{ productId: string; qty: number }>(
        `SELECT oi.\`productId\` as productId, SUM(oi.\`quantity\`) as qty
         FROM \`OrderItem\` oi JOIN \`Order\` o ON o.\`id\` = oi.\`orderId\`
         WHERE o.\`paymentStatus\` = ? GROUP BY oi.\`productId\``,
        ['paid']
      ),
      query<Category>('SELECT * FROM `Category` WHERE `scope` = ? ORDER BY `position` ASC', ['marketplace']),
    ])
    dbProducts = p || []
    soldAgg = s || []
    dbCategories = c || []
  } catch {
    dbProducts = []
    soldAgg = []
    dbCategories = []
  }

  const soldByProduct = new Map(soldAgg.map((s) => [s.productId, Number(s.qty) || 0]))
  const topSellerId = soldAgg.length > 0
    ? [...soldAgg].sort((a, b) => Number(b.qty || 0) - Number(a.qty || 0))[0].productId
    : null

  const dayAgo = new Date()
  dayAgo.setDate(dayAgo.getDate() - 14)

  const gridProducts: GridProduct[] = dbProducts.map((p) => {
    const colors: string[] = p.colors ? (typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors) : []
    const images: string[] = p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : []

    const priceRegular = Number(p.priceRegular) || 15000
    const priceSale = p.priceSale ? Number(p.priceSale) : null
    const discountPct = priceSale ? Math.round((1 - priceSale / priceRegular) * 100) : 0
    const createdAtTime = p.createdAt instanceof Date ? p.createdAt.getTime() : new Date(p.createdAt).getTime()

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle,
      category: p.category,
      brand: 'TapConnect',
      image: images[0] || null,
      colors,
      priceRegular,
      priceSale,
      customizationPrice: Number(p.customizationPrice) || 0,
      discountPct,
      isBestSeller: topSellerId === p.id,
      isNew: createdAtTime >= dayAgo.getTime(),
      stock: p.stock ?? 0,
      createdAt: createdAtTime,
    }
  })

  const categoryTree = buildCategoryTree(dbCategories, dbProducts)

  return (
    <div className="min-h-screen bg-[#E8E5E0] text-[#181818]">
      <ShopHeader />

      <main className="max-w-7xl mx-auto pt-3 pb-20 px-2 sm:px-4 lg:px-6">
        <Suspense fallback={<div className="p-12 text-center text-[#66635F] font-semibold">Loading marketplace...</div>}>
          <MarketplaceApp products={gridProducts} categories={categoryTree} />
        </Suspense>
      </main>
    </div>
  )
}
