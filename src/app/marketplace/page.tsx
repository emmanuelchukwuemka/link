import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function MarketplacePage() {
  const products = await prisma.product.findMany({
    where: { availability: { not: 'hidden' } },
    orderBy: { priceRegular: 'asc' },
  })

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[#111111] mb-6">TapConnect Marketplace</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your NFC card or wristband. Every product ships with a matching QR code and connects to your TapConnect profile.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p) => {
            const colors: string[] = p.colors ? JSON.parse(p.colors) : []
            return (
              <Link
                key={p.id}
                href={`/marketplace/${p.slug}`}
                className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="aspect-square bg-gray-100 rounded-2xl mb-4 flex items-center justify-center text-gray-300 font-bold text-sm">
                  {p.name}
                </div>
                <h2 className="font-bold text-lg mb-1">{p.name}</h2>
                {p.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.description}</p>}
                {colors.length > 0 && (
                  <p className="text-xs text-gray-400 mb-3">{colors.join(' / ')}</p>
                )}
                <div className="mt-auto flex items-baseline gap-2">
                  <span className="text-xl font-bold">&#8358;{(p.priceSale ?? p.priceRegular).toLocaleString()}</span>
                  {p.priceSale && (
                    <span className="text-sm text-gray-400 line-through">&#8358;{p.priceRegular.toLocaleString()}</span>
                  )}
                </div>
                {p.priceSale && (
                  <span className="text-xs font-semibold text-green-600 mt-1">
                    Save &#8358;{(p.priceRegular - p.priceSale).toLocaleString()}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {products.length === 0 && (
          <p className="text-center text-gray-500">No products available right now.</p>
        )}
      </div>
    </div>
  )
}
