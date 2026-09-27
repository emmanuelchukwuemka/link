'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus } from 'lucide-react'
import { addToCart } from '@/lib/cart'
import { ImageUploader } from '@/components/ImageUploader'

export default function ProductActions({
  productId, slug, name, image, unitPrice, customizationPrice, colors,
}: {
  productId: string
  slug: string
  name: string
  image: string | null
  unitPrice: number
  customizationPrice: number
  colors: string[]
}) {
  const router = useRouter()
  const [color, setColor] = useState(colors[0] || '')
  const [customization, setCustomization] = useState(false)
  const [customizationNotes, setCustomizationNotes] = useState('')
  const [customizationFileUrl, setCustomizationFileUrl] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart({
      productId, name, slug, image, unitPrice,
      color: color || undefined,
      customization,
      customizationPrice,
      customizationNotes: customization ? customizationNotes || undefined : undefined,
      customizationFileUrl: customization ? customizationFileUrl || undefined : undefined,
      quantity,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="space-y-6">
      {colors.length > 0 && (
        <div>
          <p className="font-semibold mb-2">Color</p>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`px-4 py-2 rounded-full border-2 text-sm font-medium ${color === c ? 'border-black bg-black text-white' : 'border-gray-200'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={customization} onChange={(e) => setCustomization(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm font-medium">Add customization (+&#8358;{customizationPrice.toLocaleString()})</span>
        </label>

        {customization && (
          <div className="mt-3 space-y-2 pl-6">
            <textarea
              value={customizationNotes}
              onChange={(e) => setCustomizationNotes(e.target.value)}
              placeholder="Customization instructions (e.g. name/logo placement)"
              className="w-full text-sm px-3 py-2 rounded-lg bg-gray-100 outline-none min-h-[70px]"
            />
            <div className="flex items-center gap-2">
              {customizationFileUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customizationFileUrl} alt="Design upload" className="w-10 h-10 rounded object-cover" />
              )}
              <ImageUploader
                label={customizationFileUrl ? 'Replace design' : 'Upload logo/design'}
                onUploaded={setCustomizationFileUrl}
                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-medium text-xs hover:bg-gray-200 flex items-center gap-1"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="font-semibold mb-2">Quantity</p>
        <div className="flex items-center gap-3">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <Minus size={16} />
          </button>
          <span className="w-8 text-center font-semibold">{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          className="flex-1 bg-black text-white py-4 rounded-full font-semibold text-lg hover:bg-gray-800 transition-colors"
        >
          {added ? 'Added!' : 'Add to Cart'}
        </button>
        <button
          onClick={() => { handleAdd(); router.push('/cart') }}
          className="flex-1 bg-[#000000] text-white py-4 rounded-full font-semibold text-lg hover:bg-[#000000]/90 transition-colors"
        >
          Buy Now
        </button>
      </div>
    </div>
  )
}
