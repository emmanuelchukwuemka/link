'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'

type Visual = { icon: LucideIcon } | { photo: string }

export default function ProductGallery({ images, fallback, productName }: {
  images: string[]
  fallback: Visual
  productName: string
}) {
  const [active, setActive] = useState(0)
  const selected = images[active]

  return (
    <div>
      <div className="aspect-square bg-gradient-to-br from-[#F0F0EE] to-[#E5E5E1] rounded-3xl shadow-sm flex items-center justify-center overflow-hidden">
        {selected ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected} alt={productName} className="w-full h-full object-cover" />
        ) : 'photo' in fallback ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fallback.photo} alt={productName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-white shadow-md flex items-center justify-center">
            <fallback.icon size={36} className="text-black/70" />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-6 gap-2 mt-3">
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setActive(i)}
              className={`aspect-square rounded-xl overflow-hidden border-2 transition-colors ${active === i ? 'border-black' : 'border-transparent hover:border-gray-300'}`}
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
