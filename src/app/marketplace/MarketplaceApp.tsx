'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search, SlidersHorizontal, LayoutGrid, List, Flame, Zap,
  ShieldCheck, Truck, ArrowRight, ChevronRight, ChevronLeft, ChevronDown,
  RefreshCw, Star, X, Filter, Sparkles, Check,
  CreditCard, CircleDot, Store,
  Trees, Shield, Tag,
} from 'lucide-react'
import { ProductCard, type GridProduct } from './ProductCard'
import { getCategoryVisual } from '@/lib/productVisual'
import type { CategoryNode } from '@/lib/categoryTree'

function flattenCategories(nodes: CategoryNode[]): { name: string }[] {
  const out: { name: string }[] = []
  for (const n of nodes) {
    out.push({ name: n.name })
    for (const child of n.children) out.push({ name: child.name })
  }
  return out
}

type SortOption = 'popularity' | 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'discount'

const SORT_LABELS: Record<SortOption, string> = {
  popularity: 'Popularity / Best Sellers',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  rating: 'Customer Rating',
  newest: 'Newest Arrivals',
  discount: 'Discount: High to Low',
}

const HERO_SLIDES = [
  {
    tag: 'TAPCONNECT SHOWCASE',
    title: 'Your Digital Card,\nEveryday Freedom',
    subtitle: 'Over 100 Smart NFC Cards, Rings & Metal Badges. Tap to share your verified profile instantly with zero apps required.',
    badge: 'Up to 55% Off',
    ctaText: 'Shop All 100 Products',
    ctaHref: '#catalog',
    bgGradient: 'from-[#181818] via-[#181818] to-[#181818]',
    accentColor: '#D4D0C9',
    image: '/products/tapconnect-mini/1-hero.jpg',
  },
  {
    tag: 'LUXURY METAL SERIES',
    title: 'Aerospace Titanium &\n24K Gold NFC Cards',
    subtitle: 'Precision laser-engraved heavyweight metal cards designed for founders, executives, and luxury realtors.',
    badge: 'Free VIP Gift Box',
    ctaText: 'Explore Metal Cards',
    ctaHref: '#catalog?cat=Luxury+Metal+Cards',
    bgGradient: 'from-[#181818] via-[#181818] to-[#181818]',
    accentColor: '#D4D0C9',
    image: '/step-1-card.jpg',
  },
  {
    tag: 'NATURE & ECO LINE',
    title: '100% Organic Bamboo &\nHardwood Smart Cards',
    subtitle: 'Crafted from sustainable FSC bamboo and dark walnut timber. Organic warmth meets wireless NFC connectivity.',
    badge: 'Zero Plastic Eco',
    ctaText: 'Shop Eco Timber',
    ctaHref: '#catalog?cat=Eco+Wooden+Cards',
    bgGradient: 'from-[#181818] via-[#181818] to-[#181818]',
    accentColor: '#D4D0C9',
    image: '/step-1-card.jpg',
  },
  {
    tag: 'CORPORATE FLEETS',
    title: 'Equip Your Whole Team\nWith Smart Badges',
    subtitle: 'Centralized admin portal, employee lead capture, CRM export, and unified branding for modern companies.',
    badge: 'Enterprise Solutions',
    ctaText: 'Explore Bundles',
    ctaHref: '#catalog?cat=Executive+%26+Business+Bundles',
    bgGradient: 'from-[#181818] via-[#181818] to-[#181818]',
    accentColor: '#D4D0C9',
    image: '/step-1-card.jpg',
  },
]

const TRUST_PILLARS = [
  { icon: Truck, title: 'TapConnect Express', body: 'Fast delivery across Lagos, Abuja, PH & Nationwide' },
  { icon: ShieldCheck, title: '100% Authentic Guaranteed', body: 'Direct factory hardware with warranty protection' },
  { icon: CreditCard, title: 'Secure Paystack Checkout', body: 'Bank Transfer, Card, USSD, Apple Pay & Instant Receipt' },
  { icon: RefreshCw, title: '7-Day Easy Replacement', body: 'Hassle-free guarantee on all smart hardware' },
]

