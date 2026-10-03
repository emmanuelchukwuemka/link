import { findOne } from '@/lib/db'
import type { Product } from '@/lib/types'
import { getCatalogProductBySlug, CATALOG_PRODUCTS, type CatalogItem } from '@/lib/catalog'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Star, Truck, ShieldCheck, RefreshCw, Zap, CreditCard,
  ChevronRight, Sparkles, CheckCircle, Info,
} from 'lucide-react'
import ProductActions from './ProductActions'
import ProductGallery from './ProductGallery'
import { ShopHeader } from '@/components/ShopHeader'
import { fallbackVisual, getCategoryVisual } from '@/lib/productVisual'
import { ProductCard, type GridProduct } from '../ProductCard'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let product: Product | CatalogItem | null = null
  try {
    product = await findOne<Product>('Product', { slug })
  } catch {}
  if (!product) {
    product = getCatalogProductBySlug(slug) || null
  }
  if (!product) return { title: 'Product Not Found | TapConnect' }

  return {
    title: `${product.name} | TapConnect Marketplace`,
    description: product.description || 'Buy TapConnect Smart NFC hardware with instant profile connectivity.',
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let product: Product | CatalogItem | null = null

  try {
    product = await findOne<Product>('Product', { slug })
  } catch {}

  if (!product) {
    product = getCatalogProductBySlug(slug) || null
  }

  if (!product || product.availability === 'hidden') {
    notFound()
  }

  const catItem = getCatalogProductBySlug(slug)
  const colors: string[] = product.colors
    ? typeof product.colors === 'string'
      ? JSON.parse(product.colors)
      : product.colors
    : []
  const images: string[] = product.images
    ? typeof product.images === 'string'
      ? JSON.parse(product.images)
      : product.images
    : []

  const fallback = fallbackVisual(product.category)
  const catVisual = getCategoryVisual(product.category)

  const priceRegular = Number(product.priceRegular) || 15000
  const priceSale = product.priceSale ? Number(product.priceSale) : null
  const currentPrice = priceSale ?? priceRegular
  const discountPct = priceSale ? Math.round((1 - priceSale / priceRegular) * 100) : 0
  const rating = catItem?.rating ?? 4.9
  const reviewCount = catItem?.reviewCount ?? 128

  // Related products from same category or random fallback
  const relatedCatalog = CATALOG_PRODUCTS.filter(
    (p) => p.slug !== slug && (p.category === product?.category || true)
  ).slice(0, 5)

  const relatedGridProducts: GridProduct[] = relatedCatalog.map((p) => {
    const pImages = p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : []
    const pColors = p.colors ? (typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors) : []

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle,
      category: p.category,
      brand: p.brand,
      image: pImages[0] || null,
      colors: pColors,
      priceRegular: p.priceRegular,
      priceSale: p.priceSale,
      customizationPrice: p.customizationPrice,
      discountPct: p.priceSale ? Math.round((1 - p.priceSale / p.priceRegular) * 100) : 0,
      isBestSeller: p.reviewCount > 150,
      isNew: false,
      isExpress: p.isExpress,
      rating: p.rating,
      reviewCount: p.reviewCount,
      createdAt: p.createdAt.getTime(),
    }
  })

  return (
    <div className="min-h-screen bg-[#E8E5E0]">
      <ShopHeader />

      <main className="max-w-7xl mx-auto pt-4 pb-20 px-3 sm:px-6">
        {/* Breadcrumb row */}
        <nav className="flex items-center gap-1.5 text-xs text-[#66635F] mb-4 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-black">Home</Link>
          <ChevronRight size={12} />
          <Link href="/marketplace" className="hover:text-black">Marketplace</Link>
          <ChevronRight size={12} />
          <Link
            href={`/marketplace?cat=${encodeURIComponent(product.category)}#catalog`}
            className="hover:text-black font-semibold text-[#181818]"
          >
            {product.category}
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#181818] font-bold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Main Container */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
          {/* Left / Middle: Gallery + Details */}
          <div className="bg-white rounded-lg border border-[#D4D0C9] shadow-sm p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <ProductGallery
                images={images}
                category={product.category}
                productName={product.name}
              />

              {/* Product Info */}
              <div className="flex flex-col justify-between">
                <div>
                  {/* Brand & Category badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="bg-[#181818] text-white text-[11px] font-bold px-2 py-0.5 rounded">
                      Official Store
                    </span>
                    <span className="bg-[#E8E5E0] text-[#181818] text-[11px] font-semibold px-2 py-0.5 rounded">
                      {product.category}
                    </span>
                    {catItem?.isExpress && (
                      <span className="bg-[#E8E5E0] text-[#181818] border border-[#D4D0C9] text-[11px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                        <Zap size={11} className="fill-[#181818] text-[#181818]" /> TapConnect Express
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold text-[#181818] leading-snug mb-2">
                    {product.name}
                  </h1>

                  {/* Subtitle */}
                  {product.subtitle && (
                    <p className="text-xs sm:text-sm text-[#66635F] mb-3 leading-relaxed">
                      {product.subtitle}
                    </p>
                  )}

                  {/* Rating row */}
                  <div className="flex items-center gap-3 pb-3 border-b border-[#D4D0C9] mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= Math.round(rating)
                              ? 'fill-[#181818] text-[#181818]'
                              : 'fill-[#D4D0C9] text-[#D4D0C9]'
                          }
                        />
                      ))}
                      <span className="text-xs font-bold text-[#181818] ml-1">{rating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-[#66635F]">&middot;</span>
                    <span className="text-xs text-[#181818] hover:underline cursor-pointer font-medium">
                      {reviewCount} verified ratings
                    </span>
                  </div>

                  {/* Price Box */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-2xl sm:text-3xl font-black text-[#181818]">
                        &#8358;{currentPrice.toLocaleString()}
                      </span>
                      {priceSale && (
                        <>
                          <span className="text-base text-[#66635F] line-through">
                            &#8358;{priceRegular.toLocaleString()}
                          </span>
                          <span className="bg-[#181818] text-white text-xs font-extrabold px-2 py-0.5 rounded">
                            -{discountPct}%
                          </span>
                        </>
                      )}
                    </div>
                    {priceSale && (
                      <p className="text-xs font-bold text-[#181818] mt-1">
                        You save &#8358;{(priceRegular - priceSale).toLocaleString()}
                      </p>
                    )}
                    <p className="text-[11px] text-[#66635F] mt-1 flex items-center gap-1">
                      <CheckCircle size={12} className="text-[#181818]" /> In stock &middot; Ready for dispatch
                    </p>
                  </div>

                  {/* Dimensions if applicable */}
                  {(product.length || product.width) && (
                    <div className="bg-[#E8E5E0] rounded p-2.5 text-xs text-[#66635F] mb-4 flex items-center gap-2 border border-[#D4D0C9]">
                      <Info size={14} className="text-[#66635F]" />
                      <span>
                        Dimensions: {product.length ? `${product.length}cm L` : ''}
                        {product.length && product.width ? ' x ' : ''}
                        {product.width ? `${product.width}cm W` : ''} &middot; Standard Card Profile
                      </span>
                    </div>
                  )}

                  {/* Feature Highlights */}
                  {catItem?.features && catItem.features.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-[#181818] uppercase tracking-wider mb-2">Key Highlights:</p>
                      <ul className="space-y-1 text-xs text-[#66635F]">
                        {catItem.features.map((feat) => (
                          <li key={feat} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#181818]" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Actions (Add to Cart / Buy Now) */}
                <ProductActions
                  productId={product.id}
                  slug={product.slug}
                  name={product.name}
                  image={images[0] || null}
                  unitPrice={currentPrice}
                  customizationPrice={Number(product.customizationPrice) || 0}
                  colors={colors}
                />
              </div>
            </div>

            {/* Detailed Description Tab */}
            {product.description && (
              <div className="mt-10 pt-8 border-t border-[#D4D0C9]">
                <h3 className="text-base font-bold text-[#181818] uppercase tracking-wider mb-3">
                  Product Description &amp; Technical Specifications
                </h3>
                <div className="text-xs sm:text-sm text-[#66635F] leading-relaxed space-y-3 max-w-3xl">
                  <p>{product.description}</p>
                  <p>
                    All TapConnect smart cards and wearables utilize high-frequency induction transponders compatible with iPhone XS and newer, and all NFC-enabled Android devices. No battery or charging required. Profiles can be edited and updated anytime through your free TapConnect online dashboard.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Delivery & Security Guarantee */}
          <div className="space-y-4">
            {/* Delivery & Returns Card */}
            <div className="bg-white rounded-lg border border-[#D4D0C9] shadow-sm p-4 text-xs space-y-4">
              <h3 className="font-bold text-[#181818] uppercase tracking-wider text-[11px] pb-2 border-b border-[#D4D0C9]">
                DELIVERY &amp; RETURNS
              </h3>

              {/* Delivery Zone Info */}
              <div className="flex items-start gap-3">
                <span className="p-2 rounded-md bg-[#E8E5E0] text-[#181818] shrink-0 mt-0.5">
                  <Truck size={18} />
                </span>
                <div>
                  <p className="font-bold text-[#181818]">Door Delivery</p>
                  <p className="text-[#66635F] mt-0.5 leading-snug">
                    Delivery across Lagos (1-2 days), Abuja, Port Harcourt &amp; Nationwide (2-4 days).
                  </p>
                  <p className="font-semibold text-[#181818] mt-1">
                    Free shipping on orders over &#8358;30,000
                  </p>
                </div>
              </div>

              {/* Express Badge */}
              <div className="flex items-start gap-3 pt-2 border-t border-[#D4D0C9]">
                <span className="p-2 rounded-md bg-[#E8E5E0] text-[#181818] shrink-0 mt-0.5">
                  <Zap size={18} className="fill-[#181818]" />
                </span>
                <div>
                  <p className="font-bold text-[#181818]">TapConnect Express</p>
                  <p className="text-[#66635F] mt-0.5 leading-snug">
                    Ready in factory warehouse for immediate dispatch.
                  </p>
                </div>
              </div>

              {/* Return Policy */}
              <div className="flex items-start gap-3 pt-2 border-t border-[#D4D0C9]">
                <span className="p-2 rounded-md bg-[#E8E5E0] text-[#181818] shrink-0 mt-0.5">
                  <RefreshCw size={18} />
                </span>
                <div>
                  <p className="font-bold text-[#181818]">7-Day Free Replacement</p>
                  <p className="text-[#66635F] mt-0.5 leading-snug">
                    If any smart card has an NFC defect, we replace it immediately for free.
                  </p>
                </div>
              </div>

              {/* Secure Checkout */}
              <div className="flex items-start gap-3 pt-2 border-t border-[#D4D0C9]">
                <span className="p-2 rounded-md bg-[#E8E5E0] text-[#181818] shrink-0 mt-0.5">
                  <CreditCard size={18} />
                </span>
                <div>
                  <p className="font-bold text-[#181818]">100% Secure Checkout</p>
                  <p className="text-[#66635F] mt-0.5 leading-snug">
                    Powered by Paystack with 256-bit bank encryption.
                  </p>
                </div>
              </div>
            </div>

            {/* Seller Information Card */}
            <div className="bg-white rounded-lg border border-[#D4D0C9] shadow-sm p-4 text-xs space-y-3">
              <h3 className="font-bold text-[#181818] uppercase tracking-wider text-[11px] pb-2 border-b border-[#D4D0C9]">
                SELLER INFORMATION
              </h3>
              <div>
                <p className="font-extrabold text-[#181818] text-sm">TapConnect Official Store</p>
                <p className="text-[#66635F] text-[11px]">Certified Smart Hardware Manufacturer</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#D4D0C9] text-[11px]">
                <span className="text-[#66635F]">Seller Score:</span>
                <span className="font-bold text-[#181818]">99% Positive</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#66635F]">Order Fulfillment:</span>
                <span className="font-bold text-[#181818]">Excellent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Shelf */}
        <div className="mt-8 bg-white rounded-lg border border-[#D4D0C9] shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#D4D0C9]">
            <h2 className="text-base sm:text-lg font-bold text-[#181818] flex items-center gap-2">
              <Sparkles size={18} className="text-[#181818]" />
              Customers Also Viewed
            </h2>
            <Link
              href="/marketplace#catalog"
              className="text-xs font-bold text-[#181818] hover:underline uppercase"
            >
              See All 100 Products &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {relatedGridProducts.map((p) => (
              <ProductCard key={p.id} p={p} layout="grid" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
