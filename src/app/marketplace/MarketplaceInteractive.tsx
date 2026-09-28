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
        setActive(toggleWishlist(productId))
      }}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={active}
      className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center hover:scale-105 transition-transform"
    >
      <Heart size={16} className={active ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
    </button>
  )
}

export function AddToCartButton({
  productId, name, slug, image, unitPrice, customizationPrice, color,
}: {
  productId: string
  name: string
  slug: string
  image: string | null
  unitPrice: number
  customizationPrice: number
  color?: string
}) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart({ productId, name, slug, image, unitPrice, color, customization: false, customizationPrice, quantity: 1 })
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <button
      onClick={handleAdd}
      className={`w-full flex items-center justify-center gap-1.5 rounded-full font-semibold text-sm py-2.5 transition-colors ${added ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`}
    >
      {added ? <><Check size={15} /> Added</> : <><ShoppingCart size={15} /> Add to Cart</>}
    </button>
  )
}
