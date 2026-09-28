import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductActions from './ProductActions'
import { ShopHeader } from '@/components/ShopHeader'
import { fallbackVisual } from '@/lib/productVisual'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await prisma.product.findUnique({ where: { slug } })

  if (!product || product.availability === 'hidden') {
    notFound()
  }

  const colors: string[] = product.colors ? JSON.parse(product.colors) : []
  const images: string[] = product.images ? JSON.parse(product.images) : []
  const visual = images[0] ? { photo: images[0] } : fallbackVisual(product.category)

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader />
      <div className="max-w-5xl mx-auto pt-16 pb-20 px-4">
        <Link href="/marketplace" className="text-sm font-semibold text-gray-500 hover:text-black">&larr; Back to marketplace</Link>

        <div className="grid md:grid-cols-2 gap-12 mt-6">
          <div className="aspect-square bg-gradient-to-br from-[#F0F0EE] to-[#E5E5E1] rounded-3xl shadow-sm flex items-center justify-center overflow-hidden">
            {'photo' in visual ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={visual.photo} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white shadow-md flex items-center justify-center">
                <visual.icon size={36} className="text-black/70" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-4xl font-bold text-[#111111] mb-3">{product.name}</h1>
            {product.description && <p className="text-gray-600 mb-4">{product.description}</p>}

            {(product.length || product.width) && (
              <p className="text-sm text-gray-500 mb-4">
                Dimensions: {product.length ? `${product.length}cm L` : ''}{product.length && product.width ? ' x ' : ''}{product.width ? `${product.width}cm W` : ''}
              </p>
            )}

            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-3xl font-bold">&#8358;{(product.priceSale ?? product.priceRegular).toLocaleString()}</span>
              {product.priceSale && (
                <span className="text-lg text-gray-400 line-through">&#8358;{product.priceRegular.toLocaleString()}</span>
              )}
            </div>
            {product.priceSale && (
              <p className="text-sm font-semibold text-green-600 mb-6">
                You save &#8358;{(product.priceRegular - product.priceSale).toLocaleString()}
              </p>
            )}

            <p className="text-sm text-gray-500 mb-6">
              Production time: {product.productionTime} &middot; {product.availability === 'available' ? 'In stock' : product.availability.replace('_', ' ')}
            </p>

            {product.availability === 'available' ? (
              <ProductActions
                productId={product.id}
                slug={product.slug}
                name={product.name}
                image={images[0] || null}
                unitPrice={product.priceSale ?? product.priceRegular}
                customizationPrice={product.customizationPrice}
                colors={colors}
              />
            ) : (
              <p className="text-gray-500 font-semibold">This product isn&apos;t currently available for order.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