function HorizontalShelf({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  badgeBg = 'bg-[#181818]',
  viewAllHref = '#catalog',
  products,
  layout = 'flash',
}: {
  title: string
  subtitle?: string
  icon?: React.ElementType
  badgeText?: string
  badgeBg?: string
  viewAllHref?: string
  products: GridProduct[]
  layout?: 'flash' | 'grid'
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  if (products.length === 0) return null

  return (
    <div className="bg-white rounded-lg border border-[#D4D0C9] shadow-xs p-4 mb-5">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-[#D4D0C9] flex-wrap">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={20} className="text-[#181818]" />}
          <h2 className="text-base sm:text-lg font-bold text-[#181818]">{title}</h2>
          {badgeText && (
            <span className={`${badgeBg} text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`}>
              {badgeText}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-[#66635F] hidden md:inline">&middot; {subtitle}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={viewAllHref}
            className="text-xs font-bold text-[#181818] hover:text-[#66635F] flex items-center gap-1 uppercase tracking-wide hover:underline transition-colors"
          >
            See All <ChevronRight size={14} />
          </a>
          <div className="hidden sm:flex items-center gap-1 ml-2">
            <button
              onClick={() => scroll(-1)}
              aria-label="Scroll left"
              className="w-7 h-7 rounded-full bg-[#E8E5E0] border border-[#D4D0C9] hover:bg-[#D4D0C9] flex items-center justify-center text-[#181818] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Scroll right"
              className="w-7 h-7 rounded-full bg-[#E8E5E0] border border-[#D4D0C9] hover:bg-[#D4D0C9] flex items-center justify-center text-[#181818] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Shelf Items */}
      <div
        ref={scrollerRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {products.map((p) => (
          <ProductCard
            key={p.id}
            p={p}
            layout={layout}
            className="w-[160px] sm:w-[210px] md:w-[225px] shrink-0 snap-start"
          />
        ))}
      </div>
    </div>
  )
}

export function MarketplaceApp({ products, categories }: { products: GridProduct[]; categories: CategoryNode[] }) {
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('cat') || 'all')
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '')
  const [sortOption, setSortOption] = useState<SortOption>('popularity')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [itemsPerPage, setItemsPerPage] = useState<number>(24)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filters
  const [expressOnly, setExpressOnly] = useState<boolean>(searchParams.get('express') === '1')
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [minDiscount, setMinDiscount] = useState<number>(0)
  const [minRating, setMinRating] = useState<number>(0)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 150000])
  const [tempMinPrice, setTempMinPrice] = useState<string>('0')
  const [tempMaxPrice, setTempMaxPrice] = useState<string>('150000')
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState<boolean>(false)

  // Countdown timer for Flash Sale
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return { hours: 12, minutes: 0, seconds: 0 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Hero carousel auto-play
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => clearInterval(slideTimer)
  }, [])

  // Sync category count
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) {
      counts.set(p.category, (counts.get(p.category) || 0) + 1)
    }
    return counts
  }, [products])

  // Real, database-backed categories (Admin → Categories) — replaces the old hardcoded list.
  const categoryList = useMemo(() => [
    { name: 'all', label: 'All Categories' },
    ...flattenCategories(categories).map((c) => ({ name: c.name, label: c.name })),
  ], [categories])

  // Featured sections
  const flashSaleProducts = useMemo(() => {
    return products.filter((p) => p.isFlashSale || p.discountPct >= 30).slice(0, 12)
  }, [products])

  const dealsUnder15k = useMemo(() => {
    return products
      .filter((p) => (p.priceSale ?? p.priceRegular) <= 15000)
      .sort((a, b) => b.discountPct - a.discountPct)
      .slice(0, 10)
  }, [products])

  const bestSellers = useMemo(() => {
    return products
      .filter((p) => p.isBestSeller || (p.rating ?? 0) >= 4.9)
      .slice(0, 10)
  }, [products])

  // Filtered catalog
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return products.filter((p) => {
      // Category
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false

      // Search Query
      if (q) {
        const matchName = p.name.toLowerCase().includes(q)
        const matchSubtitle = (p.subtitle || '').toLowerCase().includes(q)
        const matchCategory = p.category.toLowerCase().includes(q)
        const matchBrand = (p.brand || '').toLowerCase().includes(q)
        if (!matchName && !matchSubtitle && !matchCategory && !matchBrand) return false
      }

      // Express
      if (expressOnly && !p.isExpress) return false

      // In stock
      if (inStockOnly && (p.stock ?? 0) <= 0) return false

      // Discount
      if (minDiscount > 0 && p.discountPct < minDiscount) return false

      // Rating
      if (minRating > 0 && (p.rating ?? 0) < minRating) return false

      // Price
      const currentPrice = p.priceSale ?? p.priceRegular
      if (currentPrice < priceRange[0] || currentPrice > priceRange[1]) return false

      return true
    })
  }, [products, selectedCategory, searchQuery, expressOnly, inStockOnly, minDiscount, minRating, priceRange])

  // Sorted catalog
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts]
    if (sortOption === 'price-asc') {
      list.sort((a, b) => (a.priceSale ?? a.priceRegular) - (b.priceSale ?? b.priceRegular))
    } else if (sortOption === 'price-desc') {
      list.sort((a, b) => (b.priceSale ?? b.priceRegular) - (a.priceSale ?? a.priceRegular))
    } else if (sortOption === 'rating') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    } else if (sortOption === 'newest') {
      list.sort((a, b) => b.createdAt - a.createdAt)
    } else if (sortOption === 'discount') {
      list.sort((a, b) => b.discountPct - a.discountPct)
    } else {
      list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
    }
    return list
  }, [filteredProducts, sortOption])

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedProducts.slice(start, start + itemsPerPage)
  }, [sortedProducts, currentPage, itemsPerPage])

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault()
    const min = Math.max(0, parseInt(tempMinPrice, 10) || 0)
    const max = Math.max(min, parseInt(tempMaxPrice, 10) || 150000)
    setPriceRange([min, max])
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSelectedCategory('all')
    setSearchQuery('')
    setExpressOnly(false)
    setInStockOnly(false)
    setMinDiscount(0)
    setMinRating(0)
    setPriceRange([0, 150000])
    setTempMinPrice('0')
    setTempMaxPrice('150000')
    setSortOption('popularity')
    setCurrentPage(1)
  }

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (expressOnly ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (minDiscount > 0 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 150000 ? 1 : 0)

  const slide = HERO_SLIDES[activeSlide]

  return (
    <div id="top" className="space-y-4 sm:space-y-6">
      {/* 1. TOP 2-COLUMN HERO GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-3.5 items-stretch">
        {/* Left: Category Navigation — collapsed trigger, expands on hover or click */}
        <aside
          className="hidden lg:block relative self-start"
          onMouseEnter={() => setCategoryMenuOpen(true)}
          onMouseLeave={() => setCategoryMenuOpen(false)}
        >
          <button
            onClick={() => setCategoryMenuOpen((o) => !o)}
            aria-expanded={categoryMenuOpen}
            className={`w-full flex items-center justify-between gap-2 px-3.5 py-3.5 bg-white rounded-lg border border-[#D4D0C9] shadow-xs text-sm font-bold text-[#181818] transition-colors ${categoryMenuOpen ? 'border-[#181818]' : 'hover:border-[#181818]/40'}`}
          >
            <span className="flex items-center gap-2 min-w-0">
              <LayoutGrid size={16} className="text-[#181818] shrink-0" />
              <span className="truncate">
                {selectedCategory === 'all' ? 'All Categories' : categoryList.find((c) => c.name === selectedCategory)?.label || 'All Categories'}
              </span>
            </span>
            <ChevronDown size={15} className={`text-[#66635F] shrink-0 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {categoryMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[240px] bg-white rounded-lg border border-[#D4D0C9] shadow-xl z-30 p-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
                {categoryList.map((item) => {
                  const Icon = item.name === 'all' ? LayoutGrid : getCategoryVisual(item.name).icon
                  const count = item.name === 'all' ? products.length : categoryCounts.get(item.name) || 0
                  const isSelected = selectedCategory === item.name

                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setSelectedCategory(item.name)
                        setCurrentPage(1)
                        setCategoryMenuOpen(false)
                        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-semibold transition-all text-left ${
                        isSelected
                          ? 'bg-[#181818] text-white shadow-xs'
                          : 'text-[#181818] hover:bg-[#E8E5E0]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={15} className={`shrink-0 ${isSelected ? 'text-white' : 'text-[#66635F]'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${isSelected ? 'bg-white/20 text-white font-bold' : 'text-[#66635F]'}`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="pt-2 mt-1 border-t border-[#D4D0C9] px-2 flex items-center justify-between text-[11px] text-[#66635F] font-medium">
                <span>Genuine NFC Tech</span>
                <span className="text-[#181818] font-bold">{products.length} Products</span>
              </div>
            </div>
          )}
        </aside>

        {/* Center: Hero Carousel Banner */}
        <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${slide.bgGradient} text-white p-6 sm:p-9 flex flex-col justify-between min-h-[300px] sm:min-h-[380px] shadow-sm border border-[#D4D0C9]/20`}>
          {/* Background image, covers the full banner */}
          {slide.image && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
            </>
          )}

          {/* Top slide tag */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <span className="inline-block bg-[#181818] border border-[#D4D0C9]/20 text-[#FFFFFF] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded shadow-xs">
              {slide.tag}
            </span>
            <span className="text-xs font-bold text-[#FFFFFF] bg-white/10 px-2.5 py-0.5 rounded border border-white/20">
              {slide.badge}
            </span>
          </div>

          {/* Body Content */}
          <div className="relative z-10 max-w-lg my-auto py-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-2.5 whitespace-pre-line tracking-tight text-white">
              {slide.title}
            </h1>
            <p className="text-[#D4D0C9] text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 leading-relaxed mb-5 max-w-md">
              {slide.subtitle}
            </p>
            <div className="flex items-center gap-3">
              <a
                href={slide.ctaHref}
                className="inline-flex items-center gap-2 bg-[#FFFFFF] hover:bg-[#E8E5E0] text-[#181818] text-xs sm:text-sm font-bold uppercase tracking-wider px-5 py-2.5 rounded shadow-sm transition-all active:scale-95"
              >
                {slide.ctaText} <ArrowRight size={14} />
              </a>
              <a
                href="#flash-sales"
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded border border-white/20 transition-colors"
              >
                <Flame size={14} className="text-[#D4D0C9]" /> Flash Sales
              </a>
            </div>
          </div>

          {/* Bottom slider controls */}
          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    idx === activeSlide ? 'w-6 bg-[#FFFFFF]' : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                aria-label="Previous slide"
                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                aria-label="Next slide"
                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST STRIP */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 bg-white rounded-lg border border-[#D4D0C9] shadow-xs p-3 sm:p-4">
        {TRUST_PILLARS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-center gap-3 p-1.5">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8E5E0] border border-[#D4D0C9] text-[#181818] flex items-center justify-center shrink-0">
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-xs sm:text-sm text-[#181818] truncate leading-snug">{title}</p>
              <p className="text-[11px] text-[#66635F] line-clamp-1 leading-snug mt-0.5">{body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 4. 🔥 FLASH SALES SECTION */}
      <section id="flash-sales" className="scroll-mt-24">
        <div className="bg-[#181818] text-white rounded-t-lg p-3 sm:p-4 flex items-center justify-between flex-wrap gap-3 border border-b-0 border-[#D4D0C9]/20">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-full bg-white/10">
              <Flame size={20} className="fill-white text-white" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold uppercase tracking-wider">FLASH SALES</h2>
                <span className="bg-white text-black text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                  LIMITED STOCK
                </span>
              </div>
              <p className="text-[11px] text-[#D4D0C9]">Grab top smart cards &amp; tags at up to 55% off before time expires</p>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 bg-[#181818] px-3.5 py-1.5 rounded-md border border-[#D4D0C9]/20">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4D0C9]">Time Left:</span>
            <div className="flex items-center gap-1 font-mono font-black text-sm sm:text-base">
              <span className="bg-black px-2 py-0.5 rounded text-white">{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span>:</span>
              <span className="bg-black px-2 py-0.5 rounded text-white">{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span>:</span>
              <span className="bg-black px-2 py-0.5 rounded text-[#D4D0C9]">{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-lg border-x border-b border-[#D4D0C9] p-3 sm:p-4 shadow-xs">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {flashSaleProducts.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                layout="flash"
                className="w-[165px] sm:w-[210px] shrink-0 snap-start"
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. BRAND SPOTLIGHT */}
      <section id="brands" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: 'Titanium Metal Series', desc: 'Laser engraved luxury cards', cat: 'Luxury Metal Cards', icon: Shield, badge: 'VIP Choice' },
          { title: 'Eco Bamboo Nature', desc: '100% Organic timber NFC', cat: 'Eco Wooden Cards', icon: Trees, badge: 'Zero Plastic' },
          { title: 'Smart Wearables & Rings', desc: 'Waterproof bands & ceramic rings', cat: 'Smart Rings', icon: CircleDot, badge: 'No Charging' },
          { title: 'Enterprise Hub Stands', desc: 'Counter QR stands & fleet cards', cat: 'Desk Stands & QR Displays', icon: Store, badge: 'For Retail' },
        ].map((brand) => {
          const Icon = brand.icon
          return (
            <button
              key={brand.title}
              onClick={() => {
                setSelectedCategory(brand.cat)
                setCurrentPage(1)
                document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="group text-left p-4 sm:p-5 rounded-lg bg-[#181818] text-white shadow-xs border border-[#D4D0C9]/20 hover:border-white transition-all flex flex-col justify-between min-h-[130px]"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Icon size={16} />
                </span>
                <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
                  {brand.badge}
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-xs sm:text-sm text-white transition-colors">{brand.title}</h3>
                <p className="text-[11px] text-[#D4D0C9] line-clamp-1">{brand.desc}</p>
              </div>
            </button>
          )
        })}
      </section>

      {/* 6. TOP DEALS UNDER ₦15,000 */}
      <section id="deals-under-15k">
        <HorizontalShelf
          title="Top Deals Under ₦15,000"
          subtitle="Best-value NFC cards, micro stickers and keychains"
          icon={Tag}
          badgeText="Value Picks"
          badgeBg="bg-[#181818]"
          products={dealsUnder15k}
          layout="flash"
        />
      </section>

      {/* 7. BEST SELLERS */}
      <section>
        <HorizontalShelf
          title="Best Sellers Across Nigeria"
          subtitle="Top rated digital cards trusted by 10,000+ professionals"
          icon={Sparkles}
          badgeText="Customer Favorites"
          badgeBg="bg-[#181818]"
          products={bestSellers}
          layout="flash"
        />
      </section>

      {/* 8. 📦 100-PRODUCT CATALOG */}
      <section id="catalog" className="scroll-mt-24">
        {/* Catalog Control Header */}
        <div className="bg-white rounded-t-lg border border-[#D4D0C9] shadow-xs p-3.5 sm:p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-[#181818] flex items-center gap-2">
              <span>All Products Catalog</span>
              <span className="text-xs font-semibold text-[#66635F]">
                ({sortedProducts.length} of {products.length} Products)
              </span>
            </h2>
            <p className="text-xs text-[#66635F] mt-0.5">
              Select your NFC Smart Card, Wearable, Stand or Accessory. Compatible with all iOS &amp; Android devices.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-auto">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 bg-[#E8E5E0] border border-[#D4D0C9] text-[#181818] text-xs font-bold px-3 py-2 rounded-md"
            >
              <Filter size={14} />
              <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <span className="hidden sm:inline text-xs font-semibold text-[#66635F] mr-2">Sort By:</span>
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value as SortOption)
                    setCurrentPage(1)
                  }}
                  className="appearance-none bg-[#E8E5E0] border border-[#D4D0C9] text-[#181818] font-bold text-xs rounded-md pl-3 pr-8 py-2 outline-none focus:border-[#181818] transition-colors"
                >
                  {Object.entries(SORT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <SlidersHorizontal size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66635F] pointer-events-none" />
              </div>
            </div>

            {/* View Switch */}
            <div className="hidden sm:flex items-center rounded-md border border-[#D4D0C9] overflow-hidden bg-[#E8E5E0]">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#181818] text-white' : 'text-[#66635F] hover:bg-[#D4D0C9]'}`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#181818] text-white' : 'text-[#66635F] hover:bg-[#D4D0C9]'}`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <div className="bg-[#E8E5E0] border-x border-b border-[#D4D0C9] px-4 py-2 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-[#66635F]">Active Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-white border border-[#D4D0C9] px-2 py-1 rounded-md text-[#181818] font-medium">
                {selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="hover:text-black"><X size={12} /></button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-white border border-[#D4D0C9] px-2 py-1 rounded-md text-[#181818] font-medium">
                &ldquo;{searchQuery}&rdquo;
                <button onClick={() => setSearchQuery('')} className="hover:text-black"><X size={12} /></button>
              </span>
            )}
            {expressOnly && (
              <span className="inline-flex items-center gap-1 bg-black text-white px-2 py-1 rounded-md font-bold">
                ⚡ Express Only
                <button onClick={() => setExpressOnly(false)} className="hover:text-[#D4D0C9]"><X size={12} /></button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1 bg-white border border-[#D4D0C9] px-2 py-1 rounded-md text-[#181818] font-medium">
                In Stock Only
                <button onClick={() => setInStockOnly(false)} className="hover:text-black"><X size={12} /></button>
              </span>
            )}
            {minDiscount > 0 && (
              <span className="inline-flex items-center gap-1 bg-white border border-[#D4D0C9] px-2 py-1 rounded-md text-[#181818] font-medium">
                {minDiscount}%+ Off
                <button onClick={() => setMinDiscount(0)} className="hover:text-black"><X size={12} /></button>
              </span>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 150000) && (
              <span className="inline-flex items-center gap-1 bg-white border border-[#D4D0C9] px-2 py-1 rounded-md text-[#181818] font-medium">
                &#8358;{priceRange[0].toLocaleString()} - &#8358;{priceRange[1].toLocaleString()}
                <button onClick={() => setPriceRange([0, 150000])} className="hover:text-black"><X size={12} /></button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-[#181818] hover:underline font-bold ml-auto"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Catalog Main Layout (Sidebar + Product Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-4 bg-white rounded-b-lg border-x border-b border-[#D4D0C9] p-4 shadow-xs">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block space-y-6 pr-2 border-r border-[#D4D0C9] text-xs">
            {/* 1. Category Checklist */}
            <div>
              <h3 className="font-bold text-[#181818] uppercase tracking-wider text-[11px] mb-3">
                Category
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {categoryList.map((item) => {
                  const count = item.name === 'all' ? products.length : categoryCounts.get(item.name) || 0
                  const isChecked = selectedCategory === item.name

                  return (
                    <label
                      key={item.name}
                      onClick={() => {
                        setSelectedCategory(item.name)
                        setCurrentPage(1)
                      }}
                      className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#E8E5E0] cursor-pointer select-none text-[#181818]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="radio"
                          name="category-radio"
                          checked={isChecked}
                          onChange={() => {}}
                          className="accent-[#181818]"
                        />
                        <span className={`truncate ${isChecked ? 'font-bold text-black' : 'text-[#66635F]'}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#66635F] font-mono">({count})</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* 2. Express Delivery */}
            <div className="pt-4 border-t border-[#D4D0C9]">
              <h3 className="font-bold text-[#181818] uppercase tracking-wider text-[11px] mb-2.5">
                Express Delivery
              </h3>
              <label className="flex items-center gap-2 cursor-pointer select-none p-2 bg-[#E8E5E0] rounded-md border border-[#D4D0C9]">
                <input
                  type="checkbox"
                  checked={expressOnly}
                  onChange={(e) => {
                    setExpressOnly(e.target.checked)
                    setCurrentPage(1)
                  }}
                  className="accent-[#181818] w-4 h-4 rounded"
                />
                <span className="font-bold text-[#181818] text-xs flex items-center gap-1">
                  <Zap size={13} className="fill-[#181818] text-[#181818]" />
                  TapConnect Express Only
                </span>
              </label>
            </div>

            {/* 3. Price Filter */}
            <div className="pt-4 border-t border-[#D4D0C9]">
              <h3 className="font-bold text-[#181818] uppercase tracking-wider text-[11px] mb-2.5">
                Price (&#8358;)
              </h3>
              <form onSubmit={handleApplyPrice} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tempMinPrice}
                    onChange={(e) => setTempMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-full px-2 py-1.5 rounded border border-[#D4D0C9] text-xs outline-none focus:border-[#181818]"
                  />
                  <span className="text-[#66635F]">-</span>
                  <input
                    type="number"
                    value={tempMaxPrice}
                    onChange={(e) => setTempMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-full px-2 py-1.5 rounded border border-[#D4D0C9] text-xs outline-none focus:border-[#181818]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#181818] hover:bg-[#181818] text-white font-bold py-1.5 rounded text-xs transition-colors"
                >
                  Apply Price
                </button>
              </form>
            </div>

            {/* 4. Discount Filter */}
            <div className="pt-4 border-t border-[#D4D0C9]">
              <h3 className="font-bold text-[#181818] uppercase tracking-wider text-[11px] mb-2">
                Discount Percentage
              </h3>
              <div className="space-y-1">
                {[50, 40, 30, 20, 10].map((disc) => (
                  <button
                    key={disc}
                    onClick={() => {
                      setMinDiscount(minDiscount === disc ? 0 : disc)
                      setCurrentPage(1)
                    }}
                    className={`w-full text-left px-2 py-1 rounded flex items-center justify-between transition-colors ${
                      minDiscount === disc ? 'bg-[#E8E5E0] text-[#181818] font-bold border border-[#D4D0C9]' : 'text-[#66635F] hover:bg-[#E8E5E0]'
                    }`}
                  >
                    <span>{disc}% or more</span>
                    {minDiscount === disc && <Check size={13} />}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Customer Rating */}
            <div className="pt-4 border-t border-[#D4D0C9]">
              <h3 className="font-bold text-[#181818] uppercase tracking-wider text-[11px] mb-2">
                Customer Rating
              </h3>
              <div className="space-y-1">
                {[4, 3].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      setMinRating(minRating === star ? 0 : star)
                      setCurrentPage(1)
                    }}
                    className={`w-full text-left px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                      minRating === star ? 'bg-[#E8E5E0] text-[#181818] font-bold border border-[#D4D0C9]' : 'text-[#66635F] hover:bg-[#E8E5E0]'
                    }`}
                  >
                    <div className="flex items-center gap-0.5 text-[#181818]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={11} className={s <= star ? 'fill-[#181818] text-[#181818]' : 'text-[#D4D0C9]'} />
                      ))}
                    </div>
                    <span>&amp; above</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear All */}
            <button
              onClick={handleResetFilters}
              className="w-full border border-[#D4D0C9] hover:border-black text-[#181818] font-bold py-2 rounded text-xs transition-colors"
            >
              Reset All Filters
            </button>
          </aside>

          {/* Right Product Grid Area */}
          <div className="min-w-0 flex flex-col justify-between">
            {paginatedProducts.length === 0 ? (
              <div className="text-center py-20 bg-[#E8E5E0] rounded-lg border border-dashed border-[#D4D0C9] p-8">
                <Search size={36} className="mx-auto text-[#66635F] mb-3" />
                <h3 className="text-base font-bold text-[#181818] mb-1">No products match your current filters</h3>
                <p className="text-xs text-[#66635F] mb-4 max-w-sm mx-auto">
                  Try clearing your search query, price range, or category filter to browse all 100 products.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-[#181818] hover:bg-[#181818] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded shadow-xs transition-colors"
                >
                  View All 100 Products
                </button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-3">
                {paginatedProducts.map((p) => (
                  <ProductCard key={p.id} p={p} layout="list" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {paginatedProducts.map((p) => (
                  <ProductCard key={p.id} p={p} layout="grid" />
                ))}
              </div>
            )}

            {/* Pagination & Footer Controls */}
            {sortedProducts.length > 0 && (
              <div className="mt-8 pt-5 border-t border-[#D4D0C9] flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-[#66635F]">
                  <span>Show per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="bg-[#E8E5E0] border border-[#D4D0C9] rounded px-2 py-1 text-xs font-bold text-[#181818] outline-none"
                  >
                    <option value={16}>16</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                    <option value={100}>100 (All)</option>
                  </select>
                  <span>
                    Showing {Math.min(sortedProducts.length, (currentPage - 1) * itemsPerPage + 1)} -{' '}
                    {Math.min(sortedProducts.length, currentPage * itemsPerPage)} of {sortedProducts.length} items
                  </span>
                </div>

                {/* Numbered Page Buttons */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1))
                        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="px-3 py-1.5 rounded border border-[#D4D0C9] bg-white text-xs font-bold text-[#181818] hover:bg-[#E8E5E0] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      &larr; Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          setCurrentPage(num)
                          document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                          currentPage === num
                            ? 'bg-[#181818] text-white shadow-xs'
                            : 'border border-[#D4D0C9] bg-white text-[#181818] hover:bg-[#E8E5E0]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                      className="px-3 py-1.5 rounded border border-[#D4D0C9] bg-white text-xs font-bold text-[#181818] hover:bg-[#E8E5E0] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 9. MOBILE FILTER SLIDE-OVER DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col p-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4D0C9] mb-4">
              <h3 className="font-extrabold text-sm text-[#181818] uppercase">Filters</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-[#E8E5E0] flex items-center justify-center text-[#181818]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {/* Category */}
              <div>
                <h4 className="font-bold text-[#181818] uppercase text-[11px] mb-2">Category</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {categoryList.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        setSelectedCategory(item.name)
                        setCurrentPage(1)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${
                        selectedCategory === item.name ? 'bg-[#181818] text-white font-bold' : 'text-[#181818] hover:bg-[#E8E5E0]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {selectedCategory === item.name && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Express */}
              <div className="pt-3 border-t border-[#D4D0C9]">
                <label className="flex items-center gap-2 p-2 bg-[#E8E5E0] rounded border border-[#D4D0C9] font-bold text-[#181818]">
                  <input
                    type="checkbox"
                    checked={expressOnly}
                    onChange={(e) => setExpressOnly(e.target.checked)}
                    className="accent-[#181818]"
                  />
                  <span>⚡ Express Delivery Only</span>
                </label>
              </div>

              {/* Price */}
              <div className="pt-3 border-t border-[#D4D0C9]">
                <h4 className="font-bold text-[#181818] uppercase text-[11px] mb-2">Price (&#8358;)</h4>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    value={tempMinPrice}
                    onChange={(e) => setTempMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-full px-2 py-1.5 border border-[#D4D0C9] rounded text-xs"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={tempMaxPrice}
                    onChange={(e) => setTempMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-full px-2 py-1.5 border border-[#D4D0C9] rounded text-xs"
                  />
                </div>
                <button
                  onClick={handleApplyPrice}
                  className="w-full bg-[#181818] text-white font-bold py-1.5 rounded text-xs"
                >
                  Apply Price
                </button>
              </div>

              {/* Discount */}
              <div className="pt-3 border-t border-[#D4D0C9]">
                <h4 className="font-bold text-[#181818] uppercase text-[11px] mb-2">Discount</h4>
                <div className="space-y-1">
                  {[40, 30, 20].map((d) => (
                    <button
                      key={d}
                      onClick={() => setMinDiscount(minDiscount === d ? 0 : d)}
                      className={`w-full text-left px-2 py-1 rounded ${minDiscount === d ? 'bg-[#E8E5E0] text-[#181818] font-bold border border-[#D4D0C9]' : 'text-[#66635F]'}`}
                    >
                      {d}% or more
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#D4D0C9] flex gap-2">
                <button
                  onClick={handleResetFilters}
                  className="flex-1 border border-[#D4D0C9] py-2.5 rounded font-bold text-[#181818] text-xs"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 bg-[#181818] text-white py-2.5 rounded font-bold text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. FOOTER WITH BRAND COLORS */}
      <footer className="bg-[#181818] text-white rounded-lg p-6 sm:p-10 mt-10 space-y-8 border border-[#D4D0C9]/15">
        {/* Newsletter Signup Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#D4D0C9]/15">
          <div>
            <span className="text-[#D4D0C9] font-bold text-xs uppercase tracking-wider">NEW TO TAPCONNECT?</span>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 text-white">Subscribe to our newsletter for ₦2,000 Off</h3>
            <p className="text-[#D4D0C9] text-xs mt-1">Get flash sale updates, new smart card releases and exclusive corporate discounts.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              alert('Thank you for subscribing! Your voucher code: TAPWELCOME')
            }}
            className="flex w-full md:w-auto min-w-[320px] max-w-md rounded-md overflow-hidden bg-white p-1"
          >
            <input
              type="email"
              placeholder="Enter your email address..."
              required
              className="px-3 py-2 text-xs sm:text-sm text-[#181818] outline-none flex-1 bg-transparent"
            />
            <button
              type="submit"
              className="bg-[#181818] hover:bg-[#181818] text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* 4-Column Directory */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-[#D4D0C9]">
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">NEED HELP?</h4>
            <ul className="space-y-2">
              <li><Link href="/#faq" className="hover:text-white transition-colors">Help Center &amp; FAQs</Link></li>
              <li><Link href="/track-order" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><Link href="/#contact" className="hover:text-white transition-colors">Contact Customer Care</Link></li>
              <li><a href="tel:08008272666" className="text-white font-bold">0800-TAPCONNECT</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">ABOUT TAPCONNECT</h4>
            <ul className="space-y-2">
              <li><Link href="/#about" className="hover:text-white transition-colors">About Our Marketplace</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/register?type=business" className="hover:text-white transition-colors">Corporate Enterprise</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">BUYING ON TAPCONNECT</h4>
            <ul className="space-y-2">
              <li><a href="#flash-sales" className="hover:text-white transition-colors">Flash Sales &amp; Deals</a></li>
              <li><a href="#catalog?express=1" className="hover:text-white transition-colors">TapConnect Express Delivery</a></li>
              <li><Link href="/wishlist" className="hover:text-white transition-colors">Saved Wishlist Items</Link></li>
              <li><Link href="/checkout" className="hover:text-white transition-colors">Cart &amp; Checkout</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">PAYMENT &amp; LOGISTICS</h4>
            <p className="text-[11px] text-[#D4D0C9] leading-relaxed mb-3">
              We accept Paystack, Mastercard, Visa, Verve, and Bank Transfers across all 36 states in Nigeria.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/10 text-white font-mono text-[10px] px-2 py-1 rounded">PAYSTACK</span>
              <span className="bg-white/10 text-white font-mono text-[10px] px-2 py-1 rounded">VISA</span>
              <span className="bg-white/10 text-white font-mono text-[10px] px-2 py-1 rounded">MASTERCARD</span>
              <span className="bg-white/10 text-white font-mono text-[10px] px-2 py-1 rounded">VERVE</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-[#D4D0C9]/15 flex items-center justify-between text-[11px] text-[#66635F] flex-wrap gap-3">
          <p>&copy; {new Date().getFullYear()} TapConnect Nigeria. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <Link href="/login" className="hover:text-white transition-colors">Merchant Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
