'use client'

import { useState, useEffect } from 'react'
import { Heart, ShoppingCart, Check } from 'lucide-react'
import { addToCart } from '@/lib/cart'
import { isWishlisted, toggleWishlist } from '@/lib/wishlist'

export function WishlistButton({ productId }: { productId: string }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(isWishlisted(productId))
  }, [productId])

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setActive(toggleWishlist(productId))
      }}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={active}
      className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs shadow-xs border border-[#D4D0C9] flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-[#66635F] hover:text-[#181818]"
    >
      <Heart size={15} className={active ? 'fill-red-500 text-red-500' : 'text-[#66635F] hover:text-red-500'} />
    </button>
  )
}

export function AddToCartButton({
  productId,
  name,
  slug,
  image,
  unitPrice,
  customizationPrice,
  color,
  size = 'md',
}: {
  productId: string
  name: string
  slug: string
  image: string | null
  unitPrice: number
  customizationPrice: number
  color?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const [added, setAdded] = useState(false)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart({
      productId,
      name,
      slug,
      image,
      unitPrice,
      color,
      customization: false,
      customizationPrice,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  const py = size === 'sm' ? 'py-1.5 text-xs' : size === 'lg' ? 'py-3 text-base' : 'py-2 text-xs sm:text-sm'

  return (
    <button
      onClick={handleAdd}
      className={`w-full flex items-center justify-center gap-1.5 rounded-md font-bold uppercase tracking-wider transition-all duration-200 shadow-xs active:scale-[0.98] border ${py} ${
        added
          ? 'bg-[#181818] text-white border-[#181818]'
          : 'bg-[#181818] hover:bg-[#181818]/90 text-white border-[#181818] hover:shadow-md'
      }`}
    >
      {added ? (
        <>
          <Check size={14} className="stroke-[3]" /> Added
        </>
      ) : (
        <>
          <ShoppingCart size={14} /> Add To Cart
        </>
      )}
    </button>
  )
}
