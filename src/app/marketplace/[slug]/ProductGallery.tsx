'use client'

import { useState } from 'react'
import { fallbackVisual, getCategoryVisual } from '@/lib/productVisual'

export default function ProductGallery({
  images,
  category,
  productName,
}: {
  images: string[]
  category: string
  productName: string
}) {
  const [active, setActive] = useState(0)
  const selected = images[active]
  const fallback = fallbackVisual(category)
  const catVisual = getCategoryVisual(category)
  const CategoryIcon = catVisual.icon

  return (
    <div>
      <div className="aspect-square bg-[#E8E5E0] rounded-2xl border border-[#D4D0C9] shadow-sm flex items-center justify-center overflow-hidden">
        {selected ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected} alt={productName} className="w-full h-full object-cover" />
        ) : 'photo' in fallback ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fallback.photo} alt={productName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-3xl bg-white shadow-md flex items-center justify-center">
            <CategoryIcon size={44} style={{ color: catVisual.accentColor }} />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-6 gap-2 mt-3">
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setActive(i)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${active === i ? 'border-[#181818]' : 'border-transparent hover:border-[#D4D0C9]'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${productName} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
