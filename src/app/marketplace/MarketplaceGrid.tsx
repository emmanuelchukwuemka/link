'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal } from 'lucide-react'
import { fallbackVisual } from '@/lib/productVisual'
import { WishlistButton, AddToCartButton } from './MarketplaceInteractive'

export type GridProduct = {
  id: string
  slug: string
  name: string
  subtitle: string | null
  category: string
  image: string | null
  colors: string[]
  priceRegular: number
  priceSale: number | null
  customizationPrice: number
  discountPct: number
  isBestSeller: boolean
  isNew: boolean
  createdAt: number
}

const SWATCH_COLORS: Record<string, string> = {
  Black: '#171717',
  White: '#FAFAFA',
  Brown: '#6B4226',
  Silver: '#C4C4C4',
  'Natural Wood': '#B8875A',
}

function swatchColor(name: string) {
  return SWATCH_COLORS[name] || '#9CA3AF'
}

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'newest'

const SORT_LABELS: Record<Sort, string> = {
  featured: 'Featured',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  newest: 'Newest',
}

export function MarketplaceGrid({ products }: { products: GridProduct[] }) {
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('featured')

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) counts.set(p.category, (counts.get(p.category) || 0) + 1)
    return [
      { name: 'all', label: 'All', count: products.length },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, label: name, count })),
    ]
  }, [products])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      if (q && !p.name.toLowerCase().includes(q) && !(p.subtitle || '').toLowerCase().includes(q)) return false
      return true
    })

    list = [...list]
    if (sort === 'price-asc') list.sort((a, b) => (a.priceSale ?? a.priceRegular) - (b.priceSale ?? b.priceRegular))
    else if (sort === 'price-desc') list.sort((a, b) => (b.priceSale ?? b.priceRegular) - (a.priceSale ?? a.priceRegular))
    else if (sort === 'newest') list.sort((a, b) => b.createdAt - a.createdAt)

    return list
  }, [products, category, query, sort])

  return (
    <div>
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => setCategory(c.name)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                category === c.name ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {c.label} <span className={category === c.name ? 'text-white/60' : 'text-gray-400'}>({c.count})</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 shrink-0">
          <div className="relative flex-1 sm:w-52">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white border border-gray-200 text-sm outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="relative">
            <SlidersHorizontal size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="appearance-none pl-8 pr-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-medium outline-none focus:border-black transition-colors"
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-gray-500 font-medium mb-3">No products match your search.</p>
          <button
            onClick={() => { setQuery(''); setCategory('all') }}
            className="text-sm font-semibold underline hover:text-black"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {visible.map((p) => {
            const visual = p.image ? { photo: p.image } : fallbackVisual(p.category)

            return (
              <div key={p.id} className="group bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <Link href={`/marketplace/${p.slug}`} className="relative aspect-square bg-gradient-to-br from-[#F0F0EE] to-[#E5E5E1] flex items-center justify-center overflow-hidden">
                  {'photo' in visual ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={visual.photo} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                      <visual.icon size={26} className="text-black/70" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    {p.discountPct > 0 && (
                      <span className="bg-black text-white text-xs font-bold px-2.5 py-1 rounded-full">-{p.discountPct}%</span>
                    )}
                    {p.isBestSeller && (
                      <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">Best Seller</span>
                    )}
                    {!p.isBestSeller && p.isNew && (
                      <span className="bg-white text-black text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200">New</span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <WishlistButton productId={p.id} />
                  </div>
                </Link>

                <div className="p-4 flex flex-col flex-1">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{p.category}</p>
                  <Link href={`/marketplace/${p.slug}`} className="font-bold hover:underline leading-snug">{p.name}</Link>
                  {p.subtitle && <p className="text-xs text-gray-500 mt-0.5">{p.subtitle}</p>}

                  {p.colors.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {p.colors.map((c) => (
                        <span
                          key={c}
                          title={c}
                          className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10"
                          style={{ backgroundColor: swatchColor(c) }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="mt-3">
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-bold text-lg">&#8358;{(p.priceSale ?? p.priceRegular).toLocaleString()}</span>
                      {p.priceSale && (
                        <span className="text-sm text-gray-400 line-through">&#8358;{p.priceRegular.toLocaleString()}</span>
                      )}
                    </div>
                    <AddToCartButton
                      productId={p.id}
                      name={p.name}
                      slug={p.slug}
                      image={p.image}
                      unitPrice={p.priceSale ?? p.priceRegular}
                      customizationPrice={p.customizationPrice}
                      color={p.colors[0]}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
