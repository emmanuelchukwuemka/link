import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ShopHeader } from '@/components/ShopHeader'
import { MarketplaceGrid, type GridProduct } from './MarketplaceGrid'

export default async function MarketplacePage() {
  const [products, soldAgg] = await Promise.all([
    prisma.product.findMany({
      where: { availability: { not: 'hidden' } },
      orderBy: { priceRegular: 'asc' },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { paymentStatus: 'paid' } },
      _sum: { quantity: true },
    }),
  ])

  const soldByProduct = new Map(soldAgg.map((s) => [s.productId, s._sum.quantity || 0]))
  const topSellerId = soldAgg.length > 0
    ? [...soldAgg].sort((a, b) => (b._sum.quantity || 0) - (a._sum.quantity || 0))[0].productId
    : null

  const dayAgo = new Date()
  dayAgo.setDate(dayAgo.getDate() - 2)

  const gridProducts: GridProduct[] = products.map((p) => {
    const colors: string[] = p.colors ? JSON.parse(p.colors) : []
    const images: string[] = p.images ? JSON.parse(p.images) : []

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle,
      category: p.category,
      image: images[0] || null,
      colors,
      priceRegular: p.priceRegular,
      priceSale: p.priceSale,
      customizationPrice: p.customizationPrice,
      discountPct: p.priceSale ? Math.round((1 - p.priceSale / p.priceRegular) * 100) : 0,
      isBestSeller: topSellerId === p.id && (soldByProduct.get(p.id) || 0) > 0,
      isNew: p.createdAt >= dayAgo,
      createdAt: p.createdAt.getTime(),
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader />

      <div className="max-w-6xl mx-auto pt-10 pb-20 px-4 sm:px-6">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-6">
          <Link href="/" className="hover:text-black">Home</Link>
          <span>/</span>
          <span className="text-gray-600">Marketplace</span>
        </div>

        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#111111] mb-2">Marketplace</h1>
          <p className="text-gray-600 max-w-xl">
            Choose your NFC card or wristband. Every product ships with a matching QR code and connects to your TapConnect profile.
          </p>
        </div>

        <MarketplaceGrid products={gridProducts} />
      </div>
    </div>
  )
}
